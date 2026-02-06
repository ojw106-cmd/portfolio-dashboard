'use client';

import { useState } from 'react';

// Mock 데이터 타입
interface Account {
  id: string;
  name: string;
  totalFunds: number; // 만원 단위
  reserveFunds: {
    fixed: number;
    extreme: number;
  };
  investmentSeed: number;
}

interface Position {
  ticker: string;
  name: string;
  category: string;
  theme: string;
  amount: number; // 만원 단위
  percentage: number;
  confidence: number; // 1-10
  thesisValid: boolean;
}

interface Portfolio {
  market: 'US' | 'KR';
  longTerm: {
    budget: number;
    positions: Position[];
    maxSlots: 5;
  };
  midTerm: {
    budget: number;
    positions: Position[];
    maxSlots: 7;
  };
  cash: {
    budget: number;
    positions: Position[];
    maxSlots: 3;
  };
}

// Mock 데이터
const MOCK_ACCOUNTS: Account[] = [
  {
    id: 'jinwon',
    name: '진원',
    totalFunds: 42000,
    reserveFunds: {
      fixed: 4000,
      extreme: 3000,
    },
    investmentSeed: 35000,
  },
  {
    id: 'dad',
    name: '아빠',
    totalFunds: 58000,
    reserveFunds: {
      fixed: 2000,
      extreme: 2000,
    },
    investmentSeed: 54000,
  },
];

const MOCK_PORTFOLIO: Record<string, Portfolio[]> = {
  jinwon: [
    {
      market: 'US',
      longTerm: {
        budget: 10500,
        positions: [
          {
            ticker: 'INTC',
            name: 'Intel',
            category: '코어',
            theme: 'AI칩',
            amount: 4200,
            percentage: 40.0,
            confidence: 9,
            thesisValid: true,
          },
          {
            ticker: 'POET',
            name: 'POET Technologies',
            category: '하이그로스',
            theme: 'AI칩',
            amount: 3150,
            percentage: 30.0,
            confidence: 8,
            thesisValid: true,
          },
        ],
        maxSlots: 5,
      },
      midTerm: {
        budget: 5250,
        positions: [
          {
            ticker: 'TSM',
            name: 'TSMC',
            category: '중단타',
            theme: '반도체',
            amount: 1312,
            percentage: 25.0,
            confidence: 7,
            thesisValid: true,
          },
        ],
        maxSlots: 7,
      },
      cash: {
        budget: 1750,
        positions: [],
        maxSlots: 3,
      },
    },
    {
      market: 'KR',
      longTerm: {
        budget: 10500,
        positions: [
          {
            ticker: '005930',
            name: '삼성전자',
            category: '코어',
            theme: '반도체',
            amount: 4200,
            percentage: 40.0,
            confidence: 8,
            thesisValid: true,
          },
        ],
        maxSlots: 5,
      },
      midTerm: {
        budget: 5250,
        positions: [],
        maxSlots: 7,
      },
      cash: {
        budget: 1750,
        positions: [],
        maxSlots: 3,
      },
    },
  ],
  dad: [
    {
      market: 'US',
      longTerm: {
        budget: 16200,
        positions: [],
        maxSlots: 5,
      },
      midTerm: {
        budget: 8100,
        positions: [],
        maxSlots: 7,
      },
      cash: {
        budget: 2700,
        positions: [],
        maxSlots: 3,
      },
    },
    {
      market: 'KR',
      longTerm: {
        budget: 16200,
        positions: [],
        maxSlots: 5,
      },
      midTerm: {
        budget: 8100,
        positions: [],
        maxSlots: 7,
      },
      cash: {
        budget: 2700,
        positions: [],
        maxSlots: 3,
      },
    },
  ],
};

