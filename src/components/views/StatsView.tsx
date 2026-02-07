'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';

interface Trade {
  id: number;
  accountId: string;
  date: string;
  type: 'BUY' | 'SELL';
  ticker: string;
  name: string;
  market: string;
  quantity: number;
  price: number;
  total: number;
  fee: number;
  realizedProfit?: number;
}

interface RealizedProfitSummary {
  accountId: string;
  accountName: string;
  totalProfit: number;
  tradeCount: number;
}

const ACCOUNT_NAMES: Record<string, string> = {
  jinwon: '진원',
  dad: '아빠',
  leon: '리온',
};

export function StatsView() {
  const [realizedProfits, setRealizedProfits] = useState<RealizedProfitSummary[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  // 실현손익 기간 (기본: 2026-02-06 ~ 오늘)
  const [profitStartDate, setProfitStartDate] = useState('2026-02-06');
  const [profitEndDate, setProfitEndDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  // 거래내역 기간 (기본값 없음, 사용자 설정 필수)
  const [tradeStartDate, setTradeStartDate] = useState('');
  const [tradeEndDate, setTradeEndDate] = useState('');

  useEffect(() => {
    fetchRealizedProfits();
  }, [profitStartDate, profitEndDate]);

  const fetchRealizedProfits = async () => {
    setLoading(true);
    try {
      // TODO: API 연동 (현재는 Mock)
      const mockData: RealizedProfitSummary[] = [
        { accountId: 'jinwon', accountName: '진원', totalProfit: -16240235, tradeCount: 42 },
        { accountId: 'dad', accountName: '아빠', totalProfit: -12105962, tradeCount: 28 },
        { accountId: 'leon', accountName: '리온', totalProfit: -6266000, tradeCount: 15 },
      ];
      setRealizedProfits(mockData);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrades = async () => {
    if (!tradeStartDate || !tradeEndDate) {
      alert('거래내역 조회를 위해 시작일과 종료일을 모두 선택해주세요.');
      return;
    }

    setLoading(true);
    try {
      // TODO: API 연동 (현재는 Mock)
      const mockTrades: Trade[] = [];
      setTrades(mockTrades);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">기록 & 통계</h1>
        <p className="text-[#888]">실현손익 및 거래내역 조회</p>
      </div>

      {/* 실현손익 */}
      <Card title="실현손익">
        <div className="mb-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-[#888]">기간:</label>
            <input
              type="date"
              value={profitStartDate}
              onChange={(e) => setProfitStartDate(e.target.value)}
              className="bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm"
            />
            <span className="text-[#888]">~</span>
            <input
              type="date"
              value={profitEndDate}
              onChange={(e) => setProfitEndDate(e.target.value)}
              className="bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm"
            />
          </div>
          <div className="text-xs text-[#666]">
            (기본: 2026-02-06 룰 세팅 완료일부터)
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {realizedProfits.map((account) => (
            <div
              key={account.accountId}
              className="bg-white/5 rounded-xl p-6 border border-white/10"
            >
              <h3 className="text-xl font-bold text-white mb-4">
                {account.accountName}
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-[#888] mb-1">실현손익</div>
                  <div
                    className={`text-2xl font-bold ${
                      account.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {account.totalProfit >= 0 ? '+' : ''}
                    {account.totalProfit.toLocaleString()} 원
                  </div>
                </div>
                <div>
                  <div className="text-sm text-[#888] mb-1">거래 횟수</div>
                  <div className="text-lg text-white">{account.tradeCount}회</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 거래내역 */}
      <Card title="거래내역">
        <div className="mb-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-[#888]">기간 선택:</label>
            <input
              type="date"
              value={tradeStartDate}
              onChange={(e) => setTradeStartDate(e.target.value)}
              className="bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm"
              placeholder="시작일"
            />
            <span className="text-[#888]">~</span>
            <input
              type="date"
              value={tradeEndDate}
              onChange={(e) => setTradeEndDate(e.target.value)}
              className="bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm"
              placeholder="종료일"
            />
          </div>
          <button
            onClick={fetchTrades}
            className="px-4 py-2 bg-[#4fc3f7] text-black rounded-lg font-semibold hover:bg-[#29b6f6] transition-all"
          >
            조회
          </button>
        </div>

        {!tradeStartDate || !tradeEndDate ? (
          <div className="text-center py-12 text-[#888]">
            기간을 선택하고 조회 버튼을 눌러주세요
          </div>
        ) : trades.length === 0 ? (
          <div className="text-center py-12 text-[#888]">
            해당 기간에 거래내역이 없습니다
          </div>
        ) : (
          <div className="space-y-6">
            {['jinwon', 'dad', 'leon'].map((accountId) => {
              const accountTrades = trades.filter((t) => t.accountId === accountId);
              if (accountTrades.length === 0) return null;

              return (
                <div key={accountId} className="space-y-2">
                  <h3 className="text-lg font-bold text-white">
                    {ACCOUNT_NAMES[accountId]}
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left py-3 px-4 text-[#888]">날짜</th>
                          <th className="text-left py-3 px-4 text-[#888]">구분</th>
                          <th className="text-left py-3 px-4 text-[#888]">종목</th>
                          <th className="text-right py-3 px-4 text-[#888]">수량</th>
                          <th className="text-right py-3 px-4 text-[#888]">단가</th>
                          <th className="text-right py-3 px-4 text-[#888]">금액</th>
                          <th className="text-right py-3 px-4 text-[#888]">수수료</th>
                          <th className="text-right py-3 px-4 text-[#888]">실현손익</th>
                        </tr>
                      </thead>
                      <tbody>
                        {accountTrades.map((trade) => (
                          <tr
                            key={trade.id}
                            className="border-b border-white/5 hover:bg-white/5"
                          >
                            <td className="py-3 px-4 text-white">{trade.date}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-1 rounded text-xs font-semibold ${
                                  trade.type === 'BUY'
                                    ? 'bg-red-500/20 text-red-400'
                                    : 'bg-blue-500/20 text-blue-400'
                                }`}
                              >
                                {trade.type === 'BUY' ? '매수' : '매도'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-white">
                              {trade.ticker} ({trade.name})
                            </td>
                            <td className="py-3 px-4 text-right text-white">
                              {trade.quantity.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right text-white">
                              {trade.market === 'KR' ? '₩' : '$'}
                              {trade.price.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right text-white">
                              {trade.total.toLocaleString()} 원
                            </td>
                            <td className="py-3 px-4 text-right text-[#888]">
                              {trade.fee.toLocaleString()} 원
                            </td>
                            <td className="py-3 px-4 text-right">
                              {trade.realizedProfit !== undefined && (
                                <span
                                  className={
                                    trade.realizedProfit >= 0
                                      ? 'text-green-400'
                                      : 'text-red-400'
                                  }
                                >
                                  {trade.realizedProfit >= 0 ? '+' : ''}
                                  {trade.realizedProfit.toLocaleString()} 원
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* 안내 메시지 */}
      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
        <h3 className="text-lg font-bold text-white mb-3">📝 거래내역 입력 안내</h3>
        <ul className="space-y-2 text-sm text-[#888]">
          <li>
            • 거래내역은 형이 다송에게 전달 → 다송이 입력하는 방식으로 진행됩니다
          </li>
          <li>• UI에서 직접 입력하는 기능은 제공하지 않습니다</li>
          <li>• 2026-02-06 이전 거래는 집계에 포함되지 않습니다 (룰 세팅 완료일 기준)</li>
        </ul>
      </div>
    </div>
  );
}
