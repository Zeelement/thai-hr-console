@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================
echo   Thai HR Console - LAN preview server
echo ============================================
echo.
echo   This computer : http://127.0.0.1:8000
echo   Colleagues    : http://YOUR-LAN-IP:8000
echo                   (run: ipconfig  to find IPv4)
echo.
echo   NOTE: this only shares the PAGE, not the data.
echo         Each browser keeps its own localStorage.
echo.
echo   Press Ctrl+C to stop the server.
echo ============================================
echo.
python -m http.server 8000
pause
