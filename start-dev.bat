@echo off
echo 🚀 Starting QuickHubPulse Development Environment

REM Set environment variables for OAuth
set GITHUB_CLIENT_ID=test_client_id
set GITHUB_REDIRECT_URI=http://localhost:3000/auth/github/callback

echo 📝 GITHUB_CLIENT_ID: %GITHUB_CLIENT_ID%
echo 🔗 GITHUB_REDIRECT_URI: %GITHUB_REDIRECT_URI%
echo.

REM Start Netlify Functions in background
echo 🔧 Starting Netlify Functions...
start /B cmd /c "pnpm exec netlify functions:serve"

REM Wait for functions to start
timeout /t 3 /nobreak >nul

REM Start Vite dev server
echo 🎨 Starting Vite Dev Server...
pnpm dev

pause
