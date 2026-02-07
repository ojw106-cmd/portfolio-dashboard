'use client';

import { create } from 'zustand';

type Tab = 'summary' | 'portfolio' | 'journal' | 'research' | 'poc' | 'stats' | 'principles';

interface ModalState {
  isOpen: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
}

interface UIState {
  activeTab: Tab;
  modals: {
    memo: ModalState & { stockId?: string; cashMarket?: string };
    addAccount: ModalState;
    addStock: ModalState;
    exchange: ModalState;
    journal: ModalState & { date?: string };
    confirm: ModalState & { message?: string; onConfirm?: () => void };
  };
  statusMessage: { text: string; isError: boolean } | null;

  setActiveTab: (tab: Tab) => void;
  openMemoModal: (stockId?: string, cashMarket?: string) => void;
  openAddAccountModal: () => void;
  openAddStockModal: () => void;
  openExchangeModal: () => void;
  openJournalModal: (date: string) => void;
  openConfirmModal: (message: string, onConfirm: () => void) => void;
  closeModal: (modal: keyof UIState['modals']) => void;
  showStatus: (text: string, isError?: boolean) => void;
  clearStatus: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: 'poc',
  modals: {
    memo: { isOpen: false },
    addAccount: { isOpen: false },
    addStock: { isOpen: false },
    exchange: { isOpen: false },
    journal: { isOpen: false },
    confirm: { isOpen: false },
  },
  statusMessage: null,

  setActiveTab: (tab) => set({ activeTab: tab }),

  openMemoModal: (stockId, cashMarket) =>
    set((state) => ({
      modals: {
        ...state.modals,
        memo: { isOpen: true, stockId, cashMarket },
      },
    })),

  openAddAccountModal: () =>
    set((state) => ({
      modals: {
        ...state.modals,
        addAccount: { isOpen: true },
      },
    })),

  openAddStockModal: () =>
    set((state) => ({
      modals: {
        ...state.modals,
        addStock: { isOpen: true },
      },
    })),

  openExchangeModal: () =>
    set((state) => ({
      modals: {
        ...state.modals,
        exchange: { isOpen: true },
      },
    })),

  openJournalModal: (date) =>
    set((state) => ({
      modals: {
        ...state.modals,
        journal: { isOpen: true, date },
      },
    })),

  openConfirmModal: (message, onConfirm) =>
    set((state) => ({
      modals: {
        ...state.modals,
        confirm: { isOpen: true, message, onConfirm },
      },
    })),

  closeModal: (modal) =>
    set((state) => ({
      modals: {
        ...state.modals,
        [modal]: { isOpen: false },
      },
    })),

  showStatus: (text, isError = false) => {
    set({ statusMessage: { text, isError } });
    setTimeout(() => {
      set({ statusMessage: null });
    }, 4000);
  },

  clearStatus: () => set({ statusMessage: null }),
}));
