'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useUIStore } from '@/stores/useUIStore';
import { usePortfolioStore } from '@/stores/usePortfolioStore';
import { useAccountStore } from '@/stores/useAccountStore';

const MEMO_TEMPLATE = `1. [투자 테시스] 
2. [소스] 
3. [확신도] /10
4. [목표가] 
5. [기대 수익률] x배
6. [시간] 단기/중기/장기
7. [카탈리스트] 
8. [리스크] 
9. [손절 라인] 
10. [버킷] 코어/하이그로스/단타
11. [기타] `;

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
        const existingMemo = stock.memo || '';
        setMemo(existingMemo || MEMO_TEMPLATE);
        setTitle(`메모 - ${stock.name}`);
      }
    } else if (cashMarket) {
      const cashData = cash[cashMarket];
      const existingMemo = cashData?.memo || '';
      setMemo(existingMemo || MEMO_TEMPLATE);
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
          각 항목 옆에 내용을 작성하세요. 불필요한 항목은 삭제해도 됩니다.
        </div>
        <textarea
          className="w-full h-96 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-[#666] focus:outline-none focus:border-[#4fc3f7] resize-y font-mono text-sm leading-relaxed"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
        />
      </div>
    </Modal>
  );
}
