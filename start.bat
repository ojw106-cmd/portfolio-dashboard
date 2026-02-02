@echo off
chcp 65001 >nul
title Portfolio Dashboard

echo ========================================
echo   Portfolio Dashboard 설치 및 실행
echo ========================================
echo.

:: Node.js 설치 확인
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [오류] Node.js가 설치되어 있지 않습니다.
    echo.
    echo Node.js를 먼저 설치해주세요: https://nodejs.org
    echo LTS 버전을 다운로드하여 설치한 후 다시 실행해주세요.
    echo.
    pause
    exit /b 1
)

echo [1/4] Node.js 확인 완료
node -v

:: 의존성 설치 확인
if not exist "node_modules" (
    echo.
    echo [2/4] 패키지 설치 중... (최초 1회만 실행, 잠시 기다려주세요)
    call npm install
) else (
    echo [2/4] 패키지 이미 설치됨
)

:: Prisma 설정
echo.
echo [3/4] 데이터베이스 설정 중...
call npx prisma generate >nul 2>nul
call npx prisma db push >nul 2>nul

:: 서버 시작
echo.
echo [4/4] 서버 시작 중...
echo.
echo ========================================
echo   브라우저에서 자동으로 열립니다.
echo   이 창을 닫으면 서버가 종료됩니다.
echo ========================================
echo.

:: 3초 후 브라우저 열기
start /b cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:3000"

:: 서버 실행
call npm run dev
