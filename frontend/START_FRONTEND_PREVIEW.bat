@echo off
setlocal EnableExtensions
cd /d "%~dp0"

set "PREVIEW_URL=http://127.0.0.1:5173/"

where py.exe >nul 2>&1
if not errorlevel 1 goto RUN_PY

where python.exe >nul 2>&1
if not errorlevel 1 goto RUN_PYTHON

echo.
echo [ERROR] Python 3 is not installed or not available in PATH.
echo You can use OPEN_FRONTEND_DIRECT.bat instead.
echo.
pause
exit /b 1

:RUN_PY
start "" "%PREVIEW_URL%"
py -3 -m http.server 5173 --bind 127.0.0.1
exit /b %errorlevel%

:RUN_PYTHON
start "" "%PREVIEW_URL%"
python -m http.server 5173 --bind 127.0.0.1
exit /b %errorlevel%
