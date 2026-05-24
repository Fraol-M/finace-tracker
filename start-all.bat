@echo off
echo Starting FinPrecision Backend (PHP server)...

set PHP_CMD=php
if exist "C:\xampp\php\php.exe" set PHP_CMD=C:\xampp\php\php.exe

start cmd /k "%PHP_CMD% -S localhost:8000 backend/router.php"

echo Starting FinPrecision Frontend (Vite server)...
start cmd /k "npm install && npm run dev"

echo Both servers are starting in new windows.
echo Frontend will be available at http://localhost:3000
