@echo off
echo Starting Water Purchase Tracker...
echo.

REM Start Backend Server
echo [1/2] Starting Django Backend Server...
start "Django Backend" cmd /k "cd backend && python manage.py runserver"

REM Wait a moment for backend to initialize
timeout /t 3 /nobreak >nul

REM Start Frontend Server
echo [2/2] Starting React Frontend Server...
start "React Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo Both servers are starting!
echo ========================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173
echo.
echo Login with:
echo   Username: admin
echo   Password: admin123
echo.
echo Press any key to close this window...
pause >nul
