'use client';

import { create } from 'zustand';

interface ExchangeRateState {
  rate: number;
  lastUpdated: Date | null;
  isLoading: boolean;

  fetchExchangeRate: () => Promise<void>;
}

export const useExchangeRateStore = create<ExchangeRateState>((set) => ({
  rate: 1350,
  lastUpdated: null,
  isLoading: false,

  fetchExchangeRate: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch('/api/prices/exchange-rate');
      const data = await res.json();
      set({
        rate: data.rate,
        lastUpdated: new Date(),
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to fetch exchange rate:', error);
      set({ isLoading: false });
    }
  },
}));
