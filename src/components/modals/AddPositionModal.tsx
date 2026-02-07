'use client';

import { useState } from 'react';

interface AddPositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    type: 'stock' | 'theme';
    ticker?: string;
    themeName?: string;
    targetWeight: number;
    theme: string;
  }) => void;
  market: 'US' | 'KR';
}

export function AddPositionModal({
  isOpen,
  onClose,
  onSubmit,
  market,
}: AddPositionModalProps) {
  const [type, setType] = useState<'stock' | 'theme'>('stock');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<
    Array<{ ticker: string; name: string; market: string }>
  >([]);
  const [selectedStock, setSelectedStock] = useState<{
    ticker: string;
    name: string;
  } | null>(null);
  const [themeName, setThemeName] = useState('');
  const [targetWeight, setTargetWeight] = useState<number>(10);
  const [theme, setTheme] = useState('');

  if (!isOpen) return null;

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      // TODO: API 연동
      // 지금은 Mock 데이터
      const mockResults = [
        { ticker: 'INTC', name: 'Intel Corporation', market: 'US' },
        { ticker: 'POET', name: 'POET Technologies', market: 'US' },
        { ticker: '005930', name: '삼성전자', market: 'KR' },
      ];
      setSearchResults(
        mockResults.filter(
          (r) =>
            r.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleSubmit = () => {
    if (type === 'stock' && !selectedStock) {
      alert('종목을 선택해주세요');
      return;
    }
    if (type === 'theme' && !themeName.trim()) {
      alert('테마명을 입력해주세요');
      return;
    }
    if (!theme.trim()) {
      alert('테마를 선택해주세요');
      return;
    }

    onSubmit({
      type,
      ticker: selectedStock?.ticker,
      themeName: type === 'theme' ? themeName : undefined,
      targetWeight,
      theme,
    });

    // Reset
    setType('stock');
    setSearchQuery('');
    setSearchResults([]);
    setSelectedStock(null);
    setThemeName('');
    setTargetWeight(10);
    setTheme('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 오버레이 */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 모달 */}
      <div className="relative bg-[#1a1a2e] border border-white/20 rounded-2xl shadow-2xl max-w-2xl w-full">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-[#4fc3f7]/20 to-[#29b6f6]/20 border-b border-white/10 p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">종목/테마 추가</h2>
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
        </div>

        {/* 본문 */}
        <div className="p-6 space-y-6">
          {/* 타입 선택 */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              유형
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setType('stock')}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                  type === 'stock'
                    ? 'bg-gradient-to-r from-[#4fc3f7] to-[#29b6f6] text-black'
                    : 'bg-white/10 text-[#888] hover:bg-white/20'
                }`}
              >
                개별 종목
              </button>
              <button
                onClick={() => setType('theme')}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                  type === 'theme'
                    ? 'bg-gradient-to-r from-[#4fc3f7] to-[#29b6f6] text-black'
                    : 'bg-white/10 text-[#888] hover:bg-white/20'
                }`}
              >
                테마 (여러 종목 묶음)
              </button>
            </div>
          </div>

          {/* 종목 검색 (개별 종목) */}
          {type === 'stock' && (
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                종목 검색
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="티커 또는 종목명 입력..."
                  className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-[#666] focus:outline-none focus:border-[#4fc3f7]"
                />
                <button
                  onClick={handleSearch}
                  className="px-6 py-3 bg-[#4fc3f7] text-black rounded-lg font-semibold hover:bg-[#29b6f6] transition-all"
                >
                  검색
                </button>
              </div>

              {/* 검색 결과 */}
              {searchResults.length > 0 && (
                <div className="mt-3 max-h-40 overflow-y-auto bg-white/5 border border-white/10 rounded-lg">
                  {searchResults.map((result, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedStock(result);
                        setSearchResults([]);
                        setSearchQuery('');
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-white/10 transition-all border-b border-white/5 last:border-0"
                    >
                      <div className="text-white font-semibold">
                        {result.ticker}
                      </div>
                      <div className="text-sm text-[#888]">{result.name}</div>
                    </button>
                  ))}
                </div>
              )}

              {/* 선택된 종목 */}
              {selectedStock && (
                <div className="mt-3 px-4 py-3 bg-[#4fc3f7]/20 border border-[#4fc3f7]/50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-white font-semibold">
                        {selectedStock.ticker}
                      </div>
                      <div className="text-sm text-[#888]">
                        {selectedStock.name}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedStock(null)}
                      className="text-[#888] hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 테마명 (테마) */}
          {type === 'theme' && (
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                테마명
              </label>
              <input
                type="text"
                value={themeName}
                onChange={(e) => setThemeName(e.target.value)}
                placeholder="예: 광학 테마 Photonics"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-[#666] focus:outline-none focus:border-[#4fc3f7]"
              />
            </div>
          )}

          {/* 테마 선택 */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              테마
            </label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#4fc3f7]"
            >
              <option value="">선택하세요</option>
              <option value="AI칩">AI칩</option>
              <option value="로봇">로봇</option>
              <option value="광학">광학</option>
              <option value="배터리">배터리</option>
              <option value="빅테크">빅테크</option>
              <option value="기타">기타</option>
            </select>
          </div>

          {/* 목표 비중 */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              목표 비중 ({targetWeight}%)
            </label>
            <input
              type="range"
              min="5"
              max="50"
              step="5"
              value={targetWeight}
              onChange={(e) => setTargetWeight(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-[#888] mt-1">
              <span>5%</span>
              <span>50%</span>
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="border-t border-white/10 p-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition-all"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-3 bg-gradient-to-r from-[#4fc3f7] to-[#29b6f6] text-black rounded-lg font-semibold hover:opacity-90 transition-all"
          >
            추가
          </button>
        </div>
      </div>
    </div>
  );
}
