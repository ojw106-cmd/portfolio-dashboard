@echo off
chcp 65001 > nul
echo 포트폴리오 대시보드를 시작합니다...
echo.

cd /d "%~dp0"

:: 브라우저를 3초 후에 열기 (서버 시작 대기)
start "" cmd /c "timeout /t 3 /nobreak > nul && start http://localhost:3000"

:: 서버 시작
npm run dev
