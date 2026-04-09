@echo off
title HR Management System
color 0A

echo.
echo ========================================
echo    HR Management System Launcher
echo ========================================
echo.
echo Starting server...
echo.

set NODE_NO_WARNINGS=1
npx tsx server.ts

pause
