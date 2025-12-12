#!/bin/bash

# Kill any existing processes on these ports to avoid conflicts
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:3001 | xargs kill -9 2>/dev/null

echo "Starting Web App on http://localhost:3000..."
npx serve -s frontend/dist -l 3000 &
PID_WEB=$!

echo "Starting Mobile App (Web) on http://localhost:3001..."
npx serve -s mobile/dist -l 3001 &
PID_MOBILE=$!

echo "Servers are running!"
echo "Web App:    http://localhost:3000"
echo "Mobile App: http://localhost:3001"
echo "Press Ctrl+C to stop both servers."

# Wait for both processes
wait $PID_WEB $PID_MOBILE
