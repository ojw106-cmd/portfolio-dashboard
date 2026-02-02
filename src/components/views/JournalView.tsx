'use client';

import { useEffect, useState, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useJournalStore } from '@/stores/useJournalStore';
import { formatKRW } from '@/lib/formatters';

interface Trade {
  id: string;
  type: string;
  market: string;
  code?: string;
  name?: string;
  price?: number;
  qty?: number;
  amount?: number;
  pnl?: number;
  date: string;
}

interface GroupedTrades {
  [accountId: string]: {
    accountId: string;
    accountName: string;
    trades: Trade[];
  };
}

export function JournalView() {
  const { entries, currentYear, currentMonth, fetchJournal, saveEntry, toggleImportant, setCurrentMonth } =
    useJournalStore();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [journalContent, setJournalContent] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [dateTrades, setDateTrades] = useState<GroupedTrades>({});
  const [isLoadingTrades, setIsLoadingTrades] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchJournal();
  }, [fetchJournal]);

  // 특정 날짜의 거래 내역 로드
  const fetchTradesForDate = async (date: string) => {
    setIsLoadingTrades(true);
    try {
      const res = await fetch(`/api/trades/by-date?date=${date}`);
      if (res.ok) {
        const data = await res.json();
        setDateTrades(data);
      }
    } catch (error) {
      console.error('Failed to fetch trades:', error);
    }
    setIsLoadingTrades(false);
  };

  const handlePrevMonth = () => {
    let newMonth = currentMonth - 1;
    let newYear = currentYear;
    if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    }
    setCurrentMonth(newYear, newMonth);
  };

  const handleNextMonth = () => {
    let newMonth = currentMonth + 1;
    let newYear = currentYear;
    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    }
    setCurrentMonth(newYear, newMonth);
  };

  const handleDateClick = async (date: string) => {
    setSelectedDate(date);
    const entry = entries[date];
    setJournalContent(entry?.content || '');
    setIsImportant(entry?.important || false);
    await fetchTradesForDate(date);
  };

  const handleSave = async () => {
    if (selectedDate) {
      await saveEntry(selectedDate, journalContent);
      const currentEntry = entries[selectedDate];
      if ((currentEntry?.important ?? false) !== isImportant) {
        await toggleImportant(selectedDate);
      }
      setSelectedDate(null);
      setDateTrades({});
    }
  };

  const handleToggleImportant = () => {
    setIsImportant(!isImportant);
  };

  // 텍스트 포맷팅 함수
  const insertFormatting = (prefix: string, suffix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = journalContent.substring(start, end);
    const beforeText = journalContent.substring(0, start);
    const afterText = journalContent.substring(end);

    const newText = `${beforeText}${prefix}${selectedText}${suffix}${afterText}`;
    setJournalContent(newText);

    // 커서 위치 조정
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + prefix.length + selectedText.length + suffix.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleBold = () => insertFormatting('**', '**');
  const handleItalic = () => insertFormatting('*', '*');
  const handleUnderline = () => insertFormatting('<u>', '</u>');

  // 거래 내역 포맷팅
  const formatTrade = (trade: Trade) => {
    const typeLabels: Record<string, string> = {
      buy: '매수',
      sell: '매도',
      deposit: '입금',
      withdraw: '출금',
      exchange: '환전',
    };

    if (trade.type === 'buy' || trade.type === 'sell') {
      const pnlText = trade.type === 'sell' && trade.pnl !== undefined
        ? ` (손익: ${trade.pnl >= 0 ? '+' : ''}${formatKRW(trade.pnl)})`
        : '';
      return `${typeLabels[trade.type]} ${trade.name} ${trade.qty}주 @ ${trade.market === 'KR' ? formatKRW(trade.price || 0) : `$${trade.price?.toFixed(2)}`}${pnlText}`;
    }

    if (trade.type === 'deposit' || trade.type === 'withdraw') {
      return `${typeLabels[trade.type]} ${trade.market === 'KR' ? formatKRW(trade.amount || 0) : `$${(trade.amount || 0).toFixed(2)}`}`;
    }

    return `${typeLabels[trade.type] || trade.type}`;
  };

  // 캘린더 데이터 생성
  const firstDay = new Date(currentYear, currentMonth - 1, 1);
  const lastDay = new Date(currentYear, currentMonth, 0);
  const startDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const weeks: (number | null)[][] = [];
  let currentWeek: (number | null)[] = [];

  for (let i = 0; i < startDayOfWeek; i++) {
    currentWeek.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  // 계정 순서 정의
  const accountOrder = ['jinwon', 'dad', 'lion'];
  const sortedAccounts = Object.values(dateTrades).sort((a, b) => {
    const aIndex = accountOrder.indexOf(a.accountId);
    const bIndex = accountOrder.indexOf(b.accountId);
    return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
  });

  // 텍스트를 HTML로 렌더링 (볼드, 이탤릭, 밑줄 지원)
  const renderFormattedText = (text: string) => {
    // **bold** -> <strong>
    let formatted = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // *italic* -> <em>
    formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');
    // <u>underline</u> is already HTML
    return formatted;
  };

  return (
    <div className="space-y-6">
      <Card>
        {/* 캘린더 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <Button variant="ghost" onClick={handlePrevMonth}>
            &lt; 이전
          </Button>
          <h2 className="text-xl font-semibold text-[#4fc3f7]">
            {currentYear}년 {currentMonth}월
          </h2>
          <Button variant="ghost" onClick={handleNextMonth}>
            다음 &gt;
          </Button>
        </div>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map((day, i) => (
            <div
              key={day}
              className={`text-center py-2 text-sm font-medium ${
                i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-[#888]'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 캘린더 그리드 */}
        <div className="grid grid-cols-7 gap-1">
          {weeks.map((week, weekIndex) =>
            week.map((day, dayIndex) => {
              if (day === null) {
                return (
                  <div
                    key={`${weekIndex}-${dayIndex}`}
                    className="min-h-[180px] bg-transparent rounded"
                  />
                );
              }

              const dateKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const entry = entries[dateKey];
              const hasEntry = !!entry?.content;
              const isImportantDate = entry?.important ?? false;
              const isToday =
                new Date().toISOString().split('T')[0] === dateKey;

              return (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  onClick={() => handleDateClick(dateKey)}
                  className={`min-h-[180px] p-2 rounded cursor-pointer transition-all hover:-translate-y-0.5 ${
                    hasEntry
                      ? 'bg-[#4fc3f7]/15'
                      : 'bg-white/[0.05]'
                  } ${
                    isToday
                      ? 'border-2 border-[#4fc3f7]'
                      : 'hover:bg-white/[0.10]'
                  }`}
                >
                  <div className="relative">
                    <div
                      className={`text-sm font-semibold mb-1 ${
                        dayIndex === 0
                          ? 'text-red-400'
                          : dayIndex === 6
                          ? 'text-[#4fc3f7]'
                          : 'text-[#ccc]'
                      }`}
                    >
                      {day}
                    </div>
                    <div className="absolute top-0 right-0 flex items-center gap-1">
                      {isImportantDate && (
                        <span className="text-yellow-400 text-sm">★</span>
                      )}
                      {hasEntry && (
                        <div className="w-2 h-2 bg-[#4fc3f7] rounded-full" />
                      )}
                    </div>
                  </div>
                  {hasEntry && (
                    <div
                      className="text-xs text-[#888] line-clamp-5 whitespace-pre-wrap leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: renderFormattedText(entry.content.substring(0, 100) + (entry.content.length > 100 ? '...' : '')),
                      }}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* 일지 편집 모달 */}
      <Modal
        isOpen={!!selectedDate}
        onClose={() => {
          setSelectedDate(null);
          setDateTrades({});
        }}
        title={`매매일지 - ${selectedDate}`}
        size="full"
        footer={
          <div className="flex justify-between w-full">
            <Button
              onClick={handleToggleImportant}
              className={isImportant
                ? 'bg-gradient-to-r from-[#ffc107] to-[#ff9800]'
                : 'bg-white/10 hover:bg-white/20'
              }
            >
              {isImportant ? '★ 중요' : '☆ 중요'}
            </Button>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => {
                setSelectedDate(null);
                setDateTrades({});
              }}>
                취소
              </Button>
              <Button onClick={handleSave}>저장</Button>
            </div>
          </div>
        }
      >
        <div className="space-y-6">
          {/* 매매내역 섹션 */}
          <div>
            <h4 className="text-[#81d4fa] font-semibold mb-3 pb-2 border-b border-white/10">
              매매내역 (자동)
            </h4>
            {isLoadingTrades ? (
              <div className="text-[#888] text-sm">로딩 중...</div>
            ) : sortedAccounts.length === 0 ? (
              <div className="text-[#666] text-sm">이 날짜에 매매내역이 없습니다.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 진원 */}
                <div className="bg-white/5 rounded-lg p-4 min-h-[120px]">
                  <h5 className="text-[#4fc3f7] font-medium mb-2 text-sm">진원</h5>
                  <div className="space-y-1">
                    {dateTrades['jinwon']?.trades.map((trade) => (
                      <div key={trade.id} className="text-xs text-[#ccc]">
                        {formatTrade(trade)}
                      </div>
                    )) || <div className="text-xs text-[#666]">-</div>}
                  </div>
                </div>

                {/* 아빠 */}
                <div className="bg-white/5 rounded-lg p-4 min-h-[120px]">
                  <h5 className="text-[#4fc3f7] font-medium mb-2 text-sm">아빠</h5>
                  <div className="space-y-1">
                    {dateTrades['dad']?.trades.map((trade) => (
                      <div key={trade.id} className="text-xs text-[#ccc]">
                        {formatTrade(trade)}
                      </div>
                    )) || <div className="text-xs text-[#666]">-</div>}
                  </div>
                </div>

                {/* 리온 */}
                <div className="bg-white/5 rounded-lg p-4 min-h-[120px]">
                  <h5 className="text-[#4fc3f7] font-medium mb-2 text-sm">리온</h5>
                  <div className="space-y-1">
                    {dateTrades['lion']?.trades.map((trade) => (
                      <div key={trade.id} className="text-xs text-[#ccc]">
                        {formatTrade(trade)}
                      </div>
                    )) || <div className="text-xs text-[#666]">-</div>}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 매매일지 작성 섹션 */}
          <div>
            <h4 className="text-[#81d4fa] font-semibold mb-3 pb-2 border-b border-white/10">
              매매일지
            </h4>

            {/* 포맷팅 툴바 */}
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={handleBold}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded text-sm font-bold transition-colors"
                title="굵게 (Ctrl+B)"
              >
                B
              </button>
              <button
                type="button"
                onClick={handleItalic}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded text-sm italic transition-colors"
                title="기울임 (Ctrl+I)"
              >
                I
              </button>
              <button
                type="button"
                onClick={handleUnderline}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded text-sm underline transition-colors"
                title="밑줄 (Ctrl+U)"
              >
                U
              </button>
              <span className="text-xs text-[#666] ml-2 self-center">
                텍스트 선택 후 버튼 클릭
              </span>
            </div>

            <textarea
              ref={textareaRef}
              className="w-full h-80 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-[#666] focus:outline-none focus:border-[#4fc3f7] resize-none font-mono"
              placeholder="매매 일지를 입력하세요...&#10;&#10;**굵게** *기울임* <u>밑줄</u>"
              value={journalContent}
              onChange={(e) => setJournalContent(e.target.value)}
              onKeyDown={(e) => {
                // 단축키 지원
                if (e.ctrlKey || e.metaKey) {
                  if (e.key === 'b') {
                    e.preventDefault();
                    handleBold();
                  } else if (e.key === 'i') {
                    e.preventDefault();
                    handleItalic();
                  } else if (e.key === 'u') {
                    e.preventDefault();
                    handleUnderline();
                  }
                }
              }}
            />

          </div>
        </div>
      </Modal>
    </div>
  );
}
