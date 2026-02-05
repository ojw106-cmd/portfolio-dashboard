'use client';

import { useState, useEffect } from 'react';

interface Stock {
  stockId: string;
  ticker: string;
  name: string;
}

interface ResearchNote {
  stockId: string;
  ticker: string;
  content: string;
  updatedAt: string;
}

export function ResearchView() {
  const [allStocks, setAllStocks] = useState<Stock[]>([]);
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [notes, setNotes] = useState<ResearchNote[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // 모든 종목 로드
  useEffect(() => {
    const loadStocks = async () => {
      try {
        const res = await fetch('/api/portfolio/all-stocks');
        if (res.ok) {
          const stocks = await res.json();
          setAllStocks(stocks);
        }
      } catch (error) {
        console.error('Failed to load stocks:', error);
      }
    };
    loadStocks();
  }, []);

  // 리서치 노트 로드
  useEffect(() => {
    const loadNotes = async () => {
      try {
        const res = await fetch('/api/research');
        if (res.ok) {
          const data = await res.json();
          setNotes(data);
        }
      } catch (error) {
        console.error('Failed to load research notes:', error);
      }
    };
    loadNotes();
  }, []);

  // 선택된 종목의 노트 로드
  useEffect(() => {
    if (selectedStock) {
      const note = notes.find((n) => n.stockId === selectedStock);
      setContent(note?.content || '');
    }
  }, [selectedStock, notes]);

  // 저장
  const handleSave = async () => {
    if (!selectedStock) return;

    const stock = allStocks.find((s) => s.stockId === selectedStock);
    if (!stock) return;

    setIsSaving(true);
    try {
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stockId: selectedStock,
          ticker: stock.ticker,
          content,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setNotes((prev) => {
          const index = prev.findIndex((n) => n.stockId === selectedStock);
          if (index >= 0) {
            const newNotes = [...prev];
            newNotes[index] = updated;
            return newNotes;
          }
          return [...prev, updated];
        });
      }
    } catch (error) {
      console.error('Failed to save research note:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
      {/* 종목 목록 */}
      <div className="md:col-span-1">
        <div className="bg-white/5 rounded-xl p-5">
          <h2 className="text-xl font-bold mb-4 text-[#4fc3f7]">종목 목록</h2>
          <div className="space-y-2">
            {allStocks.length === 0 ? (
              <p className="text-[#666]">보유 종목이 없습니다</p>
            ) : (
              allStocks.map((stock) => {
                const hasNote = notes.some((n) => n.stockId === stock.stockId);
                return (
                  <button
                    key={stock.stockId}
                    onClick={() => setSelectedStock(stock.stockId)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                      selectedStock === stock.stockId
                        ? 'bg-gradient-to-r from-[#4fc3f7] to-[#29b6f6] text-[#1a1a2e]'
                        : 'bg-white/5 text-[#ccc] hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{stock.ticker}</div>
                        <div className="text-sm opacity-70">{stock.name}</div>
                      </div>
                      {hasNote && (
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                          📝
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 리서치 에디터 */}
      <div className="md:col-span-2">
        <div className="bg-white/5 rounded-xl p-5">
          {selectedStock ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-[#4fc3f7]">
                  {allStocks.find((s) => s.stockId === selectedStock)?.ticker}{' '}
                  리서치
                </h2>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                    isSaving
                      ? 'bg-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-[#4fc3f7] to-[#29b6f6] text-[#1a1a2e] hover:opacity-90'
                  }`}
                >
                  {isSaving ? '저장 중...' : '저장'}
                </button>
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="종목 리서치 내용을 입력하세요&#10;&#10;- 투자 이유&#10;- 재무 분석&#10;- 리스크 요인&#10;- 목표가&#10;- 기타 메모"
                className="w-full h-[600px] bg-[#1a1a2e] text-[#ccc] p-4 rounded-lg border border-white/10 focus:border-[#4fc3f7] focus:outline-none resize-none font-mono text-sm"
              />
              {notes.find((n) => n.stockId === selectedStock)?.updatedAt && (
                <p className="text-xs text-[#666] mt-2">
                  마지막 수정:{' '}
                  {new Date(
                    notes.find((n) => n.stockId === selectedStock)!.updatedAt
                  ).toLocaleString('ko-KR')}
                </p>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-[600px] text-[#666]">
              <p>왼쪽에서 종목을 선택하세요</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
