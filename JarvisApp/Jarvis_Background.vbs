Set WshShell = CreateObject("WScript.Shell")

' 1. Start the Node backend invisibly
WshShell.Run "cmd /c node jarvis-brain.js", 0, False

' 2. Start the React frontend in the background
WshShell.Run "cmd /c npm run dev", 0, False

' Wait a few seconds for the dev server to boot
WScript.Sleep 5000

' 3. Open the UI as a standalone Chrome App (looks native, can run in background)
WshShell.Run "chrome.exe --app=http://localhost:5173", 1, False
