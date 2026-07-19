import sys
sys.stdout.reconfigure(encoding='utf-8')
import pandas as pd
import json
from datetime import datetime
import os
import glob

print("엑셀 데이터 변환 시작...")

# 가장 최근에 수정된 xlsx 파일 찾기
xlsx_files = glob.glob("*.xlsx")
if not xlsx_files:
    print("❌ xlsx 파일을 찾을 수 없습니다!")
    sys.exit(1)

file_path = max(xlsx_files, key=os.path.getmtime)
print(f"👉 감지된 파일: {file_path}")

try:
    df = pd.read_excel(file_path)
    df = df.fillna("")
    
    # datetime 객체가 있으면 문자열로 변환
    for col in df.columns:
        if pd.api.types.is_datetime64_any_dtype(df[col]):
            df[col] = df[col].dt.strftime('%Y-%m-%d %H:%M:%S')
            
    records = df.to_dict(orient='records')
    
    output = {
        "last_updated": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        "data": records
    }
    
    with open('dashboard_data.json', 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
        
    print(f"✅ 변환 완료! 총 {len(records)}건의 데이터가 저장되었습니다.")
except Exception as e:
    print(f"❌ 변환 중 오류 발생: {e}")
    sys.exit(1)
