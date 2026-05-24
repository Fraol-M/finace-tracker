@echo off
echo Starting FinPrecision Backend (PHP server)...
echo Server will run on http://localhost:8000

set PHP_CMD=php
if exist "C:\xampp\php\php.exe" set PHP_CMD=C:\xampp\php\php.exe

%PHP_CMD% -S localhost:8000 backend/router.php
