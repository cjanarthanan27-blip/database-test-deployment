@echo off
echo Stopping Water Tracker Servers...

:: Stop Node (Vite)
echo Stopping Node.js processes...
taskkill /F /IM node.exe /T 2>nul

:: Stop Python (Django)
echo Stopping Python processes...
taskkill /F /IM python.exe /T 2>nul

echo.
echo All processes stopped.
echo.
pause
