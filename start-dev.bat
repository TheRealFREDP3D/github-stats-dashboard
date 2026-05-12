@echo off
echo 🚀 Starting QuickHubPulse Development Environment

REM Load environment variables from .env file
for /f "tokens=1,2 delims==" %%a in (.env) do (
    if not "%%a"=="" if not "%%b"=="" set %%a=%%b
)

echo 📝 GITHUB_CLIENT_ID: %GITHUB_CLIENT_ID%
echo 🔗 GITHUB_REDIRECT_URI: %GITHUB_REDIRECT_URI%
echo.

REM Start Netlify Functions in background
echo 🔧 Starting Netlify Functions...
start /B cmd /c "pnpm exec netlify functions:serve --port=8991" >nul 2>&1

REM Wait for functions to start
timeout /t 3 /nobreak >nul

REM Clean up any existing vite-output.txt
if exist vite-output.txt (
    echo 🗑️ Cleaning up existing vite-output.txt...
    del /f vite-output.txt
)

REM Start Vite dev server
echo 🎨 Starting Vite Dev Server...
start /B cmd /c "pnpm run dev > vite-output.txt 2>&1"

REM Wait a moment for Vite to start
timeout /t 5 /nobreak >nul

REM Retry port detection if file is locked
if not exist vite-output.txt (
    echo ⚠️ File not ready, retrying...
    timeout /t 2 /nobreak >nul
    goto :detect_port
)

:detect_port
REM Check which port Vite is using and update .env
echo 📍 Detecting Vite port...
for /f "tokens=5 delims=: " %%a in ('type vite-output.txt ^| findstr "Local:"') do (
    set VITE_PORT=%%a
    echo 🚨 Vite started on port: %%a
    echo Updating VITE_DEV_PORT in .env...
    powershell -Command "if ((Get-Content .env) -match 'VITE_DEV_PORT=') { (Get-Content .env) -replace 'VITE_DEV_PORT=.*', 'VITE_DEV_PORT=%%a' | Set-Content .env } else { Add-Content .env 'VITE_DEV_PORT=%%a' }"
)

REM Wait a bit more for server to be fully ready
timeout /t 2 /nobreak >nul

REM Open browser using stored port
if defined VITE_PORT (
    echo 🌐 Opening browser on port: %VITE_PORT%
    start http://localhost:%VITE_PORT%
)

REM Clean up
del vite-output.txt

pause
