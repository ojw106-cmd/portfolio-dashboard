'use client';

import { useState } from 'react';
import { useSectorStore } from '@/stores/useSectorStore';

interface SectorManageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// 색상 팔레트
const COLOR_PALETTE = [
  '#7c4dff', '#1e88e5', '#00bcd4', '#66bb6a', '#ffa726',
  '#ec407a', '#5c6bc0', '#78909c', '#26c6da', '#ffca28',
  '#9c27b0', '#ff7043', '#8d6e63', '#26a69a', '#42a5f5',
  '#ef5350', '#ab47bc', '#29b6f6', '#9ccc65', '#ffee58',
];

export function SectorManageModal({ isOpen, onClose }: SectorManageModalProps) {
  const { sectors, addSector, updateSector, deleteSector } = useSectorStore();
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#7c4dff');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  if (!isOpen) return null;

  const handleAdd = async () => {
    if (!newCode.trim() || !newName.trim()) return;

    await addSector(newCode.trim(), newName.trim(), newColor);
    setNewCode('');
    setNewName('');
    setNewColor('#7c4dff');
  };

  const handleEdit = (sector: { id: string; name: string; color: string }) => {
    setEditingId(sector.id);
    setEditName(sector.name);
    setEditColor(sector.color);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editName.trim()) return;

    await updateSector(editingId, { name: editName, color: editColor });
    setEditingId(null);
    setEditName('');
    setEditColor('');
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`'${name}' 섹터를 삭제하시겠습니까?\n\n이 섹터를 사용하는 종목이 있다면 영향을 받을 수 있습니다.`)) {
      await deleteSector(id);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#161b22] border border-white/10 rounded-xl w-full max-w-lg max-h-[80vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex justify-between items-center p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">섹터 관리</h2>
          <button
            onClick={onClose}
            className="text-[#888] hover:text-white text-xl"
          >
            &times;
          </button>
        </div>

        {/* 새 섹터 추가 */}
        <div className="p-4 border-b border-white/10 space-y-3">
          <div className="text-sm text-[#888] mb-2">새 섹터 추가</div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase())}
              placeholder="코드 (예: FINTECH)"
              className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-[#4fc3f7]"
            />
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="이름 (예: 핀테크)"
              className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-[#4fc3f7]"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#888]">색상:</span>
            <div className="flex flex-wrap gap-1">
              {COLOR_PALETTE.map((color) => (
                <button
                  key={color}
                  onClick={() => setNewColor(color)}
                  className={`w-6 h-6 rounded ${newColor === color ? 'ring-2 ring-white ring-offset-1 ring-offset-[#161b22]' : ''}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          <button
            onClick={handleAdd}
            disabled={!newCode.trim() || !newName.trim()}
            className="w-full py-2 bg-gradient-to-r from-[#4fc3f7] to-[#00bcd4] text-white rounded-lg font-medium disabled:opacity-50"
          >
            추가
          </button>
        </div>

        {/* 섹터 목록 */}
        <div className="p-4 max-h-[40vh] overflow-y-auto">
          <div className="text-sm text-[#888] mb-3">섹터 목록 ({sectors.length}개)</div>
          <div className="space-y-2">
            {sectors.map((sector) => (
              <div
                key={sector.id}
                className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
              >
                {editingId === sector.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none"
                    />
                    <div className="flex gap-1">
                      {COLOR_PALETTE.slice(0, 10).map((color) => (
                        <button
                          key={color}
                          onClick={() => setEditColor(color)}
                          className={`w-5 h-5 rounded ${editColor === color ? 'ring-2 ring-white' : ''}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <button
                      onClick={handleSaveEdit}
                      className="px-3 py-1 bg-[#4fc3f7] text-white rounded text-sm"
                    >
                      저장
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1 bg-white/10 text-white rounded text-sm"
                    >
                      취소
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: sector.color }}
                      />
                      <span className="text-[#888] text-sm">{sector.code}</span>
                      <span className="text-white">{sector.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(sector)}
                        className="text-[#4fc3f7] hover:text-[#81d4fa] text-sm"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(sector.id, sector.name)}
                        className="text-[#888] hover:text-red-400 text-sm"
                      >
                        삭제
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
