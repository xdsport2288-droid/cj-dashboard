import sys
sys.stdout.reconfigure(encoding='utf-8')
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

# 윈도우 알림 팝업 함수
def show_notification(title, message):
    ps_script = f"""
    [Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms') | Out-Null
    $notify = New-Object System.Windows.Forms.NotifyIcon
    $notify.Icon = [System.Drawing.SystemIcons]::Information
    $notify.Visible = $true
    $notify.ShowBalloonTip(0, '{title}', '{message}', [System.Windows.Forms.ToolTipIcon]::Info)
    Start-Sleep -s 3
    $notify.Dispose()
    """
    subprocess.Popen(["powershell", "-Command", ps_script], creationflags=0x08000000)

print("==================================================")
print("👀 엑셀/CSV 파일 자동 감지기가 실행되었습니다!")
print(f"📂 감시 대상: {', '.join(WATCH_FILES)}")
print("💡 창을 끄지 말고 백그라운드에 켜두시면 알아서 작동합니다.")
print("==================================================\n")

# 알림 시작
show_notification("자동 감지 시작됨", "이제 엑셀을 저장하면 자동으로 깃허브에 업로드됩니다.")

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
        show_notification("변경 감지됨", "엑셀 데이터 변환 및 서버 배포를 시작합니다...")
        
        # subprocess 창 숨기기 플래그
        NO_WINDOW = 0x08000000
        
        # cp949 인코딩 에러 방지를 위해 환경변수 설정 후 실행
        subprocess.run(["python", "convert_excel_to_json.py"], shell=True, env={**os.environ, "PYTHONIOENCODING": "utf-8"}, creationflags=NO_WINDOW)
        
        print("☁️ 2. 깃허브 서버로 자동 업로드(Push) 중...")
        subprocess.run(["git", "add", "dashboard_data.json"], shell=True, creationflags=NO_WINDOW)
        subprocess.run(["git", "commit", "-m", "Auto-sync: Update dashboard data"], shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, creationflags=NO_WINDOW)
        push_result = subprocess.run(["git", "push"], shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, creationflags=NO_WINDOW)
        
        if push_result.returncode == 0:
            print("✅ 3. 서버 업로드 완료! (대시보드가 곧 자동으로 갱신됩니다)\n")
            show_notification("배포 성공!", "서버에 데이터가 성공적으로 업로드되었습니다. 5초 뒤 대시보드에 반영됩니다.")
        else:
            print("❌ 깃허브 업로드 실패. 네트워크 상태나 충돌을 확인하세요.\n")
            show_notification("배포 실패", "업로드 중 오류가 발생했습니다. 터미널 창을 확인해주세요.")
            
    time.sleep(3) # 3초마다 감시
