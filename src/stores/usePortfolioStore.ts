'use client';

import { create } from 'zustand';
import type { Stock, CashHolding } from '@/types';

interface PortfolioState {
  stocks: Stock[];
  cash: Record<string, CashHolding>;
  isLoading: boolean;
  refreshingPrices: boolean;

  fetchPortfolio: (accountId: string) => Promise<void>;
  addStock: (data: {
    accountId: string;
    market: string;
    sector: string;
    code: string;
    name: string;
    buyPrice: number;
    currentPrice: number;
    holdingQty: number;
  }) => Promise<void>;
  updateStock: (stockId: string, data: Partial<Stock>) => Promise<void>;
  removeStock: (stockId: string) => Promise<void>;
  fetchCash: (accountId: string) => Promise<void>;
  updateCash: (
    accountId: string,
    market: string,
    data: { amount?: number; targetWeight?: number; memo?: string }
  ) => Promise<void>;
  refreshPrice: (stockId: string, market: string, code: string) => Promise<number | null>;
  refreshAllPrices: (accountId: string) => Promise<{ success: number; failed: number }>;
}

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  stocks: [],
  cash: {},
  isLoading: false,
  refreshingPrices: false,

  fetchPortfolio: async (accountId: string) => {
    set({ isLoading: true });
    try {
      const res = await fetch(`/api/portfolio?accountId=${accountId}`);
      const stocks = await res.json();
      set({ stocks, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch portfolio:', error);
      set({ isLoading: false });
    }
  },

  addStock: async (data) => {
    try {
      await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      await get().fetchPortfolio(data.accountId);
    } catch (error) {
      console.error('Failed to add stock:', error);
    }
  },

  updateStock: async (stockId: string, data: Partial<Stock>) => {
    try {
      const res = await fetch(`/api/portfolio/${stockId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const updated = await res.json();

      set((state) => ({
        stocks: state.stocks.map((s) => (s.id === stockId ? { ...s, ...updated } : s)),
      }));
    } catch (error) {
      console.error('Failed to update stock:', error);
    }
  },

  removeStock: async (stockId: string) => {
    try {
      await fetch(`/api/portfolio/${stockId}`, { method: 'DELETE' });
      set((state) => ({
        stocks: state.stocks.filter((s) => s.id !== stockId),
      }));
    } catch (error) {
      console.error('Failed to remove stock:', error);
    }
  },

  fetchCash: async (accountId: string) => {
    try {
      const res = await fetch(`/api/cash?accountId=${accountId}`);
      const cash = await res.json();
      set({ cash });
    } catch (error) {
      console.error('Failed to fetch cash:', error);
    }
  },

  updateCash: async (accountId, market, data) => {
    try {
      await fetch('/api/cash', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, market, ...data }),
      });
      await get().fetchCash(accountId);
    } catch (error) {
      console.error('Failed to update cash:', error);
    }
  },

  refreshPrice: async (stockId: string, market: string, code: string) => {
    try {
      let endpoint = '';
      if (market === 'KR') endpoint = `/api/prices/kr/${code}`;
      else if (market === 'US') endpoint = `/api/prices/us/${code}`;
      else endpoint = `/api/prices/crypto/${code}`;

      const res = await fetch(endpoint);
      const data = await res.json();

      if (data.price) {
        await get().updateStock(stockId, { currentPrice: data.price });
        return data.price;
      }
      return null;
    } catch (error) {
      console.error('Failed to refresh price:', error);
      return null;
    }
  },

  refreshAllPrices: async (accountId: string) => {
    set({ refreshingPrices: true });
    let success = 0;
    let failed = 0;

    try {
      // 모든 계정의 모든 종목 가져오기
      const accountsRes = await fetch('/api/accounts');
      const accounts = await accountsRes.json();

      for (const account of accounts) {
        const portfolioRes = await fetch(`/api/portfolio?accountId=${account.accountId}`);
        const stocks = await portfolioRes.json();

        for (const stock of stocks) {
          const price = await get().refreshPrice(stock.id, stock.market, stock.code);
          if (price) {
            success++;
          } else {
            failed++;
          }
          // 요청 간 딜레이 (API 제한 방지)
          await new Promise((r) => setTimeout(r, 200));
        }
      }
    } catch (error) {
      console.error('Failed to refresh all prices:', error);
    }

    set({ refreshingPrices: false });

    // 현재 계정 포트폴리오 새로고침
    await get().fetchPortfolio(accountId);

    return { success, failed };
  },
}));
