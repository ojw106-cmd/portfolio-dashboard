'use client';

import { useMemo } from 'react';
import { useSectorStore } from '@/stores/useSectorStore';

interface ThemeStock {
  id: string;
  code: string;
  name: string;
  currentPrice: number;
  holdingQty: number;
  buyPrice: number;
}

interface ThemeCardProps {
  themeName: string;
  themeCode: string;
  stocks: ThemeStock[];
  totalValue: number; // 테마 내 평가금액
  currentWeight: number; // 현재 비중 (시장 대비)
  targetWeight: number; // 목표 비중
  exchangeRate: number;
  market: 'KR' | 'US';
  onClick?: () => void;
}

export function ThemeCard({
  themeName,
  themeCode,
  stocks,
  totalValue,
  currentWeight,
  targetWeight,
  exchangeRate,
  market,
  onClick,
}: ThemeCardProps) {
  const { getSectorColor } = useSectorStore();
  const themeColor = getSectorColor(themeCode);

  // 테마 총 손익 계산
  const profitInfo = useMemo(() => {
    const rate = market === 'US' ? exchangeRate : 1;
    let costTotal = 0;
    let evalTotal = 0;

    stocks.forEach((stock) => {
      const cost = stock.buyPrice * stock.holdingQty * rate;
      const evalVal = stock.currentPrice * stock.holdingQty * rate;
      costTotal += cost;
      evalTotal += evalVal;
    });

    const profit = evalTotal - costTotal;
    const profitPct = costTotal > 0 ? (profit / costTotal) * 100 : 0;

    return { profit, profitPct, costTotal, evalTotal };
  }, [stocks, market, exchangeRate]);

  // 비중 차이
  const weightDiff = currentWeight - targetWeight;

  // 종목 리스트 (최대 5개 + more)
  // 국장은 회사명, 미장은 티커 표시
  const tickerList = useMemo(() => {
    const labels = stocks.map((s) => market === 'KR' ? s.name : s.code);
    if (labels.length <= 5) {
      return labels.join(' / ');
    }
    return labels.slice(0, 5).join(' / ') + ` +${labels.length - 5}`;
  }, [stocks, market]);

  const profitClass =
    profitInfo.profit > 0
      ? 'text-[#e53935]'
      : profitInfo.profit < 0
      ? 'text-[#1e88e5]'
      : 'text-[#888]';

  const weightDiffClass =
    weightDiff > 0.5
      ? 'text-[#e53935]'
      : weightDiff < -0.5
      ? 'text-[#1e88e5]'
      : 'text-[#66bb6a]';

  const formatValue = (value: number) => {
    if (value >= 100000000) {
      return `${(value / 100000000).toFixed(1)}억`;
    }
    if (value >= 10000) {
      return `${Math.round(value / 10000).toLocaleString()}만`;
    }
    return value.toLocaleString();
  };

  return (
    <div
      onClick={onClick}
      className="group relative bg-white/5 border border-white/10 rounded-xl p-4 cursor-pointer
                 hover:bg-white/10 hover:border-white/20 transition-all duration-200
                 hover:shadow-lg hover:shadow-black/20"
    >
      {/* 테마 컬러 인디케이터 */}
      <div
        className="absolute top-0 left-0 w-1 h-full rounded-l-xl"
        style={{ backgroundColor: themeColor }}
      />

      {/* 헤더: 테마명 + 종목수 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className="px-2 py-0.5 rounded-full text-xs font-semibold"
            style={{ backgroundColor: themeColor, color: '#fff' }}
          >
            {themeName}
          </span>
          <span className="text-xs text-[#888]">{stocks.length}종목</span>
        </div>
        <svg
          className="w-4 h-4 text-[#888] group-hover:text-white transition-colors"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>

      {/* 평가금액 & 손익 */}
      <div className="mb-3">
        <div className="text-lg font-bold text-[#4fc3f7]">
          {formatValue(totalValue)}원
        </div>
        <div className={`text-sm font-medium ${profitClass}`}>
          {profitInfo.profit >= 0 ? '+' : ''}
          {formatValue(profitInfo.profit)}원 ({profitInfo.profitPct >= 0 ? '+' : ''}
          {profitInfo.profitPct.toFixed(1)}%)
        </div>
      </div>

      {/* 비중 정보 */}
      <div className="flex items-center gap-4 text-xs mb-3">
        <div>
          <span className="text-[#888]">현재: </span>
          <span className="text-white font-medium">{currentWeight.toFixed(1)}%</span>
        </div>
        <div>
          <span className="text-[#888]">목표: </span>
          <span className="text-[#888] font-medium">{targetWeight.toFixed(1)}%</span>
        </div>
        <div className={weightDiffClass}>
          {weightDiff >= 0 ? '+' : ''}
          {weightDiff.toFixed(1)}%p
        </div>
      </div>

      {/* 종목 리스트 */}
      <div className="text-xs text-[#666] truncate">{tickerList}</div>

      {/* 프로그레스 바: 목표 대비 현재 비중 */}
      <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${Math.min((currentWeight / Math.max(targetWeight, 0.1)) * 100, 100)}%`,
            backgroundColor: themeColor,
            opacity: 0.8,
          }}
        />
      </div>
    </div>
  );
}
