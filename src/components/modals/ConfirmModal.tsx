'use client';

import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useUIStore } from '@/stores/useUIStore';

export function ConfirmModal() {
  const { modals, closeModal } = useUIStore();
  const { message, onConfirm } = modals.confirm;

  const handleConfirm = () => {
    onConfirm?.();
    closeModal('confirm');
  };

  return (
    <Modal
      isOpen={modals.confirm.isOpen}
      onClose={() => closeModal('confirm')}
      title="확인"
      footer={
        <>
          <Button variant="secondary" onClick={() => closeModal('confirm')}>
            취소
          </Button>
          <Button variant="danger" onClick={handleConfirm}>
            확인
          </Button>
        </>
      }
    >
      <p className="text-[#eee]">{message}</p>
    </Modal>
  );
}
