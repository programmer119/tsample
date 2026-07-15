@echo off
chcp 65001 >nul
cd /d "%~dp0"
if not exist node_modules (
  call npm ci
  if errorlevel 1 goto :error
)
set PORT=8080
set RENDER_KEY=temperament-test-renderer
set PUPPETEER_EXECUTABLE_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe
if not exist "%PUPPETEER_EXECUTABLE_PATH%" set PUPPETEER_EXECUTABLE_PATH=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe
node server.js
exit /b 0
:error
echo 설치 또는 실행에 실패했습니다.
pause
exit /b 1
