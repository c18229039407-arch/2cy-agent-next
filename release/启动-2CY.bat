@echo off
chcp 65001 >nul
cd /d %~dp0
echo 正在启动 2CY Agent，浏览器将自动打开...
bin\2cy.exe web
pause
