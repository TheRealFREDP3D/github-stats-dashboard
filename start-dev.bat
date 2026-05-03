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
start /B cmd /c "pnpm exec netlify functions:serve --port=8991"

REM Wait for functions to start
timeout /t 3 /nobreak >nul

REM Start Vite dev server
echo 🎨 Starting Vite Dev Server...
pnpm dev

pause
