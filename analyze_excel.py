import pandas as pd
import json

file_path = '위니온.xlsx'

try:
    print(f"[{file_path}] 파일 분석을 시작합니다...\n" + "="*50)
    
    # 엑셀 파일 읽기
    xls = pd.ExcelFile(file_path)
    sheet_names = xls.sheet_names
    print(f"✅ 총 {len(sheet_names)}개의 시트가 발견되었습니다: {sheet_names}\n")
    
    for sheet in sheet_names:
        print(f"--- [시트명: {sheet}] 분석 ---")
        df = pd.read_excel(xls, sheet_name=sheet)
        
        columns = df.columns.tolist()
        print(f"📌 총 {len(columns)}개 컬럼: {columns}")
        
        print(f"📄 데이터 샘플 (최상위 3행):")
        print(df.head(3).to_string(index=False))
        print("-" * 50 + "\n")
        
    print("✅ 분석이 완료되었습니다. 위 결과를 복사하여 AI(저)에게 전달해 주시면 대시보드 연동 작업을 진행하겠습니다.")
    
except Exception as e:
    print(f"❌ 엑셀 파일을 분석하는 도중 오류가 발생했습니다: {e}\n(pandas와 openpyxl이 설치되어 있지 않다면 'pip install pandas openpyxl'을 먼저 실행해 주세요.)")
