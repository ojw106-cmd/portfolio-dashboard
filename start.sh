#!/bin/bash

echo "========================================"
echo "  Portfolio Dashboard 설치 및 실행"
echo "========================================"
echo ""

# Node.js 설치 확인
if ! command -v node &> /dev/null; then
    echo "[오류] Node.js가 설치되어 있지 않습니다."
    echo ""
    echo "Node.js를 먼저 설치해주세요: https://nodejs.org"
    echo "또는 Homebrew: brew install node"
    echo ""
    read -p "Press Enter to exit..."
    exit 1
fi

echo "[1/4] Node.js 확인 완료"
node -v

# 의존성 설치 확인
if [ ! -d "node_modules" ]; then
    echo ""
    echo "[2/4] 패키지 설치 중... (최초 1회만 실행, 잠시 기다려주세요)"
    npm install
else
    echo "[2/4] 패키지 이미 설치됨"
fi

# Prisma 설정
echo ""
echo "[3/4] 데이터베이스 설정 중..."
npx prisma generate > /dev/null 2>&1
npx prisma db push > /dev/null 2>&1

# 서버 시작
echo ""
echo "[4/4] 서버 시작 중..."
echo ""
echo "========================================"
echo "  브라우저에서 http://localhost:3000 을 열어주세요"
echo "  종료하려면 Ctrl+C를 누르세요"
echo "========================================"
echo ""

# 3초 후 브라우저 열기 (macOS)
(sleep 3 && open http://localhost:3000) &

# 서버 실행
npm run dev
