'use client';

import { useEffect, useState, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SummaryCard } from '@/components/dashboard/SummaryCard';
import { useAccountStore } from '@/stores/useAccountStore';
import { useExchangeRateStore } from '@/stores/useExchangeRateStore';
import { useUIStore } from '@/stores/useUIStore';
import { calculatePortfolioSummary } from '@/lib/calculations';
import { formatKRW } from '@/lib/formatters';
import type { AccountDetail } from '@/types';

interface AccountSummary {
  accountId: string;
  name: string;
  totalValue: number;
  totalCost: number;
  totalProfit: number;
  profitPct: number;
  totalCash: number; // 현금 총액 (원화 환산)
  realizedPnL: { KR: number; US: number };
}

interface Snapshot {
  id: string;
  date: string;
  totalAsset: number;
  totalAssetChange: number;
  jinwonAsset: number;
  jinwonChange: number;
  dadAsset: number;
  dadChange: number;
  lionAsset: number;
  lionChange: number;
  exchangeRate: number;
}

export function SummaryView() {
  const { accounts, fetchAccounts } = useAccountStore();
  const { rate } = useExchangeRateStore();
  const { setActiveTab, showStatus } = useUIStore();
  const { setCurrentAccount } = useAccountStore();
  const [summaries, setSummaries] = useState<AccountSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [isSnapshotLoading, setIsSnapshotLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 스냅샷 목록 조회
  const fetchSnapshots = async () => {
    try {
      const res = await fetch('/api/snapshots');
      const data = await res.json();
      setSnapshots(data);
    } catch (error) {
      console.error('Failed to fetch snapshots:', error);
    }
  };

  useEffect(() => {
    fetchSnapshots();
  }, []);

  useEffect(() => {
    const fetchAllSummaries = async () => {
      setIsLoading(true);
      const results: AccountSummary[] = [];

      for (const account of accounts) {
        try {
          const res = await fetch(`/api/accounts/${account.accountId}`);
          const detail: AccountDetail = await res.json();

          const stocks = detail.portfolio.map((s) => ({
            id: s.id,
            market: s.market,
            sector: s.sector,
            code: s.code,
            name: s.name,
            targetWeight: s.targetWeight,
            buyPrice: s.buyPrice,
            currentPrice: s.currentPrice,
            holdingQty: s.holdingQty,
          }));

          const cash = detail.cashHoldings.map((c) => ({
            market: c.market,
            amount: c.amount,
            targetWeight: c.targetWeight,
          }));

          const summary = calculatePortfolioSummary(stocks, cash, rate);

          const realizedPnL: { KR: number; US: number } = { KR: 0, US: 0 };
          detail.realizedPnL?.forEach((r) => {
            if (r.market === 'KR' || r.market === 'US') {
              realizedPnL[r.market] = r.amount;
            }
          });

          // 현금 총액 계산 (원화 환산)
          let totalCash = 0;
          cash.forEach((c) => {
            const amount = c.amount || 0;
            if (c.market === 'KR') {
              totalCash += amount;
            } else if (c.market === 'US') {
              totalCash += amount * rate;
            } else if (c.market === 'CRYPTO') {
              totalCash += amount * rate; // 크립토도 달러 기준
            }
          });

          results.push({
            accountId: account.accountId,
            name: account.name,
            totalValue: summary.totalValue,
            totalCost: summary.totalCost,
            totalProfit: summary.totalProfit,
            profitPct: summary.totalProfitPct,
            totalCash,
            realizedPnL,
          });
        } catch (error) {
          console.error(`Failed to fetch summary for ${account.accountId}:`, error);
        }
      }

      setSummaries(results);
      setIsLoading(false);
    };

    if (accounts.length > 0) {
      fetchAllSummaries();
    } else {
      setIsLoading(false);
    }
  }, [accounts, rate]);

  const totalValue = summaries.reduce((sum, s) => sum + (s.totalValue || 0), 0);
  const totalCost = summaries.reduce((sum, s) => sum + (s.totalCost || 0), 0);
  const totalProfit = summaries.reduce((sum, s) => sum + (s.totalProfit || 0), 0);
  const totalCash = summaries.reduce((sum, s) => sum + (s.totalCash || 0), 0);
  const totalRealizedKR = summaries.reduce((sum, s) => sum + (s.realizedPnL?.KR || 0), 0);
  const totalRealizedUS = summaries.reduce((sum, s) => sum + (s.realizedPnL?.US || 0), 0);
  const totalRealizedKRW = totalRealizedKR + totalRealizedUS * rate;

  // 계정별 자산 가져오기
  const getAccountAsset = (accountId: string) => {
    const summary = summaries.find((s) => s.accountId === accountId);
    return summary?.totalValue || 0;
  };

  // 스냅샷 저장
  const handleSnapshot = async () => {
    setIsSnapshotLoading(true);
    try {
      const res = await fetch('/api/snapshots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalAsset: totalValue,
          jinwonAsset: getAccountAsset('jinwon'),
          dadAsset: getAccountAsset('dad'),
          lionAsset: getAccountAsset('lion'),
          exchangeRate: rate,
        }),
      });

      if (res.ok) {
        showStatus('스냅샷이 저장되었습니다.');
        fetchSnapshots();
      } else {
        showStatus('스냅샷 저장에 실패했습니다.', true);
      }
    } catch (error) {
      console.error('Failed to create snapshot:', error);
      showStatus('스냅샷 저장에 실패했습니다.', true);
    }
    setIsSnapshotLoading(false);
  };

  // 스냅샷 삭제
  const handleDeleteSnapshot = async (id: string) => {
    try {
      await fetch(`/api/snapshots?id=${id}`, { method: 'DELETE' });
      fetchSnapshots();
    } catch (error) {
      console.error('Failed to delete snapshot:', error);
    }
  };

  const handleAccountClick = (accountId: string) => {
    setCurrentAccount(accountId);
    setActiveTab('portfolio');
  };

  // JSON 저장 (내보내기)
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await fetch('/api/export');
      const data = await res.json();

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const date = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `portfolio_${date}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showStatus('JSON 파일로 저장되었습니다.');
    } catch (error) {
      console.error('Failed to export:', error);
      showStatus('저장에 실패했습니다.', true);
    }
    setIsExporting(false);
  };

  // JSON 파일 선택 시 모달 표시
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    setShowImportModal(true);
  };

  // 실제 불러오기 실행
  const executeImport = async (mode: 'overwrite' | 'merge') => {
    if (!importFile) return;

    setIsImporting(true);
    setShowImportModal(false);

    try {
      const text = await importFile.text();
      const data = JSON.parse(text);

      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, mode }),
      });

      if (res.ok) {
        const modeText = mode === 'merge' ? '병합' : '덮어쓰기';
        showStatus(`데이터를 ${modeText}했습니다. 새로고침합니다...`);
        setTimeout(() => window.location.reload(), 1000);
      } else {
        showStatus('불러오기에 실패했습니다.', true);
      }
    } catch (error) {
      console.error('Failed to import:', error);
      showStatus('파일 형식이 올바르지 않습니다.', true);
    }

    setIsImporting(false);
    setImportFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 전체 삭제
  const handleDeleteAll = async () => {
    if (!confirm('모든 데이터를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.')) {
      return;
    }
    if (!confirm('정말로 삭제하시겠습니까? 모든 계정, 포트폴리오, 거래내역이 삭제됩니다.')) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch('/api/export', { method: 'DELETE' });

      if (res.ok) {
        showStatus('모든 데이터가 삭제되었습니다. 새로고침합니다...');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        showStatus('삭제에 실패했습니다.', true);
      }
    } catch (error) {
      console.error('Failed to delete:', error);
      showStatus('삭제에 실패했습니다.', true);
    }
    setIsDeleting(false);
  };

  // 변화량 포맷팅
  const formatChange = (change: number) => {
    if (change === 0) return '-';
    const sign = change >= 0 ? '+' : '';
    return `${sign}${formatKRW(change)}`;
  };

  // 변화량 색상
  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-[#e53935]';
    if (change < 0) return 'text-[#1e88e5]';
    return 'text-[#888]';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#888]">로딩 중...</div>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <Card>
        <div className="text-center py-10 text-[#888]">
          계정이 없습니다. 포트폴리오 탭에서 계정을 추가해주세요.
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 전체 요약 */}
      <Card
        title="전체 요약"
        headerRight={
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              onClick={handleExport}
              disabled={isExporting}
              size="sm"
              className="bg-gradient-to-r from-[#66bb6a] to-[#43a047]"
            >
              {isExporting ? '저장 중...' : '저장'}
            </Button>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              size="sm"
              className="bg-gradient-to-r from-[#42a5f5] to-[#1e88e5]"
            >
              {isImporting ? '불러오는 중...' : '불러오기'}
            </Button>
            <Button
              onClick={handleDeleteAll}
              disabled={isDeleting}
              size="sm"
              className="bg-gradient-to-r from-[#ef5350] to-[#e53935]"
            >
              {isDeleting ? '삭제 중...' : '삭제'}
            </Button>
            <Button
              onClick={handleSnapshot}
              disabled={isSnapshotLoading}
              size="sm"
              className="bg-gradient-to-r from-[#7c4dff] to-[#536dfe]"
            >
              {isSnapshotLoading ? '저장 중...' : '스냅샷'}
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="bg-white/[0.03] rounded-xl p-5">
            <span className="text-sm text-[#888] block mb-2">총 평가금액</span>
            <span className="text-2xl font-bold text-[#4fc3f7]">
              {formatKRW(totalValue)}
            </span>
          </div>
          <div className="bg-white/[0.03] rounded-xl p-5">
            <span className="text-sm text-[#888] block mb-2">총 투자원금</span>
            <span className="text-xl text-[#aaa]">{formatKRW(totalCost)}</span>
          </div>
          <div className="bg-white/[0.03] rounded-xl p-5">
            <span className="text-sm text-[#888] block mb-2">현금 총액</span>
            <span className="text-xl text-[#66bb6a]">{formatKRW(totalCash)}</span>
          </div>
          <div className="bg-white/[0.03] rounded-xl p-5">
            <span className="text-sm text-[#888] block mb-2">총 평가손익</span>
            <span
              className={`text-xl font-semibold ${
                totalProfit >= 0 ? 'text-[#e53935]' : 'text-[#1e88e5]'
              }`}
            >
              {totalProfit >= 0 ? '+' : ''}
              {formatKRW(totalProfit)}
            </span>
          </div>
          <div className="bg-white/[0.03] rounded-xl p-5">
            <span className="text-sm text-[#888] block mb-2">총 실현손익</span>
            <span
              className={`text-xl font-semibold ${
                totalRealizedKRW >= 0 ? 'text-[#e53935]' : 'text-[#1e88e5]'
              }`}
            >
              {totalRealizedKRW >= 0 ? '+' : ''}
              {formatKRW(totalRealizedKRW)}
            </span>
          </div>
        </div>
      </Card>

      {/* 계정별 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {summaries.map((summary) => (
          <SummaryCard
            key={summary.accountId}
            accountName={summary.name}
            totalValue={summary.totalValue}
            totalCost={summary.totalCost}
            totalProfit={summary.totalProfit}
            profitPct={summary.profitPct}
            totalCash={summary.totalCash}
            realizedPnL={summary.realizedPnL}
            exchangeRate={rate}
            onClick={() => handleAccountClick(summary.accountId)}
          />
        ))}
      </div>

      {/* 스냅샷 기록 */}
      {snapshots.length > 0 && (
        <Card title="스냅샷 기록">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-2 text-[#888] font-medium">날짜</th>
                  <th className="text-right py-3 px-2 text-[#888] font-medium">총 자산</th>
                  <th className="text-right py-3 px-2 text-[#888] font-medium">변화</th>
                  <th className="text-right py-3 px-2 text-[#888] font-medium">진원</th>
                  <th className="text-right py-3 px-2 text-[#888] font-medium">변화</th>
                  <th className="text-right py-3 px-2 text-[#888] font-medium">아빠</th>
                  <th className="text-right py-3 px-2 text-[#888] font-medium">변화</th>
                  <th className="text-right py-3 px-2 text-[#888] font-medium">리온</th>
                  <th className="text-right py-3 px-2 text-[#888] font-medium">변화</th>
                  <th className="text-center py-3 px-2 text-[#888] font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {snapshots.map((snapshot) => (
                  <tr key={snapshot.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3 px-2 text-[#ccc]">
                      {new Date(snapshot.date).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="text-right py-3 px-2 text-[#4fc3f7] font-semibold">
                      {formatKRW(snapshot.totalAsset)}
                    </td>
                    <td className={`text-right py-3 px-2 ${getChangeColor(snapshot.totalAssetChange)}`}>
                      {formatChange(snapshot.totalAssetChange)}
                    </td>
                    <td className="text-right py-3 px-2 text-[#ccc]">
                      {formatKRW(snapshot.jinwonAsset)}
                    </td>
                    <td className={`text-right py-3 px-2 ${getChangeColor(snapshot.jinwonChange)}`}>
                      {formatChange(snapshot.jinwonChange)}
                    </td>
                    <td className="text-right py-3 px-2 text-[#ccc]">
                      {formatKRW(snapshot.dadAsset)}
                    </td>
                    <td className={`text-right py-3 px-2 ${getChangeColor(snapshot.dadChange)}`}>
                      {formatChange(snapshot.dadChange)}
                    </td>
                    <td className="text-right py-3 px-2 text-[#ccc]">
                      {formatKRW(snapshot.lionAsset)}
                    </td>
                    <td className={`text-right py-3 px-2 ${getChangeColor(snapshot.lionChange)}`}>
                      {formatChange(snapshot.lionChange)}
                    </td>
                    <td className="text-center py-3 px-2">
                      <button
                        onClick={() => handleDeleteSnapshot(snapshot.id)}
                        className="text-[#666] hover:text-red-400 transition-colors"
                        title="삭제"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 불러오기 모드 선택 모달 */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#161b22] border border-white/10 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">불러오기 방식 선택</h3>
            <p className="text-sm text-[#888] mb-6">
              파일: {importFile?.name}
            </p>

            <div className="space-y-3">
              <button
                onClick={() => executeImport('merge')}
                className="w-full p-4 text-left bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors"
              >
                <div className="font-medium text-[#4fc3f7]">병합 (권장)</div>
                <div className="text-sm text-[#888] mt-1">
                  기존 데이터는 유지하고, 새로운 종목만 추가합니다.
                </div>
              </button>

              <button
                onClick={() => executeImport('overwrite')}
                className="w-full p-4 text-left bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors"
              >
                <div className="font-medium text-[#ffa726]">덮어쓰기</div>
                <div className="text-sm text-[#888] mt-1">
                  같은 종목이 있으면 파일의 데이터로 교체합니다.
                </div>
              </button>
            </div>

            <button
              onClick={() => {
                setShowImportModal(false);
                setImportFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="w-full mt-4 py-2 text-[#888] hover:text-white transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
