'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useUIStore } from '@/stores/useUIStore';
import { usePortfolioStore } from '@/stores/usePortfolioStore';
import { useAccountStore } from '@/stores/useAccountStore';

export function MemoModal() {
  const { modals, closeModal } = useUIStore();
  const { stocks, updateStock, cash, updateCash } = usePortfolioStore();
  const { currentAccountId } = useAccountStore();
  const [memo, setMemo] = useState('');
  const [title, setTitle] = useState('메모');

  const { stockId, cashMarket } = modals.memo;

  useEffect(() => {
    if (stockId) {
      const stock = stocks.find((s) => s.id === stockId);
      if (stock) {
        setMemo(stock.memo || '');
        setTitle(`메모 - ${stock.name}`);
      }
    } else if (cashMarket) {
      const cashData = cash[cashMarket];
      setMemo(cashData?.memo || '');
      setTitle(`메모 - ${cashMarket} 현금`);
    }
  }, [stockId, cashMarket, stocks, cash]);

  const handleSave = async () => {
    if (stockId) {
      await updateStock(stockId, { memo });
    } else if (cashMarket && currentAccountId) {
      await updateCash(currentAccountId, cashMarket, { memo });
    }
    closeModal('memo');
  };

  return (
    <Modal
      isOpen={modals.memo.isOpen}
      onClose={() => closeModal('memo')}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={() => closeModal('memo')}>
            취소
          </Button>
          <Button onClick={handleSave}>저장</Button>
        </>
      }
    >
      <textarea
        className="w-full h-40 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-[#666] focus:outline-none focus:border-[#4fc3f7] resize-none"
        placeholder="메모를 입력하세요..."
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
      />
    </Modal>
  );
}
