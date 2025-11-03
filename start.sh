#!/bin/bash

# QMS Application Startup Script
echo "🚀 Starting QMS Application..."

# Start backend in background
echo "📦 Starting Backend Server..."
cd BackEnd
npm install
node src/server.js &
BACKEND_PID=$!

# Wait for backend to initialize
sleep 5

# Start frontend
echo "🎨 Starting Frontend..."
cd ../frontend-new
npm install
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ QMS Application Started!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📍 Backend:  http://localhost:5000"
echo "📍 Frontend: http://localhost:3000"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📧 Default Login Credentials:"
echo "   Email:    admin@idatum.com"
echo "   Password: Admin@123"
echo ""
echo "Press Ctrl+C to stop all services"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
