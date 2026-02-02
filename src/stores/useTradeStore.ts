'use client';

import { create } from 'zustand';
import type { Trade } from '@/types';

interface RealizedPnL {
  KR: number;
  US: number;
}

interface TradeState {
  trades: Trade[];
  realizedPnL: RealizedPnL;
  isLoading: boolean;

  fetchTrades: (accountId: string) => Promise<void>;
  fetchRealizedPnL: (accountId: string) => Promise<void>;
  executeBuy: (data: {
    accountId: string;
    market: string;
    code: string;
    name: string;
    price: number;
    qty: number;
    date?: string;
  }) => Promise<void>;
  executeSell: (data: {
    accountId: string;
    market: string;
    code: string;
    name: string;
    price: number;
    qty: number;
    buyPrice: number;
    date?: string;
  }) => Promise<void>;
  executeDeposit: (data: {
    accountId: string;
    market: string;
    amount: number;
    date?: string;
  }) => Promise<void>;
  executeWithdraw: (data: {
    accountId: string;
    market: string;
    amount: number;
    date?: string;
  }) => Promise<void>;
  executeExchange: (data: {
    accountId: string;
    direction: 'KR_TO_US' | 'US_TO_KR';
    fromAmount: number;
    toAmount: number;
    rate: number;
    date?: string;
  }) => Promise<void>;
  deleteTrade: (tradeId: string, accountId: string) => Promise<void>;
}

export const useTradeStore = create<TradeState>((set, get) => ({
  trades: [],
  realizedPnL: { KR: 0, US: 0 },
  isLoading: false,

  fetchTrades: async (accountId: string) => {
    set({ isLoading: true });
    try {
      const res = await fetch(`/api/trades?accountId=${accountId}`);
      const trades = await res.json();
      set({ trades, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch trades:', error);
      set({ isLoading: false });
    }
  },

  fetchRealizedPnL: async (accountId: string) => {
    try {
      const res = await fetch(`/api/accounts/${accountId}`);
      const data = await res.json();
      const pnl: RealizedPnL = { KR: 0, US: 0 };
      data.realizedPnL?.forEach((r: { market: string; amount: number }) => {
        if (r.market === 'KR' || r.market === 'US') {
          pnl[r.market] = r.amount;
        }
      });
      set({ realizedPnL: pnl });
    } catch (error) {
      console.error('Failed to fetch realized PnL:', error);
    }
  },

  executeBuy: async (data) => {
    try {
      await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          type: 'buy',
          amount: data.price * data.qty,
        }),
      });
      await get().fetchTrades(data.accountId);
    } catch (error) {
      console.error('Failed to execute buy:', error);
    }
  },

  executeSell: async (data) => {
    const pnl = (data.price - data.buyPrice) * data.qty;
    try {
      await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          type: 'sell',
          amount: data.price * data.qty,
          pnl,
        }),
      });
      await get().fetchTrades(data.accountId);
      await get().fetchRealizedPnL(data.accountId);
    } catch (error) {
      console.error('Failed to execute sell:', error);
    }
  },

  executeDeposit: async (data) => {
    try {
      await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          type: 'deposit',
        }),
      });
      await get().fetchTrades(data.accountId);
    } catch (error) {
      console.error('Failed to execute deposit:', error);
    }
  },

  executeWithdraw: async (data) => {
    try {
      await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          type: 'withdraw',
        }),
      });
      await get().fetchTrades(data.accountId);
    } catch (error) {
      console.error('Failed to execute withdraw:', error);
    }
  },

  executeExchange: async (data) => {
    try {
      await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          type: 'exchange',
        }),
      });
      await get().fetchTrades(data.accountId);
    } catch (error) {
      console.error('Failed to execute exchange:', error);
    }
  },

  deleteTrade: async (tradeId: string, accountId: string) => {
    try {
      await fetch(`/api/trades/${tradeId}`, { method: 'DELETE' });
      await get().fetchTrades(accountId);
      await get().fetchRealizedPnL(accountId);
    } catch (error) {
      console.error('Failed to delete trade:', error);
    }
  },
}));
