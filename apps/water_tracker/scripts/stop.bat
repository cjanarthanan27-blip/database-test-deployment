@echo off
echo Stopping Water Purchase Tracker...
echo.

REM Kill Python processes (Django)
echo [1/2] Stopping Django Backend...
taskkill /F /IM python.exe >nul 2>&1
if %errorlevel% == 0 (
    echo Django backend stopped.
) else (
    echo No Django backend process found.
)

REM Kill Node processes (React/Vite)
echo [2/2] Stopping React Frontend...
taskkill /F /IM node.exe >nul 2>&1
if %errorlevel% == 0 (
    echo React frontend stopped.
) else (
    echo No React frontend process found.
)

echo.
echo ========================================
echo All servers stopped!
echo ========================================
echo.
pause
