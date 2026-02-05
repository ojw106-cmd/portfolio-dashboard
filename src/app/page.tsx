'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { TabNavigation } from '@/components/layout/TabNavigation';
import { SummaryView } from '@/components/views/SummaryView';
import { PortfolioView } from '@/components/views/PortfolioView';
import { JournalView } from '@/components/views/JournalView';
import { ResearchView } from '@/components/views/ResearchView';
import { AddAccountModal } from '@/components/modals/AddAccountModal';
import { MemoModal } from '@/components/modals/MemoModal';
import { ConfirmModal } from '@/components/modals/ConfirmModal';
import { SectorManageModal } from '@/components/modals/SectorManageModal';
import { useUIStore } from '@/stores/useUIStore';
import { useAccountStore } from '@/stores/useAccountStore';
import { useExchangeRateStore } from '@/stores/useExchangeRateStore';
import { useSectorStore } from '@/stores/useSectorStore';

export default function Home() {
  const { activeTab, statusMessage } = useUIStore();
  const { fetchAccounts, accounts } = useAccountStore();
  const { fetchExchangeRate } = useExchangeRateStore();
  const { fetchSectors } = useSectorStore();
  const [isSectorModalOpen, setIsSectorModalOpen] = useState(false);

  useEffect(() => {
    fetchAccounts();
    fetchExchangeRate();
    fetchSectors();
  }, [fetchAccounts, fetchExchangeRate, fetchSectors]);

  // 계정이 없으면 기본 계정 생성
  useEffect(() => {
    const initDefaultAccounts = async () => {
      if (accounts.length === 0) {
        const res = await fetch('/api/accounts');
        const data = await res.json();
        if (Array.isArray(data) && data.length === 0) {
          await fetch('/api/accounts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accountId: 'default', name: '기본 계정' }),
          });
          fetchAccounts();
        }
      }
    };
    initDefaultAccounts();
  }, [accounts.length, fetchAccounts]);

  return (
    <div className="min-h-screen p-5 md:p-10">
      <div className="max-w-[1950px] mx-auto">
        <Header onOpenSectorModal={() => setIsSectorModalOpen(true)} />
        <TabNavigation />

        {activeTab === 'summary' && <SummaryView />}
        {activeTab === 'portfolio' && <PortfolioView />}
        {activeTab === 'journal' && <JournalView />}
        {activeTab === 'research' && <ResearchView />}

        <AddAccountModal />
        <MemoModal />
        <ConfirmModal />
        <SectorManageModal
          isOpen={isSectorModalOpen}
          onClose={() => setIsSectorModalOpen(false)}
        />

        {statusMessage && (
          <div
            className={`fixed bottom-5 right-5 px-5 py-3 rounded-lg ${
              statusMessage.isError
                ? 'bg-red-500/20 text-red-400'
                : 'bg-green-500/20 text-green-400'
            }`}
          >
            {statusMessage.text}
          </div>
        )}
      </div>
    </div>
  );
}
