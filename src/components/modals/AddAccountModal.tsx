'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useUIStore } from '@/stores/useUIStore';
import { useAccountStore } from '@/stores/useAccountStore';

export function AddAccountModal() {
  const { modals, closeModal } = useUIStore();
  const { addAccount } = useAccountStore();
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      alert('계정 이름을 입력해주세요.');
      return;
    }

    // 자동 ID 생성: account_타임스탬프
    const accountId = `account_${Date.now()}`;

    setIsLoading(true);
    await addAccount(accountId, name.trim());
    setIsLoading(false);
    setName('');
    closeModal('addAccount');
  };

  return (
    <Modal
      isOpen={modals.addAccount.isOpen}
      onClose={() => closeModal('addAccount')}
      title="계정 추가"
      footer={
        <>
          <Button variant="secondary" onClick={() => closeModal('addAccount')}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? '추가 중...' : '추가'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label="계정 이름"
          placeholder="예: 내 계좌"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
    </Modal>
  );
}
