'use client';

import { useUIStore } from '@/stores/useUIStore';

export function TabNavigation() {
  const { activeTab, setActiveTab } = useUIStore();

  return (
    <div className="flex flex-wrap gap-1 mb-5 p-2 bg-white/5 rounded-xl">
      {/* 포트폴리오 탭 (첫 번째) */}
      <button
        onClick={() => setActiveTab('portfolio')}
        className={`px-6 py-3 rounded-lg font-semibold transition-all ${
          activeTab === 'portfolio'
            ? 'bg-gradient-to-r from-[#4fc3f7] to-[#29b6f6] text-[#1a1a2e]'
            : 'text-[#888] hover:bg-white/10 hover:text-[#ccc]'
        }`}
      >
        포트폴리오
      </button>

      <button
        onClick={() => setActiveTab('stats')}
        className={`px-6 py-3 rounded-lg font-semibold transition-all ${
          activeTab === 'stats'
            ? 'bg-gradient-to-r from-[#4fc3f7] to-[#29b6f6] text-[#1a1a2e]'
            : 'text-[#888] hover:bg-white/10 hover:text-[#ccc]'
        }`}
      >
        기록&통계
      </button>

      <button
        onClick={() => setActiveTab('journal')}
        className={`px-6 py-3 rounded-lg font-semibold transition-all ${
          activeTab === 'journal'
            ? 'bg-gradient-to-r from-[#4fc3f7] to-[#29b6f6] text-[#1a1a2e]'
            : 'text-[#888] hover:bg-white/10 hover:text-[#ccc]'
        }`}
      >
        매매일지
      </button>

      <button
        onClick={() => setActiveTab('research')}
        className={`px-6 py-3 rounded-lg font-semibold transition-all ${
          activeTab === 'research'
            ? 'bg-gradient-to-r from-[#4fc3f7] to-[#29b6f6] text-[#1a1a2e]'
            : 'text-[#888] hover:bg-white/10 hover:text-[#ccc]'
        }`}
      >
        종목 리서치
      </button>

      <button
        onClick={() => setActiveTab('principles')}
        className={`px-6 py-3 rounded-lg font-semibold transition-all ${
          activeTab === 'principles'
            ? 'bg-gradient-to-r from-[#4fc3f7] to-[#29b6f6] text-[#1a1a2e]'
            : 'text-[#888] hover:bg-white/10 hover:text-[#ccc]'
        }`}
      >
        투자원칙
      </button>
    </div>
  );
}
