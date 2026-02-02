'use client';

import { create } from 'zustand';

interface TradeEntry {
  accountName: string;
  type: 'buy' | 'sell' | 'deposit' | 'withdraw' | 'exchange';
  market?: string;
  name?: string;
  qty?: number;
  price?: number;
  pnl?: number;
  fromAmount?: number;
  toAmount?: number;
  direction?: string;
  rate?: number;
}

interface JournalEntry {
  content: string;
  important: boolean;
}

interface JournalState {
  entries: Record<string, JournalEntry>;
  currentYear: number;
  currentMonth: number;
  isLoading: boolean;

  fetchJournal: (year?: number, month?: number) => Promise<void>;
  saveEntry: (date: string, content: string) => Promise<void>;
  toggleImportant: (date: string) => Promise<void>;
  setCurrentMonth: (year: number, month: number) => void;
  addTradeEntry: (trade: TradeEntry, date?: string) => Promise<void>;
  removeTradeEntry: (trade: TradeEntry, date: string) => Promise<void>;
}

export const useJournalStore = create<JournalState>((set, get) => ({
  entries: {},
  currentYear: new Date().getFullYear(),
  currentMonth: new Date().getMonth() + 1,
  isLoading: false,

  fetchJournal: async (year?: number, month?: number) => {
    const y = year || get().currentYear;
    const m = month || get().currentMonth;

    set({ isLoading: true });
    try {
      const res = await fetch(`/api/journal?year=${y}&month=${m}`);
      const entries = await res.json();
      set({ entries, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch journal:', error);
      set({ isLoading: false });
    }
  },

  saveEntry: async (date: string, content: string) => {
    try {
      const currentEntry = get().entries[date];
      await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, content }),
      });

      set((state) => ({
        entries: {
          ...state.entries,
          [date]: {
            content,
            important: currentEntry?.important ?? false,
          },
        },
      }));
    } catch (error) {
      console.error('Failed to save journal entry:', error);
    }
  },

  toggleImportant: async (date: string) => {
    try {
      const currentEntry = get().entries[date];
      const newImportant = !(currentEntry?.important ?? false);

      await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, important: newImportant }),
      });

      set((state) => ({
        entries: {
          ...state.entries,
          [date]: {
            content: currentEntry?.content ?? '',
            important: newImportant,
          },
        },
      }));
    } catch (error) {
      console.error('Failed to toggle important:', error);
    }
  },

  setCurrentMonth: (year: number, month: number) => {
    set({ currentYear: year, currentMonth: month });
    get().fetchJournal(year, month);
  },

  addTradeEntry: async (_trade: TradeEntry, _date?: string) => {
    // 매매내역은 DB의 trades 테이블에서 자동으로 불러오므로
    // 매매일지 텍스트 영역에는 자동 입력하지 않음
    // 사용자가 직접 텍스트를 입력하는 용도로만 사용
  },

  removeTradeEntry: async (trade: TradeEntry, date: string) => {
    const marketEmoji = trade.market === 'KR' ? '🇰🇷' : trade.market === 'US' ? '🇺🇸' : '';

    let entryPattern = '';

    if (trade.type === 'buy' || trade.type === 'sell') {
      const typeText = trade.type === 'buy' ? '매수' : '매도';
      // 매칭할 패턴 생성 (손익 부분은 선택적)
      entryPattern = `[${trade.accountName}] [${typeText}] ${marketEmoji} ${trade.name} ${trade.qty}주`;
    } else if (trade.type === 'deposit') {
      const amountText = trade.market === 'US'
        ? `$${trade.price?.toLocaleString()}`
        : `${trade.price?.toLocaleString()}원`;
      entryPattern = `[${trade.accountName}] [입금] ${marketEmoji} ${amountText}`;
    } else if (trade.type === 'withdraw') {
      const amountText = trade.market === 'US'
        ? `$${trade.price?.toLocaleString()}`
        : `${trade.price?.toLocaleString()}원`;
      entryPattern = `[${trade.accountName}] [출금] ${marketEmoji} ${amountText}`;
    } else if (trade.type === 'exchange') {
      const fromText = trade.direction === 'KR_TO_US'
        ? `${trade.fromAmount?.toLocaleString()}원`
        : `$${trade.fromAmount?.toLocaleString()}`;
      entryPattern = `[${trade.accountName}] [환전] ${fromText}`;
    }

    if (!entryPattern) return;

    // 해당 날짜의 저널 가져오기
    try {
      const res = await fetch(`/api/journal?year=${date.split('-')[0]}&month=${date.split('-')[1]}`);
      const entries = await res.json();
      const currentEntry = entries[date];
      const currentContent = currentEntry?.content || '';

      if (!currentContent) return;

      // 해당 줄 삭제
      const lines = currentContent.split('\n');
      const filteredLines = lines.filter((line: string) => !line.includes(entryPattern));
      const newContent = filteredLines.join('\n').trim();

      // 저장
      await get().saveEntry(date, newContent);
    } catch (error) {
      console.error('Failed to remove trade entry from journal:', error);
    }
  },
}));
