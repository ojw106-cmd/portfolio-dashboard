'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';

interface EarningsEvent {
  symbol: string;
  name: string;
  market: string;
  earningsDate: string | null;
  estimatedEPS: number | null;
}

interface Stock {
  code: string;
  name: string;
  market: string;
}

interface EarningsCalendarProps {
  stocks: Stock[];
}

export function EarningsCalendar({ stocks }: EarningsCalendarProps) {
  const [earnings, setEarnings] = useState<EarningsEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEarnings = async () => {
      if (stocks.length === 0) {
        setIsLoading(false);
        return;
      }

      // 중복 제거
      const uniqueStocks = stocks.reduce((acc, stock) => {
        const key = `${stock.market}-${stock.code}`;
        if (!acc.some(s => `${s.market}-${s.code}` === key)) {
          acc.push(stock);
        }
        return acc;
      }, [] as Stock[]);

      try {
        const res = await fetch('/api/earnings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stocks: uniqueStocks }),
        });

        if (res.ok) {
          const data = await res.json();
          setEarnings(data);
        }
      } catch (error) {
        console.error('Failed to fetch earnings:', error);
      }

      setIsLoading(false);
    };

    fetchEarnings();
  }, [stocks]);

  // 실적 발표일이 있는 것만 필터링하고 날짜순 정렬
  const upcomingEarnings = earnings
    .filter(e => e.earningsDate)
    .sort((a, b) => {
      if (!a.earningsDate || !b.earningsDate) return 0;
      return new Date(a.earningsDate).getTime() - new Date(b.earningsDate).getTime();
    });

  // 날짜별로 그룹화
  const groupedByDate = upcomingEarnings.reduce((acc, event) => {
    const date = event.earningsDate!;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(event);
    return acc;
  }, {} as Record<string, EarningsEvent[]>);

  // 오늘 날짜
  const today = new Date().toISOString().split('T')[0];

  // D-day 계산
  const getDday = (dateStr: string) => {
    const date = new Date(dateStr);
    const todayDate = new Date(today);
    const diffTime = date.getTime() - todayDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return { text: 'D-Day', color: 'text-[#e53935] bg-[#e53935]/20' };
    if (diffDays < 0) return { text: `D+${Math.abs(diffDays)}`, color: 'text-[#888] bg-white/5' };
    if (diffDays <= 7) return { text: `D-${diffDays}`, color: 'text-[#ffa726] bg-[#ffa726]/20' };
    return { text: `D-${diffDays}`, color: 'text-[#4fc3f7] bg-[#4fc3f7]/20' };
  };

  // 마켓 뱃지 색상
  const getMarketBadge = (market: string) => {
    switch (market) {
      case 'US':
        return 'bg-[#66bb6a]/20 text-[#66bb6a]';
      case 'KR':
        return 'bg-[#42a5f5]/20 text-[#42a5f5]';
      default:
        return 'bg-white/10 text-[#888]';
    }
  };

  // 날짜 포맷
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      weekday: 'short',
    };
    return date.toLocaleDateString('ko-KR', options);
  };

  if (isLoading) {
    return (
      <Card title="📅 실적발표 일정">
        <div className="text-center py-8 text-[#888]">실적 일정 로딩 중...</div>
      </Card>
    );
  }

  if (upcomingEarnings.length === 0) {
    return (
      <Card title="📅 실적발표 일정">
        <div className="text-center py-8 text-[#888]">
          예정된 실적발표가 없거나 정보를 가져올 수 없습니다.
        </div>
      </Card>
    );
  }

  return (
    <Card title="📅 실적발표 일정">
      <div className="space-y-4 max-h-[400px] overflow-y-auto">
        {Object.entries(groupedByDate).map(([date, events]) => {
          const dday = getDday(date);
          const isPast = new Date(date) < new Date(today);

          return (
            <div
              key={date}
              className={`border-l-2 pl-4 ${
                isPast ? 'border-[#444] opacity-60' : 'border-[#4fc3f7]'
              }`}
            >
              {/* 날짜 헤더 */}
              <div className="flex items-center gap-3 mb-2">
                <span className={`text-sm font-medium ${isPast ? 'text-[#666]' : 'text-white'}`}>
                  {formatDate(date)}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${dday.color}`}>
                  {dday.text}
                </span>
              </div>

              {/* 종목 목록 */}
              <div className="space-y-2">
                {events.map((event, idx) => (
                  <div
                    key={`${event.symbol}-${idx}`}
                    className="flex items-center justify-between bg-white/[0.03] rounded-lg px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${getMarketBadge(event.market)}`}>
                        {event.market}
                      </span>
                      <span className="text-sm text-white font-medium">{event.name}</span>
                      <span className="text-xs text-[#666]">({event.symbol.replace('.KS', '')})</span>
                    </div>
                    {event.estimatedEPS && (
                      <span className="text-xs text-[#888]">
                        EPS 예상: ${event.estimatedEPS.toFixed(2)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* 범례 */}
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/10 text-xs text-[#666]">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#e53935]"></span> 오늘
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#ffa726]"></span> 7일 이내
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#4fc3f7]"></span> 그 이후
        </span>
      </div>
    </Card>
  );
}
