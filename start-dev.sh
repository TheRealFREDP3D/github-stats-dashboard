#!/bin/bash

# Set environment variables for OAuth
export GITHUB_CLIENT_ID="test_client_id"
export GITHUB_REDIRECT_URI="http://localhost:3000/auth/github/callback"

echo "🚀 Starting QuickHubPulse Development Environment"
echo "📝 GITHUB_CLIENT_ID: $GITHUB_CLIENT_ID"
echo "🔗 GITHUB_REDIRECT_URI: $GITHUB_REDIRECT_URI"
echo ""

# Start Netlify Functions in background
echo "🔧 Starting Netlify Functions..."
pnpm exec netlify functions:serve &
FUNCTIONS_PID=$!

# Wait for functions to start
sleep 3

# Start Vite dev server
echo "🎨 Starting Vite Dev Server..."
pnpm dev &
VITE_PID=$!

echo ""
echo "✅ Development servers started!"
echo "📊 Functions: http://localhost:9999"
echo "🎨 Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for interrupt signal
trap "echo '🛑 Stopping servers...'; kill $FUNCTIONS_PID $VITE_PID; exit" INT
wait
