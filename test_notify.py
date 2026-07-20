import os
import subprocess
def show_notification(title, message):
    ps_code = f"""
[void] [System.Reflection.Assembly]::LoadWithPartialName("System.Windows.Forms")
$objNotifyIcon = New-Object System.Windows.Forms.NotifyIcon
$objNotifyIcon.Icon = [System.Drawing.SystemIcons]::Information
$objNotifyIcon.BalloonTipIcon = "Info"
$objNotifyIcon.BalloonTipTitle = "{title}"
$objNotifyIcon.BalloonTipText = "{message}"
$objNotifyIcon.Visible = $True
$objNotifyIcon.ShowBalloonTip(3000)
Start-Sleep -Seconds 3
$objNotifyIcon.Dispose()
"""
    ps_path = os.path.join(os.environ.get('TEMP', '.'), 'notify.ps1')
    with open(ps_path, 'w', encoding='utf-8') as f:
        f.write(ps_code)
    subprocess.Popen(['powershell', '-WindowStyle', 'Hidden', '-ExecutionPolicy', 'Bypass', '-File', ps_path], creationflags=0x08000000)

show_notification('테스트', '우측 하단 알림 테스트입니다.')
