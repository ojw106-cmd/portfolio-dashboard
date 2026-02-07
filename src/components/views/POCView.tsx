'use client';

import { useState } from 'react';
import { PieChart } from '@/components/dashboard/PieChart';
import { ThemeDetailModal } from '@/components/modals/ThemeDetailModal';
import { AddPositionModal } from '@/components/modals/AddPositionModal';

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
  // 현황판용 추가 데이터
  totalValue: number; // 총 평가금액 (원)
  totalInvestment: number; // 총 투자금 (원)
  totalProfit: number; // 총 평가손익 (원)
  totalProfitRate: number; // 총 평가손익률 (%)
  realizedProfit: number; // 총 실현손익 (원)
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
  // 추가 필드
  avgPrice?: number; // 매수가 (달러 or 원)
  shares?: number; // 보유주식수
  currentPrice?: number; // 현재가 (달러 or 원)
  profitAmount?: number; // 수익금액 (원화)
  profitRate?: number; // 수익률 (%)
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
    totalValue: 1016530158, // 총 평가금액
    totalInvestment: 810290772, // 총 투자금
    totalProfit: -5097028, // 총 평가손익
    totalProfitRate: -0.63, // 총 평가손익률
    realizedProfit: -16240235, // 총 실현손익
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
    totalValue: 922047313, // 총 평가금액
    totalInvestment: 612406774, // 총 투자금
    totalProfit: +600821, // 총 평가손익
    totalProfitRate: +0.10, // 총 평가손익률
    realizedProfit: -12105962, // 총 실현손익
  },
  {
    id: 'leon',
    name: '리온',
    totalFunds: 12000,
    reserveFunds: {
      fixed: 0,
      extreme: 0,
    },
    investmentSeed: 12000,
    totalValue: 120579418, // 총 평가금액
    totalInvestment: 121113800, // 총 투자금
    totalProfit: -514500, // 총 평가손익
    totalProfitRate: -0.44, // 총 평가손익률
    realizedProfit: -6266000, // 총 실현손익
  },
];

