@echo off
title 加班007 - 前端
start cmd /k "cd /d %~dp0client && npm run dev"

timeout /t 2 /nobreak >nul

title 加班007 - 后端
cd /d "%~dp0server"
node server.js
if errorlevel 1 (
    echo.
    echo [错误] Node.js 未找到或启动失败
    echo 下载地址: https://nodejs.org
    pause
)
pause
