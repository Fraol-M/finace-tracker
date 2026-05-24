#!/bin/bash
echo "Starting FinPrecision Backend (PHP server)..."
php -S localhost:8000 backend/router.php &
BACKEND_PID=$!

echo "Starting FinPrecision Frontend (Vite server)..."
npm install
npm run dev &
FRONTEND_PID=$!

echo "Both servers are running."
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:8000"
echo "Press Ctrl+C to stop both servers."

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
