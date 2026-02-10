'use client';

import { useMemo } from 'react';
import { ThemeCard } from './ThemeCard';
import { useSectorStore } from '@/stores/useSectorStore';
import { Card } from '@/components/ui/Card';

interface Stock {
  id: string;
  market: string;
  sector: string;
  code: string;
  name: string;
  targetWeight: number;
  buyPrice: number;
  currentPrice: number;
  holdingQty: number;
}

interface ThemeGridProps {
  stocks: Stock[];
  cash: Record<string, { amount: number; targetWeight: number }>;
  exchangeRate: number;
  market: 'KR' | 'US';
  onThemeClick?: (themeCode: string, stocks: Stock[]) => void;
  onAddClick?: () => void;
}

interface ThemeData {
  themeCode: string;
  themeName: string;
  stocks: Stock[];
  totalValue: number;
  totalCost: number;
  currentWeight: number;
  targetWeight: number;
}

export function ThemeGrid({
  stocks,
  cash,
  exchangeRate,
  market,
  onThemeClick,
  onAddClick,
}: ThemeGridProps) {
  const { getSectorName } = useSectorStore();

  // 시장별 필터링
  const marketStocks = useMemo(
    () => stocks.filter((s) => s.market === market),
    [stocks, market]
  );

  // 시장별 총 평가금액 계산
  const marketTotal = useMemo(() => {
    const rate = market === 'US' ? exchangeRate : 1;
    let stockValue = 0;
    marketStocks.forEach((s) => {
      stockValue += s.currentPrice * s.holdingQty * rate;
    });
    const cashValue = (cash[market]?.amount || 0) * rate;
    return stockValue + cashValue;
  }, [marketStocks, cash, market, exchangeRate]);

  // 테마별 그룹화
  const themeGroups = useMemo(() => {
    const rate = market === 'US' ? exchangeRate : 1;
    const groups: Record<string, ThemeData> = {};

    marketStocks.forEach((stock) => {
      const themeCode = stock.sector;
      if (!groups[themeCode]) {
        groups[themeCode] = {
          themeCode,
          themeName: getSectorName(themeCode),
          stocks: [],
          totalValue: 0,
          totalCost: 0,
          currentWeight: 0,
          targetWeight: 0,
        };
      }

      const evalValue = stock.currentPrice * stock.holdingQty * rate;
      const costValue = stock.buyPrice * stock.holdingQty * rate;

      groups[themeCode].stocks.push(stock);
      groups[themeCode].totalValue += evalValue;
      groups[themeCode].totalCost += costValue;
      groups[themeCode].targetWeight += stock.targetWeight;
    });

    // 현재 비중 계산
    Object.values(groups).forEach((group) => {
      group.currentWeight = marketTotal > 0 ? (group.totalValue / marketTotal) * 100 : 0;
    });

    // 목표비중 내림차순 정렬
    return Object.values(groups).sort((a, b) => b.targetWeight - a.targetWeight);
  }, [marketStocks, market, exchangeRate, marketTotal, getSectorName]);

  // 시장 이름
  const marketName = market === 'KR' ? '국내주식' : '해외주식';

  // 시장별 색상
  const marketColor = market === 'KR' ? '#2196f3' : '#4caf50';

  // 목표비중 합계
  const totalTargetWeight = useMemo(() => {
    let sum = 0;
    themeGroups.forEach((g) => {
      sum += g.targetWeight;
    });
    // 현금 목표비중 추가
    sum += cash[market]?.targetWeight || 0;
    return sum;
  }, [themeGroups, cash, market]);

  if (marketStocks.length === 0) {
    return null;
  }

  return (
    <Card>
      {/* 헤더 */}
      <div
        className="flex items-center justify-between mb-4 pb-3 border-b border-white/10"
        style={{ borderLeft: `4px solid ${marketColor}`, paddingLeft: '12px' }}
      >
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-white">{marketName} 테마</span>
          <span className="text-sm text-[#888]">{themeGroups.length}개 테마</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-[#888]">
            목표합: 
            <span className={`ml-1 font-medium ${
              Math.abs(totalTargetWeight - 100) < 0.5 ? 'text-[#66bb6a]' : 'text-[#ffa726]'
            }`}>
              {totalTargetWeight.toFixed(1)}%
            </span>
          </span>
          <button
            onClick={onAddClick}
            className="px-3 py-1.5 bg-gradient-to-r from-[#4fc3f7] to-[#29b6f6] text-black 
                       text-sm font-semibold rounded-lg hover:opacity-90 transition-all
                       flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            종목 추가
          </button>
        </div>
      </div>

      {/* 테마 카드 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {themeGroups.map((theme) => (
          <ThemeCard
            key={theme.themeCode}
            themeName={theme.themeName}
            themeCode={theme.themeCode}
            stocks={theme.stocks.map((s) => ({
              id: s.id,
              code: s.code,
              name: s.name,
              currentPrice: s.currentPrice,
              holdingQty: s.holdingQty,
              buyPrice: s.buyPrice,
            }))}
            totalValue={theme.totalValue}
            currentWeight={theme.currentWeight}
            targetWeight={theme.targetWeight}
            exchangeRate={exchangeRate}
            market={market}
            onClick={() => onThemeClick?.(theme.themeCode, theme.stocks)}
          />
        ))}

        {/* 현금 카드 (있을 경우) */}
        {cash[market] && cash[market].amount > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 border-dashed">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#9e9e9e] text-white">
                현금
              </span>
              <span className="text-xs text-[#888]">예수금</span>
            </div>
            <div className="text-lg font-bold text-[#4fc3f7] mb-1">
              {(cash[market].amount * (market === 'US' ? exchangeRate : 1)).toLocaleString()}원
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div>
                <span className="text-[#888]">현재: </span>
                <span className="text-white font-medium">
                  {marketTotal > 0
                    ? (
                        ((cash[market].amount * (market === 'US' ? exchangeRate : 1)) /
                          marketTotal) *
                        100
                      ).toFixed(1)
                    : 0}
                  %
                </span>
              </div>
              <div>
                <span className="text-[#888]">목표: </span>
                <span className="text-[#888] font-medium">
                  {cash[market].targetWeight.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
