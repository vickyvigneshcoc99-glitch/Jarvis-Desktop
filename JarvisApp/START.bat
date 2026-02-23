@echo off
title JARVIS - STARK INDUSTRIES launcher
echo ========================================
echo       STARK INDUSTRIES - BOOT SECTOR
echo ========================================
echo.
echo [!] Attempting to initialize JARVIS Brain...
echo.

:: Check for Python
where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [!] Python detected. Initializing British Voice Engine...
    python -m pip install flask flask-cors pyttsx3 speechrecognition psutil pyautogui --quiet
    start /b python jarvis.py
) else (
    echo [!] Python not found. Falling back to Node.js Brain...
    start /b node jarvis-brain.js
)

echo.
echo [!] Launching Futuristic HUD...
echo.
start http://localhost:5173
npm run web
pause
