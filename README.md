# FinPrecision - Wealth Management Ledger

A full-stack wealth management and finance tracker application built with React (Vite) on the frontend and a custom PHP REST API with MySQL on the backend.

## Prerequisites

To run this project locally, you will need:
- **Node.js** (v18+ recommended)
- **PHP** (v8.0+ recommended)
- **MySQL / MariaDB** (Easily available via XAMPP, WAMP, or MAMP)

## Project Structure

- `/backend`: Contains the PHP REST API, database setup, and routing.
- `/src`: Contains the React frontend application.

## One-Time Database Setup

Before running the backend for the first time, you must initialize the database and seed it with initial data.

1. Ensure your MySQL server is running.
2. Run the setup script:
   ```bash
   php backend/setup.php
   ```
   *(If you are using XAMPP on Windows, use `C:\xampp\php\php.exe backend/setup.php`)*

This will create the `finprecision` database, the necessary tables, and seed it with test accounts (`admin` and `kaleb`).

## How to Run

We have provided quick-start scripts for convenience. You can run the entire stack together or run them individually.

### Running Both Frontend & Backend Together

**On Windows:**
Double-click `start-all.bat` or run it from the terminal:
```cmd
.\start-all.bat
```

**On macOS/Linux:**
```bash
./start-all.sh
```

### Running Components Individually

If you only want to work on the frontend or backend, you can run them separately.

**Frontend Only:**
- Windows: `.\start-frontend.bat`
- macOS/Linux: `./start-frontend.sh`
- Manual: `npm install && npm run dev`

**Backend Only:**
- Windows: `.\start-backend.bat`
- macOS/Linux: `./start-backend.sh`
- Manual: `php -S localhost:8000 backend/router.php`

## Default Test Accounts

Once the servers are running, access the application at `http://localhost:3000`.

- **Admin User**: Username: `admin` | Password: `admin`
- **Standard User**: Username: `kaleb` | Password: `user`
