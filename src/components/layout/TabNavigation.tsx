'use client';

import { useUIStore } from '@/stores/useUIStore';
import { useAccountStore } from '@/stores/useAccountStore';

export function TabNavigation() {
  const { activeTab, setActiveTab, openAddAccountModal } = useUIStore();
  const { accounts, currentAccountId, setCurrentAccount, deleteAccount } =
    useAccountStore();

  return (
    <div className="flex flex-wrap gap-1 mb-5 p-2 bg-white/5 rounded-xl">
      {/* 종합 탭 */}
      <button
        onClick={() => setActiveTab('summary')}
        className={`px-6 py-3 rounded-lg font-semibold transition-all ${
          activeTab === 'summary'
            ? 'bg-gradient-to-r from-[#4fc3f7] to-[#29b6f6] text-[#1a1a2e]'
            : 'text-[#888] hover:bg-white/10 hover:text-[#ccc]'
        }`}
      >
        종합
      </button>

      {/* 계정 탭들 */}
      {activeTab === 'portfolio' && (
        <div className="flex gap-1">
          {accounts.map((account) => (
            <div key={account.accountId} className="relative group">
              <button
                onClick={() => setCurrentAccount(account.accountId)}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  currentAccountId === account.accountId
                    ? 'bg-gradient-to-r from-[#4fc3f7] to-[#29b6f6] text-[#1a1a2e]'
                    : 'text-[#888] hover:bg-white/10 hover:text-[#ccc]'
                }`}
              >
                {account.name}
              </button>
              {/* 삭제 버튼 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`'${account.name}' 계정을 삭제하시겠습니까?`)) {
                    deleteAccount(account.accountId);
                  }
                }}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs hidden group-hover:flex items-center justify-center"
              >
                &times;
              </button>
            </div>
          ))}
          {/* 계정 추가 버튼 */}
          <button
            onClick={openAddAccountModal}
            className="px-4 py-3 border-2 border-dashed border-white/30 rounded-lg text-[#888] hover:border-[#4fc3f7] hover:text-[#4fc3f7] transition-all"
          >
            +
          </button>
        </div>
      )}

      {/* 포트폴리오/매매일지 탭 */}
      {activeTab !== 'portfolio' && (
        <button
          onClick={() => {
            setActiveTab('portfolio');
            if (accounts.length > 0 && !currentAccountId) {
              setCurrentAccount(accounts[0].accountId);
            }
          }}
          className="px-6 py-3 rounded-lg font-semibold text-[#888] hover:bg-white/10 hover:text-[#ccc] transition-all"
        >
          포트폴리오
        </button>
      )}

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
    </div>
  );
}
