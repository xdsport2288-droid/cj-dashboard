import time
import os
import subprocess
from datetime import datetime

# 감시할 파일 목록
WATCH_FILES = ["위니온.xlsx", "운송데이터_추출결과.csv"]
last_mtimes = {f: 0 for f in WATCH_FILES}

def get_mtime(filepath):
    try:
        return os.path.getmtime(filepath)
    except FileNotFoundError:
        return 0

# 초기 시간 기록
for f in WATCH_FILES:
    last_mtimes[f] = get_mtime(f)

print("==================================================")
print("👀 엑셀/CSV 파일 자동 감지기가 실행되었습니다!")
print(f"📂 감시 대상: {', '.join(WATCH_FILES)}")
print("💡 창을 끄지 말고 백그라운드에 켜두시면 알아서 작동합니다.")
print("==================================================\n")

while True:
    changed = False
    for f in WATCH_FILES:
        current_mtime = get_mtime(f)
        if current_mtime > last_mtimes[f]:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] 🚨 '{f}' 수정 감지됨!")
            last_mtimes[f] = current_mtime
            changed = True
            
    if changed:
        print("🔄 1. JSON 변환 스크립트 실행 중...")
        # cp949 인코딩 에러 방지를 위해 환경변수 설정 후 실행
        subprocess.run(["python", "convert_excel_to_json.py"], shell=True, env={**os.environ, "PYTHONIOENCODING": "utf-8"})
        
        print("☁️ 2. 깃허브 서버로 자동 업로드(Push) 중...")
        subprocess.run(["git", "add", "dashboard_data.json"], shell=True)
        subprocess.run(["git", "commit", "-m", "Auto-sync: Update dashboard data"], shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        push_result = subprocess.run(["git", "push"], shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        if push_result.returncode == 0:
            print("✅ 3. 서버 업로드 완료! (대시보드가 곧 자동으로 갱신됩니다)\n")
        else:
            print("❌ 깃허브 업로드 실패. 네트워크 상태나 충돌을 확인하세요.\n")
            
    time.sleep(3) # 3초마다 감시
