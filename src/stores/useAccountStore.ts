'use client';

import { create } from 'zustand';
import type { Account, AccountDetail } from '@/types';

interface AccountState {
  accounts: Account[];
  currentAccountId: string | null;
  currentAccountDetail: AccountDetail | null;
  isLoading: boolean;

  fetchAccounts: () => Promise<void>;
  fetchAccountDetail: (accountId: string) => Promise<void>;
  setCurrentAccount: (accountId: string) => void;
  addAccount: (accountId: string, name: string) => Promise<void>;
  deleteAccount: (accountId: string) => Promise<void>;
}

export const useAccountStore = create<AccountState>((set, get) => ({
  accounts: [],
  currentAccountId: null,
  currentAccountDetail: null,
  isLoading: false,

  fetchAccounts: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch('/api/accounts');
      const accounts = await res.json();
      set({ accounts, isLoading: false });

      // 현재 계정이 없으면 첫 번째 계정 선택
      if (!get().currentAccountId && accounts.length > 0) {
        set({ currentAccountId: accounts[0].accountId });
        get().fetchAccountDetail(accounts[0].accountId);
      }
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
      set({ isLoading: false });
    }
  },

  fetchAccountDetail: async (accountId: string) => {
    set({ isLoading: true });
    try {
      const res = await fetch(`/api/accounts/${accountId}`);
      const detail = await res.json();
      set({ currentAccountDetail: detail, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch account detail:', error);
      set({ isLoading: false });
    }
  },

  setCurrentAccount: (accountId: string) => {
    set({ currentAccountId: accountId });
    get().fetchAccountDetail(accountId);
  },

  addAccount: async (accountId: string, name: string) => {
    try {
      await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, name }),
      });
      await get().fetchAccounts();
    } catch (error) {
      console.error('Failed to add account:', error);
    }
  },

  deleteAccount: async (accountId: string) => {
    try {
      await fetch(`/api/accounts/${accountId}`, { method: 'DELETE' });
      await get().fetchAccounts();

      // 삭제한 계정이 현재 계정이면 다른 계정 선택
      if (get().currentAccountId === accountId) {
        const accounts = get().accounts.filter((a) => a.accountId !== accountId);
        if (accounts.length > 0) {
          get().setCurrentAccount(accounts[0].accountId);
        } else {
          set({ currentAccountId: null, currentAccountDetail: null });
        }
      }
    } catch (error) {
      console.error('Failed to delete account:', error);
    }
  },
}));
