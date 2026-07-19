import sys
sys.stdout.reconfigure(encoding='utf-8')
import pandas as pd
import json
import os
import sys
import glob
from datetime import datetime
import tempfile
import shutil

print("엑셀 데이터 변환 시작...")

# 가장 최근에 수정된 xlsx 파일 찾기
xlsx_files = glob.glob("*.xlsx")
if not xlsx_files:
    print("❌ xlsx 파일을 찾을 수 없습니다!")
    sys.exit(1)

# 가장 최근에 수정된 xlsx 파일 찾기
# 임시 파일(~$) 제외
xlsx_files = [f for f in xlsx_files if "~$" not in os.path.basename(f)]
if not xlsx_files:
    print("❌ 처리할 수 있는 엑셀 파일이 없습니다.")
    sys.exit(1)

file_path = max(xlsx_files, key=os.path.getmtime)
print(f"👉 감지된 파일: {file_path}")

try:
    # 엑셀 파일이 열려있을 때 발생하는 PermissionError를 방지하기 위해 임시 파일로 복사 후 읽기
    temp_dir = tempfile.gettempdir()
    temp_file = os.path.join(temp_dir, "temp_winnion.xlsx")
    shutil.copy2(file_path, temp_file)
    
    try:
        # 데이터 읽기 (문자열 타입 지정)
        df = pd.read_excel(temp_file, dtype=str)
    finally:
        # 임시 파일 삭제
        if os.path.exists(temp_file):
            os.remove(temp_file)
            
    # NaN 값 빈 문자열로 처리
    df = df.fillna("")
    
    # datetime 객체가 있으면 문자열로 변환
    for col in df.columns:
        if pd.api.types.is_datetime64_any_dtype(df[col]):
            df[col] = df[col].dt.strftime('%Y-%m-%d %H:%M:%S')
            
    records = df.to_dict(orient='records')
    
    # 프론트엔드가 기대하는 JSON 키 구조로 매핑 (엑셀 컬럼명이 변경된 것에 대응)
    mapped_records = []
    for row in records:
        mapped_row = {
            "주문 상태": row.get("접수상태", ""),
            "접수번호": row.get("접수번호", ""),
            "화주명": row.get("화주사", ""),
            "상차지명": row.get("출발지명", ""),
            "하차지명": row.get("도착지명", ""),
            "하차지 주소": row.get("도착지주소", ""),
            "하차지 상세 주소": "",
            "요청 차량": row.get("차량정보", ""),
            "요청 톤급": "",
            "상차 요청 일시": row.get("출발일시", ""),
            "하차 요청 일시": row.get("도착일시", ""),
            "차량번호": "",
            "운전자명": row.get("접수자", ""),
            "매출 금액": "",
            "총 매출 금액": row.get("운임", ""),
            "매입 금액": "",
            "총 매입 금액": "",
            "주문 일시": row.get("접수일자", ""),
            "경유지": row.get("경유지개수", 0),
            "수량": row.get("차량대수", 1),
            "비고": row.get("비고", ""),
            "간선사": row.get("간선사", ""),
            "운송사": "",
            "소속": "",
            "추가운임": row.get("추가비", 0)
        }
        mapped_records.append(mapped_row)
    
    output = {
        "last_updated": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        "data": mapped_records
    }
    
    with open('dashboard_data.json', 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
        
    print(f"✅ 변환 완료! 총 {len(records)}건의 데이터가 저장되었습니다.")
except Exception as e:
    print(f"❌ 변환 중 오류 발생: {e}")
    sys.exit(1)
