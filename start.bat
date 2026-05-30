@echo off
echo =============================================
echo   TYPER MS 2026 - Uruchamianie serwera
echo =============================================
echo.

start "Backend API" cmd /k "cd /d %~dp0server && node index.js"
timeout /t 2 /nobreak > nul
start "Frontend" cmd /k "cd /d %~dp0client && npm run dev"

echo.
echo Serwery uruchomione!
echo   Backend:  http://localhost:3001
echo   Frontend: http://localhost:5173
echo.
pause
