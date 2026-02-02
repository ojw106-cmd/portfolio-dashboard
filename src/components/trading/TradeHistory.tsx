'use client';

import { useState, useMemo } from 'react';
import { useTradeStore } from '@/stores/useTradeStore';
import { useAccountStore } from '@/stores/useAccountStore';
import { useJournalStore } from '@/stores/useJournalStore';
import { DEFAULT_ACCOUNT_NAMES } from '@/lib/constants';
import type { Trade } from '@/types';

interface TradeWithTradingDate extends Trade {
  tradingDate?: string;
}

export function TradeHistory() {
  const { trades, deleteTrade } = useTradeStore();
  const { currentAccountId, accounts } = useAccountStore();
  const { removeTradeEntry } = useJournalStore();
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // 현재 계정 이름 가져오기
  const currentAccount = accounts.find((a) => a.accountId === currentAccountId);
  const accountName = currentAccount?.name || DEFAULT_ACCOUNT_NAMES[currentAccountId || ''] || currentAccountId || '';

  // 거래를 날짜별로 그룹핑 + 필터링
  const groupedTrades = useMemo(() => {
    const tradesTyped = trades as TradeWithTradingDate[];
    const groups: Record<string, TradeWithTradingDate[]> = {};

    tradesTyped.forEach((trade) => {
      const tradingDate = trade.tradingDate ||
        (trade.date instanceof Date
          ? trade.date.toISOString().split('T')[0]
          : new Date(trade.date).toISOString().split('T')[0]);

      // 날짜 필터 적용
      if (startDate && tradingDate < startDate) return;
      if (endDate && tradingDate > endDate) return;

      if (!groups[tradingDate]) {
        groups[tradingDate] = [];
      }
      groups[tradingDate].push(trade);
    });

    return groups;
  }, [trades, startDate, endDate]);

  // 정렬된 날짜 목록
  const sortedDates = useMemo(() => {
    return Object.keys(groupedTrades).sort((a, b) => b.localeCompare(a));
  }, [groupedTrades]);

  const handleResetFilter = () => {
    setStartDate('');
    setEndDate('');
  };


  const handleDelete = async (trade: Trade) => {
    if (confirm('이 거래 기록을 삭제하시겠습니까?') && currentAccountId) {
      const tradeDate = trade.date instanceof Date
        ? trade.date.toISOString().split('T')[0]
        : new Date(trade.date).toISOString().split('T')[0];

      await removeTradeEntry({
        accountName,
        type: trade.type as 'buy' | 'sell' | 'deposit' | 'withdraw' | 'exchange',
        market: trade.market || undefined,
        name: trade.name || undefined,
        qty: trade.qty || undefined,
        price: trade.price || trade.amount || undefined,
        pnl: trade.pnl || undefined,
        fromAmount: trade.fromAmount || undefined,
        toAmount: trade.toAmount || undefined,
        direction: trade.direction || undefined,
      }, tradeDate);

      await deleteTrade(trade.id, currentAccountId);
    }
  };

  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (dateStr === todayStr) return '오늘';
    if (dateStr === yesterdayStr) return '어제';

    return date.toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
  };

  const renderTrade = (trade: Trade) => {
    if (trade.type === 'buy' || trade.type === 'sell') {
      const typeClass =
        trade.type === 'buy'
          ? 'bg-[#e53935]/20 text-[#e53935]'
          : 'bg-[#1e88e5]/20 text-[#1e88e5]';
      const typeText = trade.type === 'buy' ? '매수' : '매도';
      const marketEmoji = trade.market === 'KR' ? '🇰🇷' : '🇺🇸';

      return (
        <div
          key={trade.id}
          className="flex justify-between items-center p-3 bg-white/[0.03] rounded-lg"
        >
          <div className="flex items-center gap-3">
            <span className={`px-2 py-1 rounded text-xs font-medium ${typeClass}`}>
              {typeText}
            </span>
            <span className="text-white">
              {marketEmoji} {trade.name}
            </span>
            <span className="text-[#888] text-sm">
              {trade.qty}주 @ {trade.price?.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {trade.type === 'sell' && trade.pnl !== null && (
              <span
                className={`font-medium ${
                  (trade.pnl || 0) >= 0 ? 'text-[#e53935]' : 'text-[#1e88e5]'
                }`}
              >
                {(trade.pnl || 0) >= 0 ? '+' : ''}
                {Math.round(trade.pnl || 0).toLocaleString()}
              </span>
            )}
            <button
              onClick={() => handleDelete(trade)}
              className="text-[#666] hover:text-red-400 text-lg"
            >
              &times;
            </button>
          </div>
        </div>
      );
    }

    if (trade.type === 'deposit') {
      const marketEmoji = trade.market === 'KR' ? '🇰🇷' : '🇺🇸';
      const amountText =
        trade.market === 'KR'
          ? `${trade.amount?.toLocaleString()}원`
          : `$${trade.amount?.toLocaleString()}`;

      return (
        <div
          key={trade.id}
          className="flex justify-between items-center p-3 bg-white/[0.03] rounded-lg"
        >
          <div className="flex items-center gap-3">
            <span className="px-2 py-1 rounded text-xs font-medium bg-green-500/20 text-green-400">
              입금
            </span>
            <span className="text-white">
              {marketEmoji} {amountText}
            </span>
          </div>
          <button
            onClick={() => handleDelete(trade)}
            className="text-[#666] hover:text-red-400 text-lg"
          >
            &times;
          </button>
        </div>
      );
    }

    if (trade.type === 'withdraw') {
      const marketEmoji = trade.market === 'KR' ? '🇰🇷' : '🇺🇸';
      const amountText =
        trade.market === 'KR'
          ? `${trade.amount?.toLocaleString()}원`
          : `$${trade.amount?.toLocaleString()}`;

      return (
        <div
          key={trade.id}
          className="flex justify-between items-center p-3 bg-white/[0.03] rounded-lg"
        >
          <div className="flex items-center gap-3">
            <span className="px-2 py-1 rounded text-xs font-medium bg-orange-500/20 text-orange-400">
              출금
            </span>
            <span className="text-white">
              {marketEmoji} {amountText}
            </span>
          </div>
          <button
            onClick={() => handleDelete(trade)}
            className="text-[#666] hover:text-red-400 text-lg"
          >
            &times;
          </button>
        </div>
      );
    }

    if (trade.type === 'exchange') {
      const fromText =
        trade.direction === 'KR_TO_US'
          ? `${trade.fromAmount?.toLocaleString()}원`
          : `$${trade.fromAmount?.toLocaleString()}`;
      const toText =
        trade.direction === 'KR_TO_US'
          ? `$${trade.toAmount?.toFixed(2)}`
          : `${Math.round(trade.toAmount || 0).toLocaleString()}원`;

      return (
        <div
          key={trade.id}
          className="flex justify-between items-center p-3 bg-white/[0.03] rounded-lg"
        >
          <div className="flex items-center gap-3">
            <span className="px-2 py-1 rounded text-xs font-medium bg-purple-500/20 text-purple-400">
              환전
            </span>
            <span className="text-white">
              {fromText} → {toText}
            </span>
          </div>
          <button
            onClick={() => handleDelete(trade)}
            className="text-[#666] hover:text-red-400 text-lg"
          >
            &times;
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-4">
      {/* 날짜 범위 선택 */}
      <div className="flex flex-wrap items-center gap-3 pb-3 border-b border-white/10">
        <label className="text-sm text-[#888]">거래내역 기간:</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-[#4fc3f7]"
        />
        <span className="text-[#888]">~</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-[#4fc3f7]"
        />
        {(startDate || endDate) && (
          <button
            onClick={handleResetFilter}
            className="text-sm text-[#888] hover:text-white"
          >
            전체 보기
          </button>
        )}
        <span className="text-xs text-[#666]">
          ({sortedDates.length}일, {Object.values(groupedTrades).flat().length}건)
        </span>
      </div>

      {/* 날짜별 거래 내역 */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {sortedDates.length === 0 ? (
          <div className="text-center py-4 text-[#666]">
            {trades.length === 0 ? '거래 내역이 없습니다' : '해당 기간에 거래 내역이 없습니다'}
          </div>
        ) : (
          sortedDates.map((date) => (
            <div key={date}>
              <div className="text-sm font-medium text-[#4fc3f7] mb-2 sticky top-0 bg-[#0d1117] py-1">
                {formatDateLabel(date)} <span className="text-[#666]">({date})</span>
              </div>
              <div className="space-y-2">
                {groupedTrades[date].map((trade) => renderTrade(trade))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
