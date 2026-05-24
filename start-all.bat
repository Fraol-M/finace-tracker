@echo off
echo Starting FinPrecision Backend (PHP server)...
start cmd /k "php -S localhost:8000 backend/router.php"

echo Starting FinPrecision Frontend (Vite server)...
start cmd /k "npm install && npm run dev"

echo Both servers are starting in new windows.
echo Frontend will be available at http://localhost:3000
