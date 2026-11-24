@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ============================================
echo  Thai HR Console  -  Django + Vue + SQL Server
echo ============================================
echo.

where python >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Python not found. Install Python 3.10+ and add it to PATH.
  pause
  exit /b 1
)

rem ---- SQL Server connection (override by setting these before running) ----
if "%HR_DB_HOST%"=="" set HR_DB_HOST=localhost
if "%HR_DB_PORT%"=="" set HR_DB_PORT=1433
if "%HR_DB_NAME%"=="" set HR_DB_NAME=HRConsole
if "%HR_DB_USER%"=="" set HR_DB_USER=sa
rem ---- SQL password: put it after the "=" on the next line, e.g. set "HR_DB_PASSWORD=mypass" ----
rem ---- You can also set HR_DB_PASSWORD as an environment variable before running (env var wins). ----
if not defined HR_DB_PASSWORD set "HR_DB_PASSWORD=123456"
if "%HR_DB_DRIVER%"=="" set HR_DB_DRIVER=ODBC Driver 17 for SQL Server
if "%HR_PORT%"=="" set HR_PORT=8000
rem ---- Local SQL Server with TCP/IP disabled: use Shared Memory (no TCP port). ----
rem ---- Set HR_DB_LOCAL=0 to connect over TCP using HR_DB_HOST / HR_DB_PORT. ----
if not defined HR_DB_LOCAL set HR_DB_LOCAL=1

echo Current SQL Server connection settings:
if "%HR_DB_LOCAL%"=="1" (
  echo   Mode   : LOCAL (Shared Memory, no TCP port^)
) else (
  echo   Mode   : TCP
)
echo   Host   : %HR_DB_HOST%
echo   Port   : %HR_DB_PORT%
echo   DB     : %HR_DB_NAME%
echo   User   : %HR_DB_USER%
echo   Driver : %HR_DB_DRIVER%
echo   Password: set at top of this file or via HR_DB_PASSWORD variable
echo.

echo [1/7] Checking Python dependencies...
python -c "import sys; print('  Interpreter:', sys.executable); print('  Version:', sys.version.split()[0])"
python -m pip install --disable-pip-version-check -r requirements.txt
if errorlevel 1 (
  echo [ERROR] Dependency installation failed. See the interpreter above.
  pause
  exit /b 1
)
python -c "import importlib.util; assert importlib.util.find_spec('mssql') or importlib.util.find_spec('mssql_django'), 'backend missing'"
if errorlevel 1 (
  echo [ERROR] SQL Server backend not available under this interpreter.
  pause
  exit /b 1
)

echo [2/7] SQL Server password ...
if defined HR_DB_PASSWORD (
  echo   Password provided (from top of this file or HR_DB_PASSWORD variable^).
) else (
  echo   Password NOT set - connecting with an empty password.
  echo   Set it at the "HR_DB_PASSWORD" line near the top of start.bat.
)

echo [3/7] Connecting to master and creating database if missing ...
python manage.py ensure_db
if errorlevel 1 (
  echo [ERROR] Cannot reach SQL Server or create the database. Nothing else was changed.
  echo          Check HOST / PORT / USER / PASSWORD / firewall, and that the
  echo          SQL Server service is running and accepts remote connections.
  pause
  exit /b 1
)

echo [4/7] Testing database connection ...
python check_db.py
if errorlevel 1 (
  echo [ERROR] Cannot connect to SQL Server. Nothing was changed.
  echo          Correct the settings shown above, then run start.bat again.
  pause
  exit /b 1
)

echo [5/7] Applying database migrations ...
python manage.py migrate --noinput
if errorlevel 1 (
  echo [ERROR] Migration failed. See the message above for the exact cause.
  pause
  exit /b 1
)

echo [6/7] Preparing login account ...
python manage.py seed_hr
if errorlevel 1 (
  echo [ERROR] Failed to prepare default account.
  pause
  exit /b 1
)

echo [7/7] Starting service ...
echo.
echo   Local   : http://127.0.0.1:%HR_PORT%/
echo   LAN     : http://YOUR-LAN-IP:%HR_PORT%/   (run ipconfig to find IPv4)
echo             Listening on 0.0.0.0 - reachable from other devices on the LAN.
echo   Account : admin / admin123
echo             (override with HR_ADMIN_USER / HR_ADMIN_PASS before running)
echo   Stop    : press Ctrl+C in this window
echo.
echo ============================================
python manage.py runserver 0.0.0.0:%HR_PORT% --noreload
pause