// 환율 (하드코딩)
const EXCHANGE_RATE = 1477;

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
            avgPrice: 48.24, // 매수가 $48.24
            shares: 590, // 보유 590주
            currentPrice: 50.12, // 현재가 $50.12
            profitAmount: 1109, // 수익 $1,109 (= (50.12-48.24) * 590)
            profitRate: 3.9, // 수익률 +3.9%
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
            avgPrice: 4.87, // 매수가 $4.87
            shares: 4380, // 보유 4,380주
            currentPrice: 5.45, // 현재가 $5.45
            profitAmount: 2540, // 수익 $2,540 (= (5.45-4.87) * 4380)
            profitRate: 11.9, // 수익률 +11.9%
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
            avgPrice: 176.32, // 매수가 $176.32
            shares: 50, // 보유 50주
            currentPrice: 169.85, // 현재가 $169.85
            profitAmount: -323, // 손실 -$323 (= (169.85-176.32) * 50)
            profitRate: -3.7, // 수익률 -3.7%
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
            avgPrice: 68500, // 매수가 68,500원
            shares: 613, // 보유 613주
            currentPrice: 71200, // 현재가 71,200원
            profitAmount: 1655100, // 수익 1,655,100원 (= (71200-68500) * 613)
            profitRate: 3.9, // 수익률 +3.9%
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
  leon: [
    {
      market: 'US',
      longTerm: {
        budget: 3600,
        positions: [],
        maxSlots: 5,
      },
      midTerm: {
        budget: 1800,
        positions: [],
        maxSlots: 7,
      },
      cash: {
        budget: 600,
        positions: [],
        maxSlots: 3,
      },
    },
    {
      market: 'KR',
      longTerm: {
        budget: 3600,
        positions: [],
        maxSlots: 5,
      },
      midTerm: {
        budget: 1800,
        positions: [],
        maxSlots: 7,
      },
      cash: {
        budget: 600,
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
  
  // 모달 state
  const [themeDetailOpen, setThemeDetailOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<any>(null);
  const [addPositionOpen, setAddPositionOpen] = useState(false);

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
        `⚠️ ${pos.ticker}: ${(pos.amount * 10000).toLocaleString()}원 (${pos.percentage.toFixed(1)}%) - 장기 40% 제한 초과!`
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
      `⚠️ AI칩 테마: ${(aiChipTotal * 10000).toLocaleString()}원 (${aiChipPercentage.toFixed(1)}%) - 장기 50% 제한 초과!`
    );
  }

  currentPortfolio.midTerm.positions.forEach((pos) => {
    if (pos.percentage > 25) {
      warnings.push(
        `⚠️ ${pos.ticker}: ${(pos.amount * 10000).toLocaleString()}원 (${pos.percentage.toFixed(1)}%) - 중단타 25% 제한 초과!`
      );
    }
  });

  // 전체 계좌 합산
  const totalAllValue = MOCK_ACCOUNTS.reduce((sum, acc) => sum + acc.totalValue, 0);
  const totalAllInvestment = MOCK_ACCOUNTS.reduce((sum, acc) => sum + acc.totalInvestment, 0);
  const totalAllProfit = MOCK_ACCOUNTS.reduce((sum, acc) => sum + acc.totalProfit, 0);
  const totalAllProfitRate = totalAllInvestment > 0 ? (totalAllProfit / totalAllInvestment) * 100 : 0;
  const totalAllRealized = MOCK_ACCOUNTS.reduce((sum, acc) => sum + acc.realizedProfit, 0);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            포트폴리오
          </h1>
          <p className="text-[#888]">
            슬롯/비중 제한 기반 자금 관리 시스템
          </p>
        </div>
      </div>

      {/* 전체 요약 */}
      <div className="bg-gradient-to-br from-[#4fc3f7]/10 to-[#29b6f6]/10 rounded-xl p-6 border border-[#4fc3f7]/30">
        <h2 className="text-xl font-bold text-white mb-4">전체 요약</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <div className="text-sm text-[#888] mb-1">총 평가액</div>
            <div className="text-2xl font-bold text-white">
              {totalAllValue.toLocaleString()} 원
            </div>
          </div>
          <div>
            <div className="text-sm text-[#888] mb-1">총 투자금</div>
            <div className="text-xl font-semibold text-[#888]">
              {totalAllInvestment.toLocaleString()} 원
            </div>
          </div>
          <div>
            <div className="text-sm text-[#888] mb-1">총 손익</div>
            <div className={`text-xl font-semibold ${totalAllProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {totalAllProfit >= 0 ? '+' : ''}{totalAllProfit.toLocaleString()} 원
            </div>
          </div>
          <div>
            <div className="text-sm text-[#888] mb-1">총 평가손익</div>
            <div className={`text-xl font-semibold ${totalAllProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {totalAllProfitRate >= 0 ? '+' : ''}{totalAllProfitRate.toFixed(2)}%
            </div>
          </div>
          <div>
            <div className="text-sm text-[#888] mb-1">총 실현손익</div>
            <div className={`text-xl font-semibold ${totalAllRealized >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {totalAllRealized >= 0 ? '+' : ''}{totalAllRealized.toLocaleString()} 원
            </div>
          </div>
        </div>
      </div>

      {/* 계좌별 현황판 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {MOCK_ACCOUNTS.map((account) => (
          <div
            key={account.id}
            className="bg-white/5 rounded-xl p-6 border border-white/10 hover:border-[#4fc3f7] transition-all cursor-pointer"
            onClick={() => setSelectedAccount(account)}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">{account.name}</h3>
              {selectedAccount.id === account.id && (
                <span className="text-xs bg-[#4fc3f7] text-black px-2 py-1 rounded">선택됨</span>
              )}
            </div>
            
            <div className="space-y-3">
              <div>
                <div className="text-xs text-[#888] mb-1">총 평가금액</div>
                <div className="text-lg font-bold text-white">
                  {account.totalValue.toLocaleString()} 원
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <div className="text-[#888] mb-1">투자금액</div>
                  <div className="text-white font-semibold">
                    {account.totalInvestment.toLocaleString()} 원
                  </div>
                </div>
                <div>
                  <div className="text-[#888] mb-1">평균</div>
                  <div className={`font-semibold ${account.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {account.totalProfit >= 0 ? '+' : ''}{account.totalProfit.toLocaleString()} 원
                  </div>
                </div>
                <div>
                  <div className="text-[#888] mb-1">평가손익</div>
                  <div className={`font-semibold ${account.totalProfitRate >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {account.totalProfitRate >= 0 ? '+' : ''}{account.totalProfitRate.toFixed(2)}%
                  </div>
                </div>
              </div>
              
              <div>
                <div className="text-xs text-[#888] mb-1">실현손익(누적)</div>
                <div className={`text-sm font-semibold ${account.realizedProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {account.realizedProfit >= 0 ? '+' : ''}{account.realizedProfit.toLocaleString()} 원
                </div>
              </div>
            </div>
          </div>
        ))}
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

      {/* 2. 자금 구조 + 비중 차트 (3분할) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 자금 구조 */}
        <div className="bg-gradient-to-br from-[#4fc3f7]/10 to-[#29b6f6]/10 rounded-xl p-6 border border-[#4fc3f7]/30">
          <h2 className="text-xl font-bold text-white mb-4">자금 구조</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-2xl font-bold text-white">
              <span>총 자금</span>
              <span>{(selectedAccount.totalFunds * 10000).toLocaleString()}원</span>
            </div>

            <div className="h-px bg-white/20 my-3"></div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-white">
                <span className="text-[#888]">예비비</span>
                <span className="font-semibold">
                  {(
                    (selectedAccount.reserveFunds.fixed +
                    selectedAccount.reserveFunds.extreme) * 10000
                  ).toLocaleString()}
                  원
                </span>
              </div>
              <div className="ml-6 space-y-1 text-sm">
                <div className="flex justify-between text-[#888]">
                  <span>
                    ├─ 고정 예비비{' '}
                    <span className="text-red-400 font-bold">🔒</span>
                  </span>
                  <span>{(selectedAccount.reserveFunds.fixed * 10000).toLocaleString()}원</span>
                </div>
                <div className="flex justify-between text-[#888]">
                  <span>└─ 예비비</span>
                  <span>
                    {(selectedAccount.reserveFunds.extreme * 10000).toLocaleString()}원
                  </span>
                </div>
              </div>
            </div>

            <div className="h-px bg-white/20 my-3"></div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-white">
                <span className="text-[#888]">투자 시드</span>
                <span className="font-semibold text-[#4fc3f7]">
                  {(selectedAccount.investmentSeed * 10000).toLocaleString()}원
                </span>
              </div>
              <div className="ml-6 space-y-1 text-sm">
                <div className="flex justify-between text-[#888]">
                  <span>├─ 미장</span>
                  <span>
                    {((selectedAccount.investmentSeed / 2) * 10000).toLocaleString()}원 (50%)
                  </span>
                </div>
                <div className="flex justify-between text-[#888]">
                  <span>└─ 국장</span>
                  <span>
                    {((selectedAccount.investmentSeed / 2) * 10000).toLocaleString()}원 (50%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 국내주식 비중 */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="text-center text-[#81d4fa] text-lg font-bold mb-4">국내주식 비중</h3>
          <div className="flex items-center justify-center">
            <PieChart
              items={[
                { label: 'AI칩', value: 42000000, color: '#4fc3f7' },
                { label: '로봇', value: 35000000, color: '#29b6f6' },
                { label: '배터리', value: 18000000, color: '#81d4fa' },
                { label: '기타', value: 10000000, color: '#b3e5fc' },
              ]}
              total={105000000}
              centerValue="4"
              centerLabel="섹터"
              gridLegend
              maxLegendHeight={180}
            />
          </div>
        </div>

        {/* 해외주식 비중 */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="text-center text-[#81d4fa] text-lg font-bold mb-4">해외주식 비중</h3>
          <div className="flex items-center justify-center">
            <PieChart
              items={[
                { label: 'AI칩', value: 62000000, color: '#4fc3f7' },
                { label: '빅테크', value: 28000000, color: '#29b6f6' },
                { label: '광학', value: 12000000, color: '#81d4fa' },
                { label: '기타', value: 8000000, color: '#b3e5fc' },
              ]}
              total={110000000}
              centerValue="4"
              centerLabel="섹터"
              gridLegend
              maxLegendHeight={180}
            />
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
              장기투자: {(longTermTotal * 10000).toLocaleString()}원 ({longTermUsage.toFixed(1)}%), 배분 {(currentPortfolio.longTerm.budget * 10000).toLocaleString()}원 (60%)
            </h2>
            <div className="text-sm text-[#888]">
              슬롯: {currentPortfolio.longTerm.positions.length}/{currentPortfolio.longTerm.maxSlots}
            </div>
          </div>

          <div className="mb-4 text-sm text-[#888]">
            • 비중 제한: 1종목 40% / 1테마 50%
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {/* 채워진 슬롯 */}
            {currentPortfolio.longTerm.positions.map((pos, idx) => {
              const isUS = currentPortfolio.market === 'US';
              const profitAmountKRW = pos.profitAmount
                ? isUS
                  ? pos.profitAmount * EXCHANGE_RATE
                  : pos.profitAmount
                : 0;
              const profitColor =
                (pos.profitRate || 0) > 0
                  ? 'text-green-400'
                  : (pos.profitRate || 0) < 0
                  ? 'text-red-400'
                  : 'text-gray-400';
              
              // 현재 가치 (원화)
              const currentValueKRW = pos.amount * 10000;
              
              // 매수금액 (원화)
              const purchaseAmountKRW = pos.avgPrice && pos.shares
                ? isUS
                  ? pos.avgPrice * pos.shares * EXCHANGE_RATE
                  : pos.avgPrice * pos.shares
                : 0;
              
              return (
                <div
                  key={idx}
                  className="bg-gradient-to-br from-[#4fc3f7]/20 to-[#29b6f6]/20 border border-[#4fc3f7]/50 rounded-lg p-4 hover:scale-105 transition-transform cursor-pointer"
                >
                  <div className="text-xl font-bold text-white mb-1">
                    {pos.ticker}
                  </div>
                  <div className="text-sm text-[#888] mb-2">{pos.name}</div>
                  <div className="text-xs text-[#888] mb-3">
                    🏷️ {pos.theme}
                  </div>

                  <div className="text-lg font-bold text-[#4fc3f7] mb-1">
                    💰 {currentValueKRW.toLocaleString()}원
                  </div>
                  <div className="text-xs text-[#888] mb-1">(현재 가격 기준)</div>
                  <div className="text-sm text-[#888] mb-3">
                    비중: {pos.percentage.toFixed(1)}%
                  </div>

                  {/* 추가 정보 */}
                  {pos.avgPrice && pos.shares && pos.currentPrice && (
                    <div className="mt-3 pt-3 border-t border-white/10 space-y-1 text-xs">
                      <div className="text-[#888]">
                        📊 매수평균: {isUS ? '$' : '₩'}
                        {pos.avgPrice.toLocaleString()}
                      </div>
                      <div className="text-[#888]">
                        매수금액: {purchaseAmountKRW.toLocaleString()}원
                      </div>
                      <div className="text-[#888]">
                        보유: {pos.shares.toLocaleString()}주
                      </div>
                      <div className="text-[#888]">
                        현재가: {isUS ? '$' : '₩'}
                        {pos.currentPrice.toLocaleString()}{' '}
                        {(pos.profitRate || 0) > 0 ? '📈' : (pos.profitRate || 0) < 0 ? '📉' : ''}
                      </div>
                      <div className={profitColor + ' font-semibold'}>
                        수익: {profitAmountKRW >= 0 ? '+' : ''}
                        {profitAmountKRW.toLocaleString()}원
                      </div>
                      <div className={profitColor + ' font-semibold'}>
                        수익률: {(pos.profitRate || 0) >= 0 ? '+' : ''}
                        {(pos.profitRate || 0).toFixed(1)}%{' '}
                        {(pos.profitRate || 0) > 0 ? '🟢' : (pos.profitRate || 0) < 0 ? '🔴' : '⚪'}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* 빈 슬롯 */}
            {Array.from({
              length:
                currentPortfolio.longTerm.maxSlots -
                currentPortfolio.longTerm.positions.length,
            }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                onClick={() => setAddPositionOpen(true)}
                className="bg-white/5 border-2 border-dashed border-white/20 rounded-lg p-4 flex items-center justify-center hover:border-[#4fc3f7] hover:bg-white/10 transition-all cursor-pointer"
              >
                <div className="text-center text-[#888]">
                  <div className="text-3xl mb-2">+</div>
                  <div className="text-sm">종목/테마 추가</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 중단타 */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">
              중단타: {(midTermTotal * 10000).toLocaleString()}원 ({midTermUsage.toFixed(1)}%), 배분 {(currentPortfolio.midTerm.budget * 10000).toLocaleString()}원 (30%)
            </h2>
            <div className="text-sm text-[#888]">
              슬롯: {currentPortfolio.midTerm.positions.length}/{currentPortfolio.midTerm.maxSlots}
            </div>
          </div>

          <div className="mb-4 text-sm text-[#888]">
            • 비중 제한: 1종목 25%
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
            {/* 채워진 슬롯 */}
            {currentPortfolio.midTerm.positions.map((pos, idx) => {
              const isUS = currentPortfolio.market === 'US';
              const profitAmountKRW = pos.profitAmount
                ? isUS
                  ? pos.profitAmount * EXCHANGE_RATE
                  : pos.profitAmount
                : 0;
              const profitColor =
                (pos.profitRate || 0) > 0
                  ? 'text-green-400'
                  : (pos.profitRate || 0) < 0
                  ? 'text-red-400'
                  : 'text-gray-400';
              
              // 현재 가치 (원화)
              const currentValueKRW = pos.amount * 10000;
              
              // 매수금액 (원화)
              const purchaseAmountKRW = pos.avgPrice && pos.shares
                ? isUS
                  ? pos.avgPrice * pos.shares * EXCHANGE_RATE
                  : pos.avgPrice * pos.shares
                : 0;
              
              return (
                <div
                  key={idx}
                  className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/50 rounded-lg p-4 hover:scale-105 transition-transform cursor-pointer"
                >
                  <div className="text-xl font-bold text-white mb-1">
                    {pos.ticker}
                  </div>
                  <div className="text-sm text-[#888] mb-2">{pos.name}</div>
                  <div className="text-xs text-[#888] mb-3">
                    🏷️ {pos.theme}
                  </div>

                  <div className="text-lg font-bold text-purple-400 mb-1">
                    💰 {currentValueKRW.toLocaleString()}원
                  </div>
                  <div className="text-xs text-[#888] mb-1">(현재 가격 기준)</div>
                  <div className="text-sm text-[#888] mb-3">
                    비중: {pos.percentage.toFixed(1)}%
                  </div>

                  {/* 추가 정보 */}
                  {pos.avgPrice && pos.shares && pos.currentPrice && (
                    <div className="mt-3 pt-3 border-t border-white/10 space-y-1 text-xs">
                      <div className="text-[#888]">
                        📊 매수평균: {isUS ? '$' : '₩'}
                        {pos.avgPrice.toLocaleString()}
                      </div>
                      <div className="text-[#888]">
                        매수금액: {purchaseAmountKRW.toLocaleString()}원
                      </div>
                      <div className="text-[#888]">
                        보유: {pos.shares.toLocaleString()}주
                      </div>
                      <div className="text-[#888]">
                        현재가: {isUS ? '$' : '₩'}
                        {pos.currentPrice.toLocaleString()}{' '}
                        {(pos.profitRate || 0) > 0 ? '📈' : (pos.profitRate || 0) < 0 ? '📉' : ''}
                      </div>
                      <div className={profitColor + ' font-semibold'}>
                        수익: {profitAmountKRW >= 0 ? '+' : ''}
                        {profitAmountKRW.toLocaleString()}원
                      </div>
                      <div className={profitColor + ' font-semibold'}>
                        수익률: {(pos.profitRate || 0) >= 0 ? '+' : ''}
                        {(pos.profitRate || 0).toFixed(1)}%{' '}
                        {(pos.profitRate || 0) > 0 ? '🟢' : (pos.profitRate || 0) < 0 ? '🔴' : '⚪'}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* 빈 슬롯 */}
            {Array.from({
              length:
                currentPortfolio.midTerm.maxSlots -
                currentPortfolio.midTerm.positions.length,
            }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                onClick={() => setAddPositionOpen(true)}
                className="bg-white/5 border-2 border-dashed border-white/20 rounded-lg p-4 flex items-center justify-center hover:border-purple-500 hover:bg-white/10 transition-all cursor-pointer"
              >
                <div className="text-center text-[#888]">
                  <div className="text-3xl mb-2">+</div>
                  <div className="text-sm">종목/테마 추가</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 현금 */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">
              현금: {(cashTotal * 10000).toLocaleString()}원 ({cashUsage.toFixed(1)}%), 배분 {(currentPortfolio.cash.budget * 10000).toLocaleString()}원 (10%)
            </h2>
            <div className="text-sm text-[#888]">
              슬롯: {currentPortfolio.cash.positions.length}/{currentPortfolio.cash.maxSlots}
            </div>
          </div>

          <div className="mb-4 text-sm text-[#888]">
            • 1종목 최대: {(875 * 10000).toLocaleString()}원 (50%) | 별도 슬롯 카운트
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
                  {(pos.amount * 10000).toLocaleString()}원
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
                onClick={() => setAddPositionOpen(true)}
                className="bg-white/5 border-2 border-dashed border-white/20 rounded-lg p-4 flex items-center justify-center hover:border-green-500 hover:bg-white/10 transition-all cursor-pointer"
              >
                <div className="text-center text-[#888]">
                  <div className="text-3xl mb-2">+</div>
                  <div className="text-sm">종목/테마 추가</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 시스템 노트 */}
      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
        <h3 className="text-lg font-bold text-white mb-3">📝 시스템 안내</h3>
        <ul className="space-y-2 text-sm text-[#888]">
          <li>✅ 계좌별 자금 관리 (진원/아빠/리온)</li>
          <li>✅ 시장별 포트폴리오 (미장/국장)</li>
          <li>✅ 슬롯 기반 비중 제한 (장기 5개, 중단타 7개, 현금 3개)</li>
          <li>✅ 실시간 비중 경고 시스템</li>
          <li className="text-yellow-400">
            🔄 현재: Mock 데이터 표시 중 (실제 DB 연동 예정)
          </li>
        </ul>
      </div>

      {/* 모달들 */}
      {selectedTheme && (
        <ThemeDetailModal
          isOpen={themeDetailOpen}
          onClose={() => {
            setThemeDetailOpen(false);
            setSelectedTheme(null);
          }}
          themeName={selectedTheme.name}
          totalValue={selectedTheme.totalValue}
          currentWeight={selectedTheme.currentWeight}
          targetWeight={selectedTheme.targetWeight}
          stocks={selectedTheme.stocks}
          market={selectedMarket}
        />
      )}

      <AddPositionModal
        isOpen={addPositionOpen}
        onClose={() => setAddPositionOpen(false)}
        onSubmit={(data) => {
          console.log('New position:', data);
          // TODO: API 연동
          alert('종목/테마 추가 기능은 API 연동 후 활성화됩니다');
        }}
        market={selectedMarket}
      />
    </div>
  );
}
