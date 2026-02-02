'use client';

import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { usePortfolioStore } from '@/stores/usePortfolioStore';
import { useAccountStore } from '@/stores/useAccountStore';
import { useExchangeRateStore } from '@/stores/useExchangeRateStore';
import { useUIStore } from '@/stores/useUIStore';
import { useSectorStore } from '@/stores/useSectorStore';
import { formatKRW, formatUSD, formatPercent } from '@/lib/formatters';
import { MARKETS } from '@/lib/constants';

// 섹터 선택 드롭다운 컴포넌트
function SectorSelector({
  currentSector,
  onSelect,
}: {
  currentSector: string;
  onSelect: (sector: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { sectors, getSectorColor } = useSectorStore();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="hover:opacity-80 transition-opacity"
      >
        <Badge type="sector" value={currentSector} />
      </button>

      {isOpen && (
        <div className="absolute z-50 top-full left-0 mt-1 bg-[#1a1a2e] border border-white/20 rounded-lg shadow-xl max-h-60 overflow-y-auto min-w-[120px]">
          {sectors.map((sector) => (
            <button
              key={sector.code}
              onClick={() => {
                onSelect(sector.code);
                setIsOpen(false);
              }}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-white/10 flex items-center gap-2 ${
                currentSector === sector.code ? 'bg-white/5' : ''
              }`}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getSectorColor(sector.code) }}
              />
              <span className="text-white">{sector.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function PortfolioTable() {
  const { stocks, cash, updateStock, removeStock, updateCash } = usePortfolioStore();
  const { currentAccountId } = useAccountStore();
  const { rate } = useExchangeRateStore();
  const { openMemoModal } = useUIStore();

  // 시장별 그룹화
  const stocksByMarket: Record<string, typeof stocks> = {
    KR: [],
    US: [],
    CRYPTO: [],
  };

  stocks.forEach((stock) => {
    if (stocksByMarket[stock.market]) {
      stocksByMarket[stock.market].push(stock);
    }
  });

  // 목표비중 기준 내림차순 정렬
  Object.keys(stocksByMarket).forEach((market) => {
    stocksByMarket[market].sort((a, b) => b.targetWeight - a.targetWeight);
  });

  return (
    <div className="space-y-6">
      {/* 국내 주식 */}
      <MarketSection
        market="KR"
        stocks={stocksByMarket.KR}
        cash={cash.KR}
        exchangeRate={rate}
        onUpdateStock={updateStock}
        onRemoveStock={removeStock}
        onUpdateCash={(data) => currentAccountId && updateCash(currentAccountId, 'KR', data)}
        onOpenMemo={openMemoModal}
      />

      {/* 해외 주식 */}
      <MarketSection
        market="US"
        stocks={stocksByMarket.US}
        cash={cash.US}
        exchangeRate={rate}
        onUpdateStock={updateStock}
        onRemoveStock={removeStock}
        onUpdateCash={(data) => currentAccountId && updateCash(currentAccountId, 'US', data)}
        onOpenMemo={openMemoModal}
      />
    </div>
  );
}

interface MarketSectionProps {
  market: string;
  stocks: {
    id: string;
    market: string;
    sector: string;
    code: string;
    name: string;
    targetWeight: number;
    buyPrice: number;
    currentPrice: number;
    holdingQty: number;
    memo: string | null;
  }[];
  cash?: { amount: number; targetWeight: number; memo: string | null };
  exchangeRate: number;
  onUpdateStock: (id: string, data: Record<string, unknown>) => void;
  onRemoveStock: (id: string) => void;
  onUpdateCash: (data: { amount?: number; targetWeight?: number }) => void;
  onOpenMemo: (stockId?: string, cashMarket?: string) => void;
}

function MarketSection({
  market,
  stocks,
  cash,
  exchangeRate,
  onUpdateStock,
  onRemoveStock,
  onUpdateCash,
  onOpenMemo,
}: MarketSectionProps) {
  if (stocks.length === 0 && (!cash || cash.amount === 0)) {
    return null;
  }

  const rate = market === 'US' ? exchangeRate : 1;

  // 시장별 총계 계산
  let stockTotal = 0;      // 주식 평가금액 합계 (KRW)
  let costTotal = 0;       // 주식 매수원금 합계 (KRW)

  stocks.forEach((stock) => {
    const buyPrice = stock.buyPrice || stock.currentPrice;
    const evalValue = stock.currentPrice * rate * stock.holdingQty;
    const costValue = buyPrice * rate * stock.holdingQty;
    stockTotal += evalValue;
    costTotal += costValue;
  });

  const cashKRW = (cash?.amount || 0) * rate;
  const marketTotal = stockTotal + cashKRW;  // 시장별 총액 (주식 + 현금)
  const marketProfit = stockTotal - costTotal;  // 손익은 주식만
  const marketProfitPct = costTotal > 0 ? (marketProfit / costTotal) * 100 : 0;

  // 목표비중 합계
  const stockTargetWeight = stocks.reduce((sum, s) => sum + s.targetWeight, 0);
  const cashTargetWeight = cash?.targetWeight || 0;
  const totalTargetWeight = stockTargetWeight + cashTargetWeight;

  const marketColors: Record<string, string> = { KR: '#2196f3', US: '#4caf50' };

  const profitClass = marketProfit > 0
    ? 'text-[#e53935]'
    : marketProfit < 0
    ? 'text-[#1e88e5]'
    : 'text-[#888]';

  return (
    <Card>
      {/* 시장 헤더 */}
      <div
        className="flex items-center justify-between mb-4 pb-3 border-b border-white/10"
        style={{ borderLeft: `4px solid ${marketColors[market]}`, paddingLeft: '12px' }}
      >
        <span className="text-lg font-bold text-white">
          {MARKETS[market as keyof typeof MARKETS]}
        </span>
        <div className="flex gap-4 text-sm">
          <span className="text-[#aaa]">
            목표: <span className="text-white font-medium">{totalTargetWeight.toFixed(1)}%</span>
          </span>
          <span className="text-[#aaa]">
            평가: <span className="text-[#4fc3f7] font-medium">{formatKRW(marketTotal)}</span>
          </span>
          <span className={profitClass}>
            손익: {marketProfit >= 0 ? '+' : ''}{formatKRW(marketProfit)} ({marketProfitPct >= 0 ? '+' : ''}{marketProfitPct.toFixed(1)}%)
          </span>
        </div>
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-2 px-2 text-[#888] font-medium">섹터</th>
              <th className="text-left py-2 px-2 text-[#888] font-medium">종목</th>
              <th className="text-right py-2 px-2 text-[#888] font-medium">매수가</th>
              <th className="text-right py-2 px-2 text-[#888] font-medium">보유</th>
              <th className="text-right py-2 px-2 text-[#888] font-medium">매수원금</th>
              <th className="text-right py-2 px-2 text-[#888] font-medium">현재가</th>
              <th className="text-right py-2 px-2 text-[#888] font-medium">평가금액</th>
              <th className="text-right py-2 px-2 text-[#888] font-medium">손익금액</th>
              <th className="text-right py-2 px-2 text-[#888] font-medium">수익률</th>
              <th className="text-right py-2 px-2 text-[#888] font-medium">현재비중</th>
              <th className="text-right py-2 px-2 text-[#888] font-medium">목표비중</th>
              <th className="text-right py-2 px-2 text-[#888] font-medium">목표금액</th>
              <th className="text-right py-2 px-2 text-[#888] font-medium">차이금액</th>
              <th className="text-right py-2 px-2 text-[#888] font-medium">리밸런싱</th>
              <th className="text-center py-2 px-2 text-[#888] font-medium">관리</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((stock) => {
              const buyPrice = stock.buyPrice || stock.currentPrice;
              const costBasis = buyPrice * rate * stock.holdingQty;
              const evalValue = stock.currentPrice * rate * stock.holdingQty;
              const profitLoss = evalValue - costBasis;
              const profitPct = costBasis > 0 ? (profitLoss / costBasis) * 100 : 0;

              // 현재비중: 시장별 비중으로 계산
              const currentWeight = marketTotal > 0 ? (evalValue / marketTotal) * 100 : 0;

              // 리밸런싱 계산 (시장별 평가금액 기준)
              const targetAmount = marketTotal * stock.targetWeight / 100;
              const diffAmount = targetAmount - evalValue;
              const rebalanceQty = stock.currentPrice > 0
                ? Math.floor(Math.abs(diffAmount) / (stock.currentPrice * rate))
                : 0;

              const rowProfitClass = profitLoss > 0
                ? 'text-[#e53935]'
                : profitLoss < 0
                ? 'text-[#1e88e5]'
                : 'text-[#888]';

              const diffClass = diffAmount > 0
                ? 'text-[#e53935]'
                : diffAmount < 0
                ? 'text-[#1e88e5]'
                : 'text-[#888]';

              return (
                <tr
                  key={stock.id}
                  className="border-b border-white/5 hover:bg-white/[0.02]"
                >
                  <td className="py-2 px-2">
                    <SectorSelector
                      currentSector={stock.sector}
                      onSelect={(newSector) => onUpdateStock(stock.id, { sector: newSector })}
                    />
                  </td>
                  <td className="py-2 px-2">
                    <div className="font-medium text-white">{stock.name}</div>
                    <div className="text-xs text-[#666]">{stock.code}</div>
                  </td>
                  <td className="py-2 px-2 text-right">
                    <input
                      type="number"
                      step="any"
                      className="w-20 px-1 py-0.5 text-right bg-white/5 border border-white/10 rounded text-white text-xs"
                      value={stock.buyPrice}
                      onChange={(e) =>
                        onUpdateStock(stock.id, {
                          buyPrice: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </td>
                  <td className="py-2 px-2 text-right">
                    <input
                      type="number"
                      step="any"
                      className="w-16 px-1 py-0.5 text-right bg-white/5 border border-white/10 rounded text-white text-xs"
                      value={stock.holdingQty}
                      onChange={(e) =>
                        onUpdateStock(stock.id, {
                          holdingQty: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </td>
                  <td className="py-2 px-2 text-right text-[#aaa]">
                    {market === 'US' ? formatUSD(buyPrice * stock.holdingQty) : formatKRW(costBasis)}
                  </td>
                  <td className="py-2 px-2 text-right">
                    <input
                      type="number"
                      step="any"
                      className="w-20 px-1 py-0.5 text-right bg-white/5 border border-white/10 rounded text-white text-xs"
                      value={stock.currentPrice}
                      onChange={(e) =>
                        onUpdateStock(stock.id, {
                          currentPrice: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </td>
                  <td className="py-2 px-2 text-right text-[#4fc3f7]">
                    {market === 'US'
                      ? formatUSD(stock.currentPrice * stock.holdingQty)
                      : formatKRW(evalValue)}
                  </td>
                  <td className={`py-2 px-2 text-right font-medium ${rowProfitClass}`}>
                    {profitLoss >= 0 ? '+' : ''}{market === 'US'
                      ? formatUSD(profitLoss / rate)
                      : formatKRW(profitLoss)}
                  </td>
                  <td className={`py-2 px-2 text-right font-medium ${rowProfitClass}`}>
                    {formatPercent(profitPct)}
                  </td>
                  <td className="py-2 px-2 text-right text-[#aaa]">
                    {currentWeight.toFixed(1)}%
                  </td>
                  <td className="py-2 px-2 text-right">
                    <input
                      type="number"
                      className="w-14 px-1 py-0.5 text-right bg-white/5 border border-white/10 rounded text-white text-xs"
                      value={stock.targetWeight}
                      onChange={(e) =>
                        onUpdateStock(stock.id, {
                          targetWeight: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                    <span className="ml-0.5 text-[#888]">%</span>
                  </td>
                  <td className="py-2 px-2 text-right text-[#aaa]">
                    {market === 'US' ? formatUSD(targetAmount / rate) : formatKRW(targetAmount)}
                  </td>
                  <td className={`py-2 px-2 text-right ${diffClass}`}>
                    {diffAmount >= 0 ? '+' : ''}{market === 'US' ? formatUSD(diffAmount / rate) : formatKRW(diffAmount)}
                  </td>
                  <td className="py-2 px-2 text-right">
                    {diffAmount > 0 ? (
                      <span className="text-[#e53935]">매수 {rebalanceQty}주</span>
                    ) : diffAmount < 0 ? (
                      <span className="text-[#1e88e5]">매도 {rebalanceQty}주</span>
                    ) : (
                      <span className="text-[#888]">-</span>
                    )}
                  </td>
                  <td className="py-2 px-2 text-center">
                    <div className="flex gap-1 justify-center">
                      <button
                        onClick={() => onOpenMemo(stock.id)}
                        className={`px-1.5 py-0.5 text-xs rounded hover:bg-white/20 ${
                          stock.memo ? 'bg-[#4fc3f7]/20 text-[#4fc3f7]' : 'bg-white/10'
                        }`}
                        title={stock.memo || '메모 없음'}
                      >
                        메모
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`'${stock.name}'을(를) 삭제하시겠습니까?`)) {
                            onRemoveStock(stock.id);
                          }
                        }}
                        className="px-1.5 py-0.5 text-xs bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {/* 현금 행 */}
            {cash && (
              <tr className="border-b border-white/5 bg-white/[0.03] border-t-2 border-dashed border-white/20">
                <td className="py-2 px-2">
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#9e9e9e] text-white">
                    현금
                  </span>
                </td>
                <td className="py-2 px-2">
                  <div className="font-medium text-[#aaa]">
                    {market === 'US' ? 'USD 예수금' : '원화 예수금'}
                  </div>
                </td>
                <td className="py-2 px-2">-</td>
                <td className="py-2 px-2">-</td>
                <td className="py-2 px-2">-</td>
                <td className="py-2 px-2 text-right">
                  <input
                    type="number"
                    step="any"
                    className="w-24 px-1 py-0.5 text-right bg-white/5 border border-white/10 rounded text-white text-xs"
                    value={cash.amount}
                    onChange={(e) =>
                      onUpdateCash({ amount: parseFloat(e.target.value) || 0 })
                    }
                  />
                </td>
                <td className="py-2 px-2 text-right text-[#4fc3f7]">
                  {market === 'US' ? formatUSD(cash.amount) : formatKRW(cash.amount)}
                </td>
                <td className="py-2 px-2">-</td>
                <td className="py-2 px-2">-</td>
                <td className="py-2 px-2 text-right text-[#aaa]">
                  {marketTotal > 0 ? ((cashKRW / marketTotal) * 100).toFixed(1) : 0}%
                </td>
                <td className="py-2 px-2 text-right">
                  <input
                    type="number"
                    className="w-14 px-1 py-0.5 text-right bg-white/5 border border-white/10 rounded text-white text-xs"
                    value={cash.targetWeight}
                    onChange={(e) =>
                      onUpdateCash({ targetWeight: parseFloat(e.target.value) || 0 })
                    }
                  />
                  <span className="ml-0.5 text-[#888]">%</span>
                </td>
                <td className="py-2 px-2 text-right text-[#aaa]">
                  {market === 'US'
                    ? formatUSD((marketTotal * cashTargetWeight / 100) / rate)
                    : formatKRW(marketTotal * cashTargetWeight / 100)}
                </td>
                <td className={`py-2 px-2 text-right ${
                  (marketTotal * cashTargetWeight / 100) - cashKRW > 0
                    ? 'text-[#e53935]'
                    : (marketTotal * cashTargetWeight / 100) - cashKRW < 0
                    ? 'text-[#1e88e5]'
                    : 'text-[#888]'
                }`}>
                  {(() => {
                    const diff = (marketTotal * cashTargetWeight / 100) - cashKRW;
                    return market === 'US'
                      ? `${diff >= 0 ? '+' : ''}${formatUSD(diff / rate)}`
                      : `${diff >= 0 ? '+' : ''}${formatKRW(diff)}`;
                  })()}
                </td>
                <td className="py-2 px-2 text-right text-[#888]">
                  {(() => {
                    const diff = (marketTotal * cashTargetWeight / 100) - cashKRW;
                    return diff > 0 ? '입금 필요' : diff < 0 ? '여유 자금' : '-';
                  })()}
                </td>
                <td className="py-2 px-2 text-center">
                  <button
                    onClick={() => onOpenMemo(undefined, market)}
                    className={`px-1.5 py-0.5 text-xs rounded hover:bg-white/20 ${
                      cash.memo ? 'bg-[#4fc3f7]/20 text-[#4fc3f7]' : 'bg-white/10'
                    }`}
                  >
                    메모
                  </button>
                </td>
              </tr>
            )}

            {/* 합계 행 */}
            <tr className="bg-[#81d4fa]/10 border-t-2 border-[#81d4fa]/30">
              <td colSpan={2} className="py-2 px-2 font-bold text-[#81d4fa]">
                {MARKETS[market as keyof typeof MARKETS]} 합계
              </td>
              <td className="py-2 px-2">-</td>
              <td className="py-2 px-2">-</td>
              <td className="py-2 px-2 text-right font-bold text-white">
                {market === 'US' ? (
                  <div>
                    <div>{formatUSD(costTotal / rate)}</div>
                    <div className="text-xs text-[#888]">({formatKRW(costTotal)})</div>
                  </div>
                ) : formatKRW(costTotal)}
              </td>
              <td className="py-2 px-2">-</td>
              <td className="py-2 px-2 text-right font-bold text-[#4fc3f7]">
                {market === 'US' ? (
                  <div>
                    <div>{formatUSD(marketTotal / rate)}</div>
                    <div className="text-xs text-[#888]">({formatKRW(marketTotal)})</div>
                  </div>
                ) : formatKRW(marketTotal)}
              </td>
              <td className={`py-2 px-2 text-right font-bold ${profitClass}`}>
                {market === 'US' ? (
                  <div>
                    <div>{marketProfit >= 0 ? '+' : ''}{formatUSD(marketProfit / rate)}</div>
                    <div className="text-xs">({marketProfit >= 0 ? '+' : ''}{formatKRW(marketProfit)})</div>
                  </div>
                ) : (
                  <>{marketProfit >= 0 ? '+' : ''}{formatKRW(marketProfit)}</>
                )}
              </td>
              <td className={`py-2 px-2 text-right font-bold ${profitClass}`}>
                {formatPercent(marketProfitPct)}
              </td>
              <td className="py-2 px-2 text-right font-bold text-white">
                100.0%
              </td>
              <td className={`py-2 px-2 text-right font-bold ${
                Math.abs(totalTargetWeight - 100) < 0.1 ? 'text-[#66bb6a]' : 'text-[#ffa726]'
              }`}>
                {totalTargetWeight.toFixed(1)}%
              </td>
              <td className="py-2 px-2">-</td>
              <td className="py-2 px-2">-</td>
              <td className="py-2 px-2">-</td>
              <td className="py-2 px-2">-</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
}