export function POCView() {
  const [selectedAccount, setSelectedAccount] = useState<Account>(
    MOCK_ACCOUNTS[0]
  );
  const [selectedMarket, setSelectedMarket] = useState<'US' | 'KR'>('US');

  const portfolios = MOCK_PORTFOLIO[selectedAccount.id];
  const currentPortfolio = portfolios.find((p) => p.market === selectedMarket);

  if (!currentPortfolio) return null;

  // 비중 계산
  const longTermTotal = currentPortfolio.longTerm.positions.reduce(
    (sum, pos) => sum + pos.amount,
    0
  );
  const longTermUsage = (longTermTotal / currentPortfolio.longTerm.budget) * 100;

  const midTermTotal = currentPortfolio.midTerm.positions.reduce(
    (sum, pos) => sum + pos.amount,
    0
  );
  const midTermUsage = (midTermTotal / currentPortfolio.midTerm.budget) * 100;

  const cashTotal = currentPortfolio.cash.positions.reduce(
    (sum, pos) => sum + pos.amount,
    0
  );
  const cashUsage = (cashTotal / currentPortfolio.cash.budget) * 100;

  // 비중 제한 경고 체크
  const warnings: string[] = [];
  currentPortfolio.longTerm.positions.forEach((pos) => {
    if (pos.percentage > 40) {
      warnings.push(
        `⚠️ ${pos.ticker}: ${pos.amount.toLocaleString()}만원 (${pos.percentage.toFixed(1)}%) - 장기 40% 제한 초과!`
      );
    }
  });

  // 테마별 비중 체크 (간단히 AI칩 테마만)
  const aiChipPositions = currentPortfolio.longTerm.positions.filter(
    (p) => p.theme === 'AI칩'
  );
  const aiChipTotal = aiChipPositions.reduce((sum, p) => sum + p.amount, 0);
  const aiChipPercentage =
    (aiChipTotal / currentPortfolio.longTerm.budget) * 100;
  if (aiChipPercentage > 50) {
    warnings.push(
      `⚠️ AI칩 테마: ${aiChipTotal.toLocaleString()}만원 (${aiChipPercentage.toFixed(1)}%) - 장기 50% 제한 초과!`
    );
  }

  currentPortfolio.midTerm.positions.forEach((pos) => {
    if (pos.percentage > 25) {
      warnings.push(
        `⚠️ ${pos.ticker}: ${pos.amount.toLocaleString()}만원 (${pos.percentage.toFixed(1)}%) - 중단타 25% 제한 초과!`
      );
    }
  });

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            POC: 투자 룰북 자금 관리
          </h1>
          <p className="text-[#888]">
            슬롯/비중 제한 기반 포트폴리오 시각화 (Mock 데이터)
          </p>
        </div>
      </div>

      {/* 1. 계좌 선택 */}
      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
        <h2 className="text-xl font-bold text-white mb-4">계좌 선택</h2>
        <div className="flex gap-3">
          {MOCK_ACCOUNTS.map((account) => (
            <button
              key={account.id}
              onClick={() => setSelectedAccount(account)}
              className={`px-8 py-4 rounded-lg font-semibold transition-all ${
                selectedAccount.id === account.id
                  ? 'bg-gradient-to-r from-[#4fc3f7] to-[#29b6f6] text-[#1a1a2e]'
                  : 'bg-white/10 text-[#888] hover:bg-white/20 hover:text-white'
              }`}
            >
              {account.name} 계좌
            </button>
          ))}
        </div>
      </div>

      {/* 2. 자금 구조 Overview */}
      <div className="bg-gradient-to-br from-[#4fc3f7]/10 to-[#29b6f6]/10 rounded-xl p-6 border border-[#4fc3f7]/30">
        <h2 className="text-xl font-bold text-white mb-4">자금 구조</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center text-2xl font-bold text-white">
            <span>총 자금</span>
            <span>{selectedAccount.totalFunds.toLocaleString()}M</span>
          </div>

          <div className="h-px bg-white/20 my-3"></div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-white">
              <span className="text-[#888]">예비비</span>
              <span className="font-semibold">
                {(
                  selectedAccount.reserveFunds.fixed +
                  selectedAccount.reserveFunds.extreme
                ).toLocaleString()}
                M
              </span>
            </div>
            <div className="ml-6 space-y-1 text-sm">
              <div className="flex justify-between text-[#888]">
                <span>
                  ├─ 고정 예비비{' '}
                  <span className="text-red-400 font-bold">🔒</span>
                </span>
                <span>{selectedAccount.reserveFunds.fixed.toLocaleString()}M</span>
              </div>
              <div className="flex justify-between text-[#888]">
                <span>└─ 극단 예비비</span>
                <span>
                  {selectedAccount.reserveFunds.extreme.toLocaleString()}M
                </span>
              </div>
            </div>
          </div>

          <div className="h-px bg-white/20 my-3"></div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-white">
              <span className="text-[#888]">투자 시드</span>
              <span className="font-semibold text-[#4fc3f7]">
                {selectedAccount.investmentSeed.toLocaleString()}M
              </span>
            </div>
            <div className="ml-6 space-y-1 text-sm">
              <div className="flex justify-between text-[#888]">
                <span>├─ 미장</span>
                <span>
                  {(selectedAccount.investmentSeed / 2).toLocaleString()}M (50%)
                </span>
              </div>
              <div className="flex justify-between text-[#888]">
                <span>└─ 국장</span>
                <span>
                  {(selectedAccount.investmentSeed / 2).toLocaleString()}M (50%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. 시장 선택 탭 */}
      <div className="flex gap-2">
        <button
          onClick={() => setSelectedMarket('US')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            selectedMarket === 'US'
              ? 'bg-gradient-to-r from-[#4fc3f7] to-[#29b6f6] text-[#1a1a2e]'
              : 'bg-white/10 text-[#888] hover:bg-white/20 hover:text-white'
          }`}
        >
          미장 🇺🇸
        </button>
        <button
          onClick={() => setSelectedMarket('KR')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            selectedMarket === 'KR'
              ? 'bg-gradient-to-r from-[#4fc3f7] to-[#29b6f6] text-[#1a1a2e]'
              : 'bg-white/10 text-[#888] hover:bg-white/20 hover:text-white'
          }`}
        >
          국장 🇰🇷
        </button>
      </div>

      {/* 비중 경고 */}
      {warnings.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <h3 className="text-red-400 font-bold mb-2">⚠️ 비중 제한 경고</h3>
          <div className="space-y-1">
            {warnings.map((warning, idx) => (
              <div key={idx} className="text-red-300 text-sm">
                {warning}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. 포트폴리오 섹션 */}
      <div className="space-y-6">
        {/* 장기투자 */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">
              장기투자: {currentPortfolio.longTerm.budget.toLocaleString()}M (60%)
            </h2>
            <div className="text-sm text-[#888]">
              사용: {longTermUsage.toFixed(1)}% | 슬롯:{' '}
              {currentPortfolio.longTerm.positions.length}/
              {currentPortfolio.longTerm.maxSlots}
            </div>
          </div>

          <div className="mb-4 space-y-1 text-sm text-[#888]">
            <div>• 1종목 최대: 4,200M (40%)</div>
            <div>• 1테마 최대: 5,250M (50%)</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {/* 채워진 슬롯 */}
            {currentPortfolio.longTerm.positions.map((pos, idx) => (
              <div
                key={idx}
                className="bg-gradient-to-br from-[#4fc3f7]/20 to-[#29b6f6]/20 border border-[#4fc3f7]/50 rounded-lg p-4 hover:scale-105 transition-transform cursor-pointer"
              >
                <div className="text-xl font-bold text-white mb-1">
                  {pos.ticker}
                </div>
                <div className="text-sm text-[#888] mb-3">{pos.name}</div>
                <div className="text-xs text-[#888] mb-3">
                  {pos.category} / {pos.theme}
                </div>

                <div className="text-lg font-bold text-[#4fc3f7] mb-1">
                  {pos.amount.toLocaleString()}M
                </div>
                <div className="text-sm text-[#888] mb-3">
                  {pos.percentage.toFixed(1)}%
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#888]">확신도: {pos.confidence}/10</span>
                  <span className={pos.thesisValid ? 'text-green-400' : 'text-red-400'}>
                    {pos.thesisValid ? '✅' : '❌'}
                  </span>
                </div>
              </div>
            ))}

            {/* 빈 슬롯 */}
            {Array.from({
              length:
                currentPortfolio.longTerm.maxSlots -
                currentPortfolio.longTerm.positions.length,
            }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="bg-white/5 border-2 border-dashed border-white/20 rounded-lg p-4 flex items-center justify-center hover:border-[#4fc3f7] hover:bg-white/10 transition-all cursor-pointer"
              >
                <div className="text-center text-[#888]">
                  <div className="text-3xl mb-2">+</div>
                  <div className="text-sm">종목 추가</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 중단타 */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">
              중단타: {currentPortfolio.midTerm.budget.toLocaleString()}M (30%)
            </h2>
            <div className="text-sm text-[#888]">
              사용: {midTermUsage.toFixed(1)}% | 슬롯:{' '}
              {currentPortfolio.midTerm.positions.length}/
              {currentPortfolio.midTerm.maxSlots}
            </div>
          </div>

          <div className="mb-4 text-sm text-[#888]">
            • 1종목 최대: 1,312M (25%)
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
            {/* 채워진 슬롯 */}
            {currentPortfolio.midTerm.positions.map((pos, idx) => (
              <div
                key={idx}
                className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/50 rounded-lg p-4 hover:scale-105 transition-transform cursor-pointer"
              >
                <div className="text-xl font-bold text-white mb-1">
                  {pos.ticker}
                </div>
                <div className="text-sm text-[#888] mb-3">{pos.name}</div>
                <div className="text-xs text-[#888] mb-3">
                  {pos.category} / {pos.theme}
                </div>

                <div className="text-lg font-bold text-purple-400 mb-1">
                  {pos.amount.toLocaleString()}M
                </div>
                <div className="text-sm text-[#888] mb-3">
                  {pos.percentage.toFixed(1)}%
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#888]">확신도: {pos.confidence}/10</span>
                  <span className={pos.thesisValid ? 'text-green-400' : 'text-red-400'}>
                    {pos.thesisValid ? '✅' : '❌'}
                  </span>
                </div>
              </div>
            ))}

            {/* 빈 슬롯 */}
            {Array.from({
              length:
                currentPortfolio.midTerm.maxSlots -
                currentPortfolio.midTerm.positions.length,
            }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="bg-white/5 border-2 border-dashed border-white/20 rounded-lg p-4 flex items-center justify-center hover:border-purple-500 hover:bg-white/10 transition-all cursor-pointer"
              >
                <div className="text-center text-[#888]">
                  <div className="text-3xl mb-2">+</div>
                  <div className="text-sm">종목 추가</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 현금 */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">
              현금: {currentPortfolio.cash.budget.toLocaleString()}M (10%)
            </h2>
            <div className="text-sm text-[#888]">
              사용: {cashUsage.toFixed(1)}% | 슬롯:{' '}
              {currentPortfolio.cash.positions.length}/
              {currentPortfolio.cash.maxSlots}
            </div>
          </div>

          <div className="mb-4 text-sm text-[#888]">
            • 1종목 최대: 875M (50%) | 별도 슬롯 카운트
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 채워진 슬롯 */}
            {currentPortfolio.cash.positions.map((pos, idx) => (
              <div
                key={idx}
                className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/50 rounded-lg p-4 hover:scale-105 transition-transform cursor-pointer"
              >
                <div className="text-xl font-bold text-white mb-1">
                  {pos.ticker}
                </div>
                <div className="text-sm text-[#888] mb-3">{pos.name}</div>

                <div className="text-lg font-bold text-green-400 mb-1">
                  {pos.amount.toLocaleString()}M
                </div>
                <div className="text-sm text-[#888]">
                  {pos.percentage.toFixed(1)}%
                </div>
              </div>
            ))}

            {/* 빈 슬롯 */}
            {Array.from({
              length:
                currentPortfolio.cash.maxSlots -
                currentPortfolio.cash.positions.length,
            }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="bg-white/5 border-2 border-dashed border-white/20 rounded-lg p-4 flex items-center justify-center hover:border-green-500 hover:bg-white/10 transition-all cursor-pointer"
              >
                <div className="text-center text-[#888]">
                  <div className="text-3xl mb-2">+</div>
                  <div className="text-sm">종목 추가</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. 예비비 관리 패널 */}
      <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-xl p-6 border border-orange-500/30">
        <h2 className="text-xl font-bold text-white mb-4">예비비 현황</h2>

        <div className="space-y-4">
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-semibold">
                고정 예비비 🔒
              </span>
              <span className="text-xl font-bold text-white">
                {selectedAccount.reserveFunds.fixed.toLocaleString()}M
              </span>
            </div>
            <div className="space-y-1 text-sm text-[#888]">
              <div>- 종합소득세: 9,000M 필요</div>
              <div className="text-red-400">
                (부족: {9000 - selectedAccount.reserveFunds.fixed}M - 4월 중단타 익절 필요)
              </div>
              <div>- 양도소득세: 3,000M (7월)</div>
            </div>
          </div>

          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-semibold">극단 예비비</span>
              <span className="text-xl font-bold text-orange-400">
                {selectedAccount.reserveFunds.extreme.toLocaleString()}M
              </span>
            </div>
            <div className="text-sm text-[#888] mb-2">
              사용 조건: 5가지 ALL 충족 필요 (룰북 제8조)
            </div>
            <button className="w-full py-2 bg-white/10 hover:bg-white/20 rounded text-sm text-white transition-all">
              상세보기
            </button>
          </div>
        </div>
      </div>

      {/* POC 노트 */}
      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
        <h3 className="text-lg font-bold text-white mb-3">📝 POC 노트</h3>
        <ul className="space-y-2 text-sm text-[#888]">
          <li>✅ 계좌 선택 UI</li>
          <li>✅ 자금 구조 Overview</li>
          <li>✅ 시장별 포트폴리오 (미장/국장)</li>
          <li>✅ 슬롯 카드 디자인 (빈/채워진)</li>
          <li>✅ 비중 제한 경고 시스템</li>
          <li>✅ 예비비 관리 패널</li>
          <li className="text-yellow-400">
            🚧 다음: 실제 DB 연동 + 종목 추가/편집 기능
          </li>
        </ul>
      </div>
    </div>
  );
}
