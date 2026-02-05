'use client';

import { useState, useEffect } from 'react';

interface ResearchFolder {
  id: string;
  name: string;
  sortOrder: number;
  stocks: ResearchStock[];
}

interface ResearchStock {
  id: string;
  folderId: string | null;
  ticker: string;
  name: string;
  market: string;
  content: string;
  sortOrder: number;
}

export function ResearchView() {
  const [folders, setFolders] = useState<ResearchFolder[]>([]);
  const [uncategorized, setUncategorized] = useState<ResearchStock[]>([]);
  const [selectedStock, setSelectedStock] = useState<ResearchStock | null>(null);
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // 관리 모달 상태
  const [isAddFolderOpen, setIsAddFolderOpen] = useState(false);
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newStock, setNewStock] = useState({ ticker: '', name: '', market: 'US', folderId: '' });

  // 폴더 & 종목 로드
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await fetch('/api/research/folders');
      if (res.ok) {
        const data = await res.json();
        setFolders(data);
        
        // 미분류 종목
        const allStocks = await fetch('/api/research/stocks');
        if (allStocks.ok) {
          const stocks = await allStocks.json();
          setUncategorized(stocks.filter((s: ResearchStock) => !s.folderId));
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  // 선택된 종목의 content 로드
  useEffect(() => {
    if (selectedStock) {
      setContent(selectedStock.content);
    }
  }, [selectedStock]);

  // 저장
  const handleSave = async () => {
    if (!selectedStock) return;
    setIsSaving(true);
    try {
      await fetch(`/api/research/stocks?id=${selectedStock.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      await loadData();
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // 폴더 추가
  const handleAddFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await fetch('/api/research/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFolderName }),
      });
      setNewFolderName('');
      setIsAddFolderOpen(false);
      loadData();
    } catch (error) {
      console.error('Failed to add folder:', error);
    }
  };

  // 폴더 삭제
  const handleDeleteFolder = async (id: string) => {
    if (!confirm('폴더를 삭제하시겠습니까? (종목은 미분류로 이동)')) return;
    try {
      await fetch(`/api/research/folders?id=${id}`, { method: 'DELETE' });
      loadData();
    } catch (error) {
      console.error('Failed to delete folder:', error);
    }
  };

  // 폴더 이름 변경
  const handleRenameFolder = async (id: string, name: string) => {
    const newName = prompt('새 폴더명:', name);
    if (!newName || newName === name) return;
    try {
      await fetch(`/api/research/folders?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      });
      loadData();
    } catch (error) {
      console.error('Failed to rename folder:', error);
    }
  };

  // 종목 추가
  const handleAddStock = async () => {
    if (!newStock.ticker.trim() || !newStock.name.trim()) return;
    try {
      await fetch('/api/research/stocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker: newStock.ticker,
          name: newStock.name,
          market: newStock.market,
          folderId: newStock.folderId || null,
        }),
      });
      setNewStock({ ticker: '', name: '', market: 'US', folderId: '' });
      setIsAddStockOpen(false);
      loadData();
    } catch (error) {
      console.error('Failed to add stock:', error);
    }
  };

  // 종목 삭제
  const handleDeleteStock = async (id: string) => {
    if (!confirm('종목을 삭제하시겠습니까?')) return;
    try {
      await fetch(`/api/research/stocks?id=${id}`, { method: 'DELETE' });
      if (selectedStock?.id === id) {
        setSelectedStock(null);
      }
      loadData();
    } catch (error) {
      console.error('Failed to delete stock:', error);
    }
  };

  // 종목 폴더 이동
  const handleMoveStock = async (stockId: string, newFolderId: string | null) => {
    try {
      await fetch(`/api/research/stocks?id=${stockId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId: newFolderId }),
      });
      loadData();
    } catch (error) {
      console.error('Failed to move stock:', error);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
      {/* 왼쪽: 폴더 + 종목 목록 */}
      <div className="md:col-span-1">
        <div className="bg-white/5 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[#4fc3f7]">종목 리서치</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setIsAddFolderOpen(true)}
                className="px-3 py-1 bg-white/10 rounded text-xs hover:bg-white/20"
                title="폴더 추가"
              >
                📁+
              </button>
              <button
                onClick={() => setIsAddStockOpen(true)}
                className="px-3 py-1 bg-white/10 rounded text-xs hover:bg-white/20"
                title="종목 추가"
              >
                📄+
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {/* 폴더별 종목 */}
            {folders.map((folder) => (
              <div key={folder.id} className="space-y-1">
                <div className="flex items-center justify-between px-2 py-1 bg-white/5 rounded group">
                  <span className="text-sm font-semibold text-[#4fc3f7]">
                    📁 {folder.name} ({folder.stocks.length})
                  </span>
                  <div className="hidden group-hover:flex gap-1">
                    <button
                      onClick={() => handleRenameFolder(folder.id, folder.name)}
                      className="text-xs text-gray-400 hover:text-white"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteFolder(folder.id)}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                {folder.stocks.map((stock) => (
                  <div
                    key={stock.id}
                    className="flex items-center justify-between group"
                  >
                    <button
                      onClick={() => setSelectedStock(stock)}
                      className={`flex-1 text-left px-3 py-2 rounded transition-all ${
                        selectedStock?.id === stock.id
                          ? 'bg-gradient-to-r from-[#4fc3f7] to-[#29b6f6] text-[#1a1a2e]'
                          : 'bg-white/5 text-[#ccc] hover:bg-white/10'
                      }`}
                    >
                      <div className="text-xs opacity-70">{stock.market}</div>
                      <div className="font-semibold">{stock.ticker}</div>
                      <div className="text-xs opacity-70">{stock.name}</div>
                    </button>
                    <div className="hidden group-hover:flex gap-1 ml-2">
                      <select
                        value={stock.folderId || ''}
                        onChange={(e) => handleMoveStock(stock.id, e.target.value || null)}
                        className="text-xs bg-[#1a1a2e] border border-white/20 rounded px-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="">미분류</option>
                        {folders.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleDeleteStock(stock.id)}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))}

            {/* 미분류 종목 */}
            {uncategorized.length > 0 && (
              <div className="space-y-1">
                <div className="px-2 py-1 bg-white/5 rounded">
                  <span className="text-sm font-semibold text-gray-400">
                    📂 미분류 ({uncategorized.length})
                  </span>
                </div>
                {uncategorized.map((stock) => (
                  <div
                    key={stock.id}
                    className="flex items-center justify-between group"
                  >
                    <button
                      onClick={() => setSelectedStock(stock)}
                      className={`flex-1 text-left px-3 py-2 rounded transition-all ${
                        selectedStock?.id === stock.id
                          ? 'bg-gradient-to-r from-[#4fc3f7] to-[#29b6f6] text-[#1a1a2e]'
                          : 'bg-white/5 text-[#ccc] hover:bg-white/10'
                      }`}
                    >
                      <div className="text-xs opacity-70">{stock.market}</div>
                      <div className="font-semibold">{stock.ticker}</div>
                      <div className="text-xs opacity-70">{stock.name}</div>
                    </button>
                    <div className="hidden group-hover:flex gap-1 ml-2">
                      <select
                        value={stock.folderId || ''}
                        onChange={(e) => handleMoveStock(stock.id, e.target.value || null)}
                        className="text-xs bg-[#1a1a2e] border border-white/20 rounded px-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="">미분류</option>
                        {folders.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleDeleteStock(stock.id)}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 오른쪽: 리서치 에디터 */}
      <div className="md:col-span-2">
        <div className="bg-white/5 rounded-xl p-5">
          {selectedStock ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-[#4fc3f7]">
                    {selectedStock.ticker} - {selectedStock.name}
                  </h2>
                  <p className="text-xs text-gray-400">{selectedStock.market}</p>
                </div>
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
                className="w-full h-[650px] bg-[#1a1a2e] text-[#ccc] p-4 rounded-lg border border-white/10 focus:border-[#4fc3f7] focus:outline-none resize-none font-mono text-sm"
              />
            </>
          ) : (
            <div className="flex items-center justify-center h-[700px] text-[#666]">
              <p>왼쪽에서 종목을 선택하세요</p>
            </div>
          )}
        </div>
      </div>

      {/* 폴더 추가 모달 */}
      {isAddFolderOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1a1a2e] p-6 rounded-xl border border-white/10 w-96">
            <h3 className="text-lg font-bold mb-4 text-[#4fc3f7]">폴더 추가</h3>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="폴더명 (예: AI/반도체, 성장주)"
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 mb-4"
              onKeyDown={(e) => e.key === 'Enter' && handleAddFolder()}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setIsAddFolderOpen(false)}
                className="px-4 py-2 bg-white/5 rounded hover:bg-white/10"
              >
                취소
              </button>
              <button
                onClick={handleAddFolder}
                className="px-4 py-2 bg-gradient-to-r from-[#4fc3f7] to-[#29b6f6] text-[#1a1a2e] rounded font-semibold"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 종목 추가 모달 */}
      {isAddStockOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1a1a2e] p-6 rounded-xl border border-white/10 w-96">
            <h3 className="text-lg font-bold mb-4 text-[#4fc3f7]">종목 추가</h3>
            <div className="space-y-3">
              <input
                type="text"
                value={newStock.ticker}
                onChange={(e) => setNewStock({ ...newStock, ticker: e.target.value })}
                placeholder="티커 (예: AAPL, 삼성전자)"
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2"
              />
              <input
                type="text"
                value={newStock.name}
                onChange={(e) => setNewStock({ ...newStock, name: e.target.value })}
                placeholder="종목명"
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2"
              />
              <select
                value={newStock.market}
                onChange={(e) => setNewStock({ ...newStock, market: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2"
              >
                <option value="US">US (미국)</option>
                <option value="KR">KR (한국)</option>
                <option value="CRYPTO">CRYPTO (크립토)</option>
              </select>
              <select
                value={newStock.folderId}
                onChange={(e) => setNewStock({ ...newStock, folderId: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2"
              >
                <option value="">미분류</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button
                onClick={() => setIsAddStockOpen(false)}
                className="px-4 py-2 bg-white/5 rounded hover:bg-white/10"
              >
                취소
              </button>
              <button
                onClick={handleAddStock}
                className="px-4 py-2 bg-gradient-to-r from-[#4fc3f7] to-[#29b6f6] text-[#1a1a2e] rounded font-semibold"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
