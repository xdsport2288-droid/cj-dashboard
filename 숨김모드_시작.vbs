Set WshShell = CreateObject("WScript.Shell")
' 0은 창을 완전히 숨김(Hidden), False는 스크립트가 끝날 때까지 기다리지 않음을 의미합니다.
WshShell.Run "cmd /c 자동감지시작.bat", 0, False
