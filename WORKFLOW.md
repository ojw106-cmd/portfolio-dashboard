# 포트폴리오 대시보드 - 거래내역 입력 워크플로우

## 개요
형이 증권앱 거래내역 캡쳐 보내주면 → 내가 정리해서 API로 입력

## 작업 순서

### 1. 거래내역 캡쳐 받기
- 형이 증권앱에서 거래내역 스크린샷 전송
- 필요한 정보: 종목명, 수량, 가격, 매수/매도 구분, 날짜
- **주의**: 밑에서부터 시간순 (먼저 일어난 거래가 아래)

### 2. 거래내역 정리
시간순으로 정렬해서 테이블로 정리:
```
| 순서 | 종목명 | 구분 | 수량 | 가격 |
```

### 3. API로 입력
```javascript
fetch('/api/trades', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    accountId: 'jinwon' | 'dad' | 'lion',
    type: 'buy' | 'sell',
    market: 'KR' | 'US' | 'CRYPTO',
    code: '종목코드',
    name: '종목명',
    price: 가격,
    qty: 수량,
    sector: '섹터코드',
    date: 'YYYY-MM-DD'
  })
})
```

### 4. 확인
- 거래내역 건수 확인
- 보유현황 수량/평단가 확인

---

## 계좌 정보
| accountId | 이름 |
|-----------|------|
| jinwon | 진원 |
| dad | 아빠 |
| lion | 리온 |

## 시장별 설정
| market | 통화 | 종목코드 형식 |
|--------|------|--------------|
| KR | 원화 | 6자리 숫자 (005930) |
| US | 달러 | 티커 (AAPL, POET) |
| CRYPTO | 달러 | 심볼 (BTC, ETH) |

## 섹터 코드
| code | 이름 |
|------|------|
| AI | AI/반도체 |
| BIGTECH | 빅테크 |
| ROBOT | 로봇 |
| BIO | 바이오 |
| POWER | 전력/에너지 |
| OPTICAL | 광학 |
| SPACE | 우주/항공 |
| DEFENSE | 방산 |
| BATTERY | 2차전지 |
| CRYPTO | 크립토 |
| HEDGE | 헷지 |
| VENTURE | 벤처 |
| ETC | 기타 |

## 국내 종목코드 (자주 쓰는 것)
| 코드 | 종목명 |
|------|--------|
| 005930 | 삼성전자 |
| 000660 | SK하이닉스 |
| 009150 | 삼성전기 |
| 006400 | 삼성SDI |
| 012450 | 한화에어로스페이스 |
| 277810 | 레인보우로보틱스 |
| 131370 | 로킷헬스케어 |
| 006800 | 미래에셋증권 |
| 138080 | 오이솔루션 |

## 해외 종목코드 (자주 쓰는 것)
| 티커 | 종목명 |
|------|--------|
| POET | POET Technologies Inc. |
| INTC | Intel Corporation |
| NVDA | NVIDIA Corporation |
| TSLA | Tesla, Inc. |
| AAPL | Apple Inc. |
| AMZN | Amazon.com, Inc. |
| CPNG | Coupang, Inc. |
| CONL | GraniteShares 2x Long COIN |
| INTW | GraniteShares 2x Long INTC |

---

## 주의사항
1. **시간순 입력 필수** - 매수 쫙, 매도 쫙 ❌ → 실제 거래 순서대로 ✅
2. **중복 입력 주의** - 브라우저 타임아웃 나도 서버에 요청 도달할 수 있음
3. **입력 전후 확인** - 거래 건수 체크해서 중복 방지

## 코드 수정 내역 (2026-02-02)
- `/api/trades/route.ts`: 매수/매도 시 Stock 보유현황 자동 업데이트
  - 매수: 평균매수가 재계산 + 보유수량 증가
  - 매도: 보유수량 감소 + 실현손익 자동 계산
- GitHub: https://github.com/ojw106-cmd/portfolio-dashboard

---

## 일일 업데이트 플로우 (2026-02-03~)

1. **형이 거래내역 스크린샷 전송**
   - 국내/해외 각각
   - 매수/매도 구분, 수량, 체결가 포함

2. **내가 정리 → API 입력**
   - 시간순 정렬 (주문번호 작은 것 = 먼저)
   - 체결된 것만 입력 (미체결 제외)

3. **Stock 자동 업데이트**
   - 매수: 평균매수가 재계산 + 수량 증가
   - 매도: 수량 감소 + 실현손익 계산

4. **필요시 보유현황 스크린샷으로 검증**

## 기준점 (2026-02-02 설정)
- 진원/아빠 국내+미국 Stock을 실제 보유현황으로 맞춤
- 이후 거래는 이 기준 위에 누적됨

---
*마지막 업데이트: 2026-02-03*
