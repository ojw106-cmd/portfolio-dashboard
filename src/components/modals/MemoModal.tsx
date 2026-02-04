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
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={() => closeModal('memo')}>
            취소
          </Button>
          <Button onClick={handleSave}>저장</Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="text-sm text-[#888]">
          투자 테시스, 확신도, 목표가, 시간 지평선, 버킷(코어/하이그로스/단타) 등을 기록하세요.
        </div>
        <textarea
          className="w-full h-80 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-[#666] focus:outline-none focus:border-[#4fc3f7] resize-y font-mono text-sm leading-relaxed"
          placeholder={`예시:
[투자 테시스] 
[소스] 
[확신도] /10
[목표가] 
[기대 수익률] x배
[시간] 단기/중기/장기
[카탈리스트] 
[리스크] 
[손절 라인] 
[버킷] 코어/하이그로스/단타`}
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
        />
      </div>
    </Modal>
  );
}
