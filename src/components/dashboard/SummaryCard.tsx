'use client';

import { Card } from '@/components/ui/Card';
import { formatKRW, formatPercent } from '@/lib/formatters';

interface SummaryCardProps {
  accountName: string;
  totalValue: number;
  totalCost: number;
  totalProfit: number;
  profitPct: number;
  totalCash: number;
  realizedPnL: { KR: number; US: number };
  exchangeRate: number;
  onClick?: () => void;
}

export function SummaryCard({
  accountName,
  totalValue,
  totalCost,
  totalProfit,
  profitPct,
  totalCash,
  realizedPnL,
  exchangeRate,
  onClick,
}: SummaryCardProps) {
  const totalRealizedKRW = realizedPnL.KR + realizedPnL.US * exchangeRate;
  const profitClass = totalProfit >= 0 ? 'text-[#e53935]' : 'text-[#1e88e5]';
  const realizedClass = totalRealizedKRW >= 0 ? 'text-[#e53935]' : 'text-[#1e88e5]';

  return (
    <Card
      className="cursor-pointer hover:bg-white/10 transition-colors"
      title={accountName}
      headerRight={
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
          className="text-sm text-[#4fc3f7] hover:underline"
        >
          상세보기
        </button>
      }
    >
      <div onClick={onClick} className="space-y-4">
        {/* 평가금액 */}
        <div className="flex justify-between items-center py-2 border-b border-white/5">
          <span className="text-[#aaa]">총 평가금액</span>
          <span className="text-xl font-semibold text-[#4fc3f7]">
            {formatKRW(totalValue)}
          </span>
        </div>

        {/* 투자원금 & 현금 & 손익 */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <span className="text-sm text-[#888] block mb-1">투자원금</span>
            <span className="text-[#aaa]">{formatKRW(totalCost)}</span>
          </div>
          <div>
            <span className="text-sm text-[#888] block mb-1">현금</span>
            <span className="text-[#66bb6a]">{formatKRW(totalCash)}</span>
          </div>
          <div>
            <span className="text-sm text-[#888] block mb-1">평가손익</span>
            <span className={`font-semibold ${profitClass}`}>
              {totalProfit >= 0 ? '+' : ''}
              {formatKRW(totalProfit)}
            </span>
            <span className={`text-sm ml-2 ${profitClass}`}>
              ({formatPercent(profitPct)})
            </span>
          </div>
        </div>

        {/* 실현손익 */}
        <div className="pt-3 border-t border-white/5">
          <span className="text-sm text-[#888] block mb-1">실현손익 (누적)</span>
          <span className={`font-semibold ${realizedClass}`}>
            {totalRealizedKRW >= 0 ? '+' : ''}
            {formatKRW(totalRealizedKRW)}
          </span>
        </div>
      </div>
    </Card>
  );
}
