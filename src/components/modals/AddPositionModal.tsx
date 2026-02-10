'use client';

import { useState, useEffect, useRef } from 'react';
import { useSectorStore } from '@/stores/useSectorStore';

interface SearchResult {
  code: string;
  name: string;
  market: string;
}

interface AddPositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    type: 'stock' | 'theme';
    ticker?: string;
    name?: string;
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
  const { sectors, fetchSectors } = useSectorStore();

  const [type, setType] = useState<'stock' | 'theme'>('stock');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedStock, setSelectedStock] = useState<{
    ticker: string;
    name: string;
  } | null>(null);
  const [themeName, setThemeName] = useState('');
  const [targetWeight, setTargetWeight] = useState<number>(10);
  const [theme, setTheme] = useState('');

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 섹터 로드
  useEffect(() => {
    if (isOpen && sectors.length === 0) {
      fetchSectors();
    }
  }, [isOpen, sectors.length, fetchSectors]);

  // 검색어 변경 시 자동 검색 (debounce)
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length < 1) {
      setSearchResults([]);
      return;
    }

    const doSearch = async () => {
      setIsSearching(true);
      try {
        const endpoint =
          market === 'US'
            ? `/api/search/us?q=${encodeURIComponent(searchQuery)}`
            : `/api/search/kr?q=${encodeURIComponent(searchQuery)}`;

        const res = await fetch(endpoint);
        const data = await res.json();

        if (Array.isArray(data)) {
          setSearchResults(data);
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
      }
      setIsSearching(false);
    };

    searchTimeoutRef.current = setTimeout(doSearch, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, market]);

  // 드롭다운 외부 클릭 감지
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setSearchResults([]);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const endpoint =
        market === 'US'
          ? `/api/search/us?q=${encodeURIComponent(searchQuery)}`
          : `/api/search/kr?q=${encodeURIComponent(searchQuery)}`;

      const res = await fetch(endpoint);
      const data = await res.json();

      if (Array.isArray(data)) {
        setSearchResults(data);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    }
    setIsSearching(false);
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
      alert('섹터를 선택해주세요');
      return;
    }

    onSubmit({
      type,
      ticker: selectedStock?.ticker,
      name: selectedStock?.name,
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

  const handleClose = () => {
    setType('stock');
    setSearchQuery('');
    setSearchResults([]);
    setSelectedStock(null);
    setThemeName('');
    setTargetWeight(10);
    setTheme('');
    onClose();
  };

  const marketLabel = market === 'US' ? '해외주식' : '국내주식';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 오버레이 */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* 모달 */}
      <div className="relative bg-[#1a1a2e] border border-white/20 rounded-2xl shadow-2xl max-w-2xl w-full">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-[#4fc3f7]/20 to-[#29b6f6]/20 border-b border-white/10 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white">종목/테마 추가</h2>
              <p className="text-sm text-[#888] mt-1">{marketLabel}</p>
            </div>
            <button
              onClick={handleClose}
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
              <div className="relative">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={
                        market === 'US'
                          ? '티커 또는 종목명 (예: AAPL, Tesla)'
                          : '종목코드 또는 종목명 (예: 삼성전자)'
                      }
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-[#666] focus:outline-none focus:border-[#4fc3f7]"
                    />
                    {isSearching && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <svg
                          className="animate-spin h-5 w-5 text-[#4fc3f7]"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="px-6 py-3 bg-[#4fc3f7] text-black rounded-lg font-semibold hover:bg-[#29b6f6] transition-all disabled:opacity-50"
                  >
                    검색
                  </button>
                </div>

                {/* 검색 결과 드롭다운 */}
                {searchResults.length > 0 && (
                  <div
                    ref={dropdownRef}
                    className="absolute z-10 top-full left-0 right-0 mt-2 max-h-60 overflow-y-auto bg-[#1a1a2e] border border-white/20 rounded-lg shadow-xl"
                  >
                    {searchResults.map((result, idx) => (
                      <button
                        key={`${result.code}-${idx}`}
                        onClick={() => {
                          setSelectedStock({ ticker: result.code, name: result.name });
                          setSearchResults([]);
                          setSearchQuery('');
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-white/10 transition-all border-b border-white/5 last:border-0 flex justify-between items-center"
                      >
                        <div>
                          <div className="text-white font-semibold">
                            {result.code}
                          </div>
                          <div className="text-sm text-[#888]">{result.name}</div>
                        </div>
                        <span className="text-xs text-[#666] px-2 py-0.5 bg-white/10 rounded">
                          {result.market}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

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
                      className="text-[#888] hover:text-white p-1"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
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

          {/* 섹터 선택 */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              섹터 (테마 그룹)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {sectors.map((sector) => (
                <button
                  key={sector.id}
                  onClick={() => setTheme(sector.code)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    theme === sector.code
                      ? 'ring-2 ring-[#4fc3f7] bg-white/20'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: sector.color }}
                  />
                  <span className="text-white truncate">{sector.name}</span>
                </button>
              ))}
            </div>
            {sectors.length === 0 && (
              <p className="text-sm text-[#666] mt-2">
                섹터가 없습니다. 섹터 관리에서 추가해주세요.
              </p>
            )}
          </div>

          {/* 목표 비중 */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              목표 비중
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max="50"
                step="1"
                value={targetWeight}
                onChange={(e) => setTargetWeight(Number(e.target.value))}
                className="flex-1 h-2 bg-white/10 rounded-full appearance-none cursor-pointer
                           [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 
                           [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full 
                           [&::-webkit-slider-thumb]:bg-[#4fc3f7] [&::-webkit-slider-thumb]:cursor-pointer
                           [&::-webkit-slider-thumb]:shadow-lg"
              />
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={targetWeight}
                  onChange={(e) => setTargetWeight(Math.max(1, Math.min(100, Number(e.target.value))))}
                  className="w-16 px-2 py-1 text-center bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#4fc3f7]"
                />
                <span className="text-[#888]">%</span>
              </div>
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="border-t border-white/10 p-6 flex justify-end gap-3">
          <button
            onClick={handleClose}
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
