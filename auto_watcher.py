import sys
sys.stdout.reconfigure(encoding='utf-8')
import time
import os
import subprocess
from datetime import datetime
import glob

def get_mtime(f):
    return os.path.getmtime(f) if os.path.exists(f) else 0

def show_notification(title, message):
    vbs_code = f"""
Set WshShell = CreateObject("WScript.Shell")
WshShell.Popup "{message}", 3, "{title}", 64
"""
    vbs_path = os.path.join(os.environ.get("TEMP", "."), "notify.vbs")
    with open(vbs_path, "w", encoding="utf-16") as f:
        f.write(vbs_code)
    # 백그라운드(비동기)로 실행하여 파이썬 스크립트가 멈추지 않게 함
    subprocess.Popen(["wscript", vbs_path])

print("==================================================")
print("엑셀/CSV 파일 자동 감지기가 실행되었습니다!")
print("감시 대상: 이 폴더의 모든 xlsx 및 csv 파일")
print("창을 끄지 말고 백그라운드에 켜두시면 알아서 작동합니다.")
print("==================================================\n")

show_notification("자동 감지 시작됨", "이제 폴더에 엑셀이 업데이트되면 자동으로 배포됩니다.")

last_mtimes = {}
while True:
    changed = False
    current_files = glob.glob("*.xlsx") + glob.glob("*.csv")
    for f in current_files:
        mtime = get_mtime(f)
        if f not in last_mtimes:
            last_mtimes[f] = mtime
        elif mtime > last_mtimes[f]:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] '{f}' 수정 감지됨!")
            last_mtimes[f] = mtime
            changed = True

    if changed:
        print("1. JSON 변환 스크립트 실행 중...")
        show_notification("변경 감지됨", "엑셀 데이터 변환 및 서버 배포를 시작합니다...")
        NO_WINDOW = 0x08000000
        subprocess.run(["python", "convert_excel_to_json.py"], env={**os.environ, "PYTHONIOENCODING": "utf-8"}, creationflags=NO_WINDOW)
        print("2. 깃허브 서버로 자동 업로드(Push) 중...")
        subprocess.run(["git", "add", "dashboard_data.json"], creationflags=NO_WINDOW)
        subprocess.run(["git", "commit", "-m", "Auto-sync: Update dashboard data"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, creationflags=NO_WINDOW)
        push_result = subprocess.run(["git", "push"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, creationflags=NO_WINDOW)
        if push_result.returncode == 0:
            print("3. 서버 업로드 완료! (대시보드가 곧 자동으로 갱신됩니다)\n")
            show_notification("배포 성공!", "서버에 데이터가 성공적으로 업로드되었습니다. 5초 뒤 대시보드에 반영됩니다.")
        else:
            print("깃허브 업로드 실패. 네트워크 상태나 충돌을 확인하세요.\n")
            show_notification("배포 실패", "업로드 중 오류가 발생했습니다. 터미널 창을 확인해주세요.")
    time.sleep(3)
