Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "c:\Users\Rainpsy\.gemini\antigravity-ide\scratch\cj-dashboard"
WshShell.Run "python auto_watcher.py", 0, False
