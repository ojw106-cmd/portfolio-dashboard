'use client';

import { useState } from 'react';

interface Stock {
  ticker: string;
  name: string;
  shares: number;
  avgPrice: number;
  currentPrice: number;
  value: number;
  profitAmount: number;
  profitRate: number;
}

interface ThemeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  themeName: string;
  totalValue: number;
  currentWeight: number;
  targetWeight: number;
  stocks: Stock[];
  market: 'US' | 'KR';
}

export function ThemeDetailModal({
  isOpen,
  onClose,
  themeName,
  totalValue,
  currentWeight,
  targetWeight,
  stocks,
  market,
}: ThemeDetailModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 오버레이 */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 모달 */}
      <div className="relative bg-[#1a1a2e] border border-white/20 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-[#4fc3f7]/20 to-[#29b6f6]/20 border-b border-white/10 p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold text-white">{themeName}</h2>
            <button
              onClick={onClose}
              className="text-[#888] hover:text-white transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* 요약 정보 */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-[#888] mb-1">현재 평가액</div>
              <div className="text-lg font-bold text-white">
                {totalValue.toLocaleString()} 원
              </div>
            </div>
            <div>
              <div className="text-xs text-[#888] mb-1">현재 비중</div>
              <div className="text-lg font-bold text-[#4fc3f7]">
                {currentWeight.toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-xs text-[#888] mb-1">설정 비중</div>
              <div className="text-lg font-bold text-[#888]">
                {targetWeight.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* 종목 리스트 */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-200px)]">
          <h3 className="text-lg font-bold text-white mb-4">
            포함 종목 ({stocks.length})
          </h3>

          <div className="space-y-3">
            {stocks.map((stock, idx) => (
              <div
                key={idx}
                className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="text-lg font-bold text-white">
                      {stock.ticker}
                    </div>
                    <div className="text-sm text-[#888]">{stock.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-[#4fc3f7]">
                      {stock.value.toLocaleString()} 원
                    </div>
                    <div
                      className={`text-sm font-semibold ${
                        stock.profitRate >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {stock.profitRate >= 0 ? '+' : ''}
                      {stock.profitRate.toFixed(2)}%
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[#888]">보유: </span>
                    <span className="text-white">{stock.shares.toLocaleString()}주</span>
                  </div>
                  <div>
                    <span className="text-[#888]">평균: </span>
                    <span className="text-white">
                      {market === 'US' ? '$' : '₩'}
                      {stock.avgPrice.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#888]">현재가: </span>
                    <span className="text-white">
                      {market === 'US' ? '$' : '₩'}
                      {stock.currentPrice.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#888]">손익: </span>
                    <span
                      className={`font-semibold ${
                        stock.profitAmount >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {stock.profitAmount >= 0 ? '+' : ''}
                      {stock.profitAmount.toLocaleString()} 원
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
