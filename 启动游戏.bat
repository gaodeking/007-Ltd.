@echo off
title Jiaban007 Game Server
cd /d "%~dp0server"
echo.
echo ================================
echo    Jiaban007 Starting...
echo ================================
echo.
echo Server: http://localhost:3001
echo Press Ctrl+C to stop
echo.
node server.js
if errorlevel 1 (
    echo.
    echo [ERROR] Node.js not found
    echo Download: https://nodejs.org
    pause
)
pause
