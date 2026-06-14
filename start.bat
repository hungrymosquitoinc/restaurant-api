@echo off
cd /d "%~dp0"
echo ========================================
echo  Restaurant Ordering System
echo ========================================
echo.
echo Select what to start:
echo  1 - Web App only (localhost:5173)
echo  2 - Backend API only (localhost:3001)
echo  3 - All (Web + Backend)
echo  4 - Mobile Expo App (localhost:8081)
echo.
set /p choice="Choice (1-4): "

if "%choice%"=="1" (
  echo Starting Web App...
  start "Vite" cmd /c "npx vite --host --port 5173"
  timeout /t 3 /nobreak >nul
  start http://localhost:5173
)
if "%choice%"=="2" (
  echo Starting Backend API...
  start "Backend" cmd /c "cd backend ^& node server.js"
  timeout /t 2 /nobreak >nul
)
if "%choice%"=="3" (
  echo Starting Web App...
  start "Vite" cmd /c "npx vite --host --port 5173"
  echo Starting Backend API...
  start "Backend" cmd /c "cd backend ^& node server.js"
  timeout /t 4 /nobreak >nul
  start http://localhost:5173
)
if "%choice%"=="4" (
  echo Starting Mobile Expo App...
  start "Expo" cmd /c "cd mobile ^& npx expo start --web"
  timeout /t 10 /nobreak >nul
  start http://localhost:8081
)

echo.
echo ========================================
echo  Running:
echo   Web App:     http://localhost:5173
echo   Backend API: http://localhost:3001
echo   Mobile App:  http://localhost:8081
echo ========================================
echo  Ask admin for your account credentials
echo ========================================
pause
