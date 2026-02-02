'use client';

import { useExchangeRateStore } from '@/stores/useExchangeRateStore';
import { formatNumber } from '@/lib/formatters';

interface HeaderProps {
  onOpenSectorModal?: () => void;
}

export function Header({ onOpenSectorModal }: HeaderProps) {
  const { rate, isLoading, fetchExchangeRate } = useExchangeRateStore();

  return (
    <div className="text-center mb-6">
      <h1 className="text-3xl font-bold text-[#4fc3f7] mb-2">
        주식 포트폴리오 관리 대시보드
      </h1>
      <div className="flex items-center justify-center gap-2 text-sm text-[#aaa]">
        <span>USD/KRW:</span>
        <span className="text-[#4fc3f7] font-semibold">
          {formatNumber(rate)}원
        </span>
        <button
          onClick={fetchExchangeRate}
          disabled={isLoading}
          className="ml-2 px-2 py-1 text-xs bg-white/10 rounded hover:bg-white/20 transition-colors disabled:opacity-50"
        >
          {isLoading ? '조회중...' : '환율 새로고침'}
        </button>
        <span className="text-[#444] mx-2">|</span>
        <button
          onClick={onOpenSectorModal}
          className="px-2 py-1 text-xs bg-white/10 rounded hover:bg-white/20 transition-colors"
        >
          섹터 관리
        </button>
      </div>
    </div>
  );
}
