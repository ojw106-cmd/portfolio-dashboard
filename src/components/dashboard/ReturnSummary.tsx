'use client';

import { formatKRW, formatPercent, formatUSD } from '@/lib/formatters';

interface ReturnSummaryProps {
  krCost: number;
  krProfit: number;
  krProfitPct: number;
  usCostUSD: number;  // USD 기준
  usProfitUSD: number;  // USD 기준
  usProfitPct: number;
  exchangeRate: number;
}

export function ReturnSummary({
  krCost,
  krProfit,
  krProfitPct,
  usCostUSD,
  usProfitUSD,
  usProfitPct,
  exchangeRate,
}: ReturnSummaryProps) {
  // 원화 환산
  const usCostKRW = usCostUSD * exchangeRate;
  const usProfitKRW = usProfitUSD * exchangeRate;

  // 전체 = 국내 + 해외(원화환산)
  const totalCost = krCost + usCostKRW;
  const totalProfit = krProfit + usProfitKRW;
  const totalProfitPct = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

  const getProfitClass = (profit: number) =>
    profit > 0 ? 'text-[#e53935]' : profit < 0 ? 'text-[#1e88e5]' : 'text-[#888]';

  return (
    <div className="grid grid-cols-3 gap-5">
      {/* 전체 */}
      <div className="bg-white/[0.03] rounded-xl p-5 text-center">
        <span className="text-lg text-[#aaa] font-medium block mb-3">전체</span>
        <div className="space-y-2">
          <div className="text-[#9e9e9e]">매수: {formatKRW(totalCost)}</div>
          <div>
            손익:{' '}
            <span className={getProfitClass(totalProfit)}>
              {totalProfit >= 0 ? '+' : ''}
              {formatKRW(totalProfit)}
            </span>
          </div>
          <div className={`text-2xl font-bold ${getProfitClass(totalProfit)}`}>
            {formatPercent(totalProfitPct)}
          </div>
        </div>
      </div>

      {/* 국내 */}
      <div className="bg-white/[0.03] rounded-xl p-5 text-center">
        <span className="text-lg text-[#aaa] font-medium block mb-3">국내</span>
        <div className="space-y-2">
          <div className="text-[#9e9e9e]">매수: {formatKRW(krCost)}</div>
          <div>
            손익:{' '}
            <span className={getProfitClass(krProfit)}>
              {krProfit >= 0 ? '+' : ''}
              {formatKRW(krProfit)}
            </span>
          </div>
          <div className={`text-2xl font-bold ${getProfitClass(krProfit)}`}>
            {formatPercent(krProfitPct)}
          </div>
        </div>
      </div>

      {/* 해외 */}
      <div className="bg-white/[0.03] rounded-xl p-5 text-center">
        <span className="text-lg text-[#aaa] font-medium block mb-3">해외</span>
        <div className="space-y-2">
          <div className="text-[#9e9e9e]">
            <div>매수: {formatUSD(usCostUSD)}</div>
            <div className="text-xs text-[#666]">({formatKRW(usCostKRW)})</div>
          </div>
          <div>
            손익:{' '}
            <span className={getProfitClass(usProfitUSD)}>
              {usProfitUSD >= 0 ? '+' : ''}
              {formatUSD(usProfitUSD)}
            </span>
            <div className={`text-xs ${getProfitClass(usProfitKRW)}`}>
              ({usProfitKRW >= 0 ? '+' : ''}{formatKRW(usProfitKRW)})
            </div>
          </div>
          <div className={`text-2xl font-bold ${getProfitClass(usProfitUSD)}`}>
            {formatPercent(usProfitPct)}
          </div>
        </div>
      </div>
    </div>
  );
}
