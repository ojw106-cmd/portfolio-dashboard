'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PieChart } from '@/components/dashboard/PieChart';
import { ReturnSummary } from '@/components/dashboard/ReturnSummary';
import { PortfolioTable } from '@/components/portfolio/PortfolioTable';
import { ThemeGrid } from '@/components/portfolio/ThemeGrid';
import { TradingPanel } from '@/components/trading/TradingPanel';
import { TradeHistory } from '@/components/trading/TradeHistory';
import { ThemeDetailModal } from '@/components/modals/ThemeDetailModal';
import { AddPositionModal } from '@/components/modals/AddPositionModal';
import { useAccountStore } from '@/stores/useAccountStore';
import { usePortfolioStore } from '@/stores/usePortfolioStore';
import { useTradeStore } from '@/stores/useTradeStore';
import { useExchangeRateStore } from '@/stores/useExchangeRateStore';
import { useUIStore } from '@/stores/useUIStore';
import { calculatePortfolioSummary } from '@/lib/calculations';
import { formatKRW } from '@/lib/formatters';
import { MARKET_COLORS } from '@/lib/constants';
import { useSectorStore } from '@/stores/useSectorStore';

export function PortfolioView() {
  const { currentAccountId, fetchAccountDetail, accounts } =
    useAccountStore();
  const { stocks, cash, fetchPortfolio, fetchCash, refreshAllPrices, refreshingPrices, addStock } =
    usePortfolioStore();
  const { fetchTrades, fetchRealizedPnL, realizedPnL, trades } = useTradeStore();
  const { rate } = useExchangeRateStore();
  const { showStatus } = useUIStore();
  const { getSectorName, getSectorColor } = useSectorStore();

  // 실현손익 기간 설정
  const [pnlStartDate, setPnlStartDate] = useState<string>('');
  const [pnlEndDate, setPnlEndDate] = useState<string>('');

  // 테마 상세 모달 상태
  const [themeModal, setThemeModal] = useState<{
    isOpen: boolean;
    themeCode: string;
    market: 'KR' | 'US';
  }>({ isOpen: false, themeCode: '', market: 'KR' });

  // 종목 추가 모달 상태
  const [addPositionModal, setAddPositionModal] = useState<{
    isOpen: boolean;
    market: 'KR' | 'US';
  }>({ isOpen: false, market: 'US' });

  useEffect(() => {
    if (currentAccountId) {
      fetchPortfolio(currentAccountId);
      fetchCash(currentAccountId);
      fetchTrades(currentAccountId);
      fetchRealizedPnL(currentAccountId);
    }
  }, [currentAccountId, fetchPortfolio, fetchCash, fetchTrades, fetchRealizedPnL]);

  // 기간별 실현손익 계산
  const filteredRealizedPnL = useMemo(() => {
    const result = { KR: 0, US: 0 };

    // 날짜 필터가 없으면 전체 실현손익 반환
    if (!pnlStartDate && !pnlEndDate) {
      return realizedPnL;
    }

    // 매도 거래에서 실현손익 계산
    trades.forEach((trade) => {
      if (trade.type !== 'sell' || trade.pnl === null || trade.pnl === undefined) return;

      const tradeDate = trade.date instanceof Date
        ? trade.date.toISOString().split('T')[0]
        : new Date(trade.date).toISOString().split('T')[0];

      // 날짜 필터 적용
      if (pnlStartDate && tradeDate < pnlStartDate) return;
      if (pnlEndDate && tradeDate > pnlEndDate) return;

      if (trade.market === 'KR') {
        result.KR += trade.pnl;
      } else if (trade.market === 'US') {
        result.US += trade.pnl;
      }
    });

    return result;
  }, [trades, pnlStartDate, pnlEndDate, realizedPnL]);

  const handleResetPnlFilter = () => {
    setPnlStartDate('');
    setPnlEndDate('');
  };

  // 테마 클릭 핸들러
  const handleThemeClick = (themeCode: string, market: 'KR' | 'US') => {
    setThemeModal({ isOpen: true, themeCode, market });
  };

  // 종목 추가 모달 열기
  const handleAddPositionClick = (market: 'KR' | 'US') => {
    setAddPositionModal({ isOpen: true, market });
  };

  // 종목 추가 제출
  const handleAddPositionSubmit = async (data: {
    type: 'stock' | 'theme';
    ticker?: string;
    name?: string;
    themeName?: string;
    targetWeight: number;
    theme: string;
  }) => {
    if (!currentAccountId) return;

    try {
      if (data.type === 'stock' && data.ticker) {
        // 현재가 조회
        const market = addPositionModal.market;
        let currentPrice = 0;
        try {
          const priceRes = await fetch(
            `/api/prices/${market.toLowerCase()}/${data.ticker}`
          );
          const priceData = await priceRes.json();
          currentPrice = priceData.price || 0;
        } catch (e) {
          console.error('Failed to fetch price:', e);
        }

        await addStock({
          accountId: currentAccountId,
          market: addPositionModal.market,
          sector: data.theme,
          code: data.ticker,
          name: data.name || data.ticker,
          buyPrice: currentPrice,
          currentPrice: currentPrice,
          holdingQty: 0,
        });

        showStatus(`${data.ticker} 추가 완료`);
      }
    } catch (error) {
      console.error('Failed to add position:', error);
      showStatus('종목 추가 실패', true);
    }

    setAddPositionModal({ isOpen: false, market: 'US' });
  };

  // 테마 상세 모달용 데이터 준비
  const themeModalData = useMemo(() => {
    if (!themeModal.isOpen) return null;

    const themeStocks = stocks.filter(
      (s) => s.market === themeModal.market && s.sector === themeModal.themeCode
    );
    const rateMultiplier = themeModal.market === 'US' ? rate : 1;

    let totalValue = 0;
    const stockList = themeStocks.map((s) => {
      const value = s.currentPrice * s.holdingQty * rateMultiplier;
      const cost = s.buyPrice * s.holdingQty * rateMultiplier;
      const profitAmount = value - cost;
      const profitRate = cost > 0 ? (profitAmount / cost) * 100 : 0;
      totalValue += value;

      return {
        ticker: s.code,
        name: s.name,
        shares: s.holdingQty,
        avgPrice: s.buyPrice,
        currentPrice: s.currentPrice,
        value,
        profitAmount,
        profitRate,
      };
    });

    // 시장 총액 계산
    const marketStocks = stocks.filter((s) => s.market === themeModal.market);
    let marketTotal = 0;
    marketStocks.forEach((s) => {
      marketTotal += s.currentPrice * s.holdingQty * rateMultiplier;
    });
    const cashValue = (cash[themeModal.market]?.amount || 0) * rateMultiplier;
    marketTotal += cashValue;

    const currentWeight = marketTotal > 0 ? (totalValue / marketTotal) * 100 : 0;
    const targetWeight = themeStocks.reduce((sum, s) => sum + s.targetWeight, 0);

    return {
      themeName: getSectorName(themeModal.themeCode),
      totalValue,
      currentWeight,
      targetWeight,
      stocks: stockList,
    };
  }, [themeModal, stocks, cash, rate, getSectorName]);

  if (!currentAccountId || accounts.length === 0) {
    return (
      <Card>
        <div className="text-center py-10 text-[#888]">
          계정을 선택해주세요.
        </div>
      </Card>
    );
  }

  const stocksData = stocks.map((s) => ({
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

  const cashData = Object.entries(cash).map(([market, data]) => ({
    market,
    amount: data.amount,
    targetWeight: data.targetWeight,
  }));

  const summary = calculatePortfolioSummary(stocksData, cashData, rate);

  // 시장별 파이 차트 데이터
  const marketChartItems = [
    {
      label: '국내',
      value: summary.markets.KR?.stockValue || 0,
      color: MARKET_COLORS.KR,
    },
    {
      label: '해외',
      value: summary.markets.US?.stockValue || 0,
      color: MARKET_COLORS.US,
    },
    {
      label: '국내 현금',
      value: summary.markets.KR?.cashValue || 0,
      color: '#9c27b0', // Navitas 색상 (보라색)
    },
    {
      label: '해외 현금',
      value: summary.markets.US?.cashValue || 0,
      color: '#ffa726', // 지투지바이오 색상
    },
  ];

  // 섹터별 파이 차트 데이터
  const sectorChartItems: { label: string; value: number; color: string }[] = Object.entries(summary.sectors).map(([sector, value]) => ({
    label: getSectorName(sector),
    value,
    color: getSectorColor(sector),
  }));

  // 현금을 섹터에 추가
  const totalCash =
    (summary.markets.KR?.cashValue || 0) +
    (summary.markets.US?.cashValue || 0) +
    (summary.markets.CRYPTO?.cashValue || 0);
  if (totalCash > 0) {
    sectorChartItems.push({
      label: '현금',
      value: totalCash,
      color: '#9e9e9e',
    });
  }

  // 종목별 색상 팔레트
  const STOCK_COLORS = [
    '#7c4dff', '#1e88e5', '#00bcd4', '#66bb6a', '#ffa726',
    '#ec407a', '#5c6bc0', '#78909c', '#26c6da', '#9c27b0',
    '#ff7043', '#8d6e63', '#26a69a', '#ab47bc', '#42a5f5',
    '#ef5350', '#ffca28', '#8bc34a', '#29b6f6', '#d4e157',
  ];

  // 국장 종목별 비중 데이터
  const krStocks = stocks.filter((s) => s.market === 'KR');
  const krMarketTotal = summary.markets.KR?.totalValue || 0;
  const krCashValue = summary.markets.KR?.cashValue || 0;
  const krStockChartItems: { label: string; value: number; color: string }[] = krStocks.map((s, idx) => ({
    label: s.name,
    value: s.currentPrice * s.holdingQty,
    color: STOCK_COLORS[idx % STOCK_COLORS.length],
  }));
  if (krCashValue > 0) {
    krStockChartItems.push({
      label: '현금',
      value: krCashValue,
      color: '#9e9e9e',
    });
  }

  // 해외 종목별 비중 데이터
  const usStocks = stocks.filter((s) => s.market === 'US');
  const usMarketTotal = summary.markets.US?.totalValue || 0;
  const usCashValue = summary.markets.US?.cashValue || 0;
  const usStockChartItems: { label: string; value: number; color: string }[] = usStocks.map((s, idx) => ({
    label: s.name,
    value: s.currentPrice * s.holdingQty * rate,
    color: STOCK_COLORS[idx % STOCK_COLORS.length],
  }));
  if (usCashValue > 0) {
    usStockChartItems.push({
      label: '현금',
      value: usCashValue,
      color: '#9e9e9e',
    });
  }

  const handleRefreshPrices = async () => {
    if (!currentAccountId) return;
    const result = await refreshAllPrices(currentAccountId);
    showStatus(
      `시세 새로고침 완료: ${result.success}개 성공, ${result.failed}개 실패`,
      result.failed > 0
    );
    fetchAccountDetail(currentAccountId);
  };

  return (
    <div className="space-y-6">
      {/* 전체 시세 새로고침 버튼 */}
      <div className="flex justify-end">
        <Button onClick={handleRefreshPrices} disabled={refreshingPrices} size="sm">
          {refreshingPrices ? '조회중...' : '전체 시세 새로고침'}
        </Button>
      </div>

      {/* 수익률 현황 */}
      <Card title="수익률 현황">
        <ReturnSummary
          krCost={summary.markets.KR?.costBasis || 0}
          krProfit={summary.markets.KR?.profitLoss || 0}
          krProfitPct={summary.markets.KR?.profitPct || 0}
          usCostUSD={(summary.markets.US?.costBasis || 0) / rate}
          usProfitUSD={(summary.markets.US?.profitLoss || 0) / rate}
          usProfitPct={summary.markets.US?.profitPct || 0}
          exchangeRate={rate}
        />
      </Card>

      {/* 자산 배분 */}
      <Card title="자산 배분 현황">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 시장별 비중 */}
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5 flex flex-col">
            <h3 className="text-center text-[#81d4fa] text-sm font-medium mb-3">시장별 비중</h3>
            <div className="flex-1 flex items-center justify-center">
              <PieChart
                items={marketChartItems}
                total={summary.totalValue}
                centerValue={formatKRW(summary.totalValue).replace(' 원', '')}
                centerLabel="총 평가"
              />
            </div>
          </div>

          {/* 섹터별 비중 */}
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5 flex flex-col">
            <h3 className="text-center text-[#81d4fa] text-sm font-medium mb-3">섹터별 비중</h3>
            <div className="flex-1 flex items-center justify-center">
              <PieChart
                items={sectorChartItems}
                total={summary.totalValue}
                centerValue={String(sectorChartItems.filter(i => i.value > 0).length)}
                centerLabel="섹터"
                gridLegend
                maxLegendHeight={200}
              />
            </div>
          </div>

          {/* 국내주식 비중 */}
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5 flex flex-col">
            <h3 className="text-center text-[#81d4fa] text-sm font-medium mb-3">국내주식 비중</h3>
            <div className="flex-1 flex items-center justify-center">
              <PieChart
                items={krStockChartItems}
                total={krMarketTotal}
                centerValue={String(krStockChartItems.filter(i => i.value > 0).length)}
                centerLabel="종목"
                gridLegend
                maxLegendHeight={200}
              />
            </div>
          </div>

          {/* 해외주식 비중 */}
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5 flex flex-col">
            <h3 className="text-center text-[#81d4fa] text-sm font-medium mb-3">해외주식 비중</h3>
            <div className="flex-1 flex items-center justify-center">
              <PieChart
                items={usStockChartItems}
                total={usMarketTotal}
                centerValue={String(usStockChartItems.filter(i => i.value > 0).length)}
                centerLabel="종목"
                gridLegend
                maxLegendHeight={200}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* 매매 패널 */}
      <TradingPanel />

      {/* 실현손익 & 거래 내역 */}
      <Card title="실현손익 & 거래내역">
        {/* 실현손익 기간 설정 */}
        <div className="flex flex-wrap items-center gap-4 mb-6 pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <label className="text-sm text-[#888]">실현손익 기간:</label>
            <input
              type="date"
              value={pnlStartDate}
              onChange={(e) => setPnlStartDate(e.target.value)}
              className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-[#4fc3f7]"
            />
            <span className="text-[#888]">~</span>
            <input
              type="date"
              value={pnlEndDate}
              onChange={(e) => setPnlEndDate(e.target.value)}
              className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-[#4fc3f7]"
            />
          </div>
          {(pnlStartDate || pnlEndDate) && (
            <button
              onClick={handleResetPnlFilter}
              className="text-sm text-[#888] hover:text-white"
            >
              전체 보기
            </button>
          )}
          <span className="text-xs text-[#666]">
            {pnlStartDate || pnlEndDate
              ? `${pnlStartDate || '처음'} ~ ${pnlEndDate || '현재'} 기간`
              : '전체 기간'}
          </span>
        </div>

        {/* 실현손익 요약 */}
        <div className="flex gap-8 items-center mb-6">
          <div>
            <span className="text-sm text-[#888] block mb-1">총 실현손익</span>
            <span
              className={`text-2xl font-bold ${
                filteredRealizedPnL.KR + filteredRealizedPnL.US * rate >= 0
                  ? 'text-[#e53935]'
                  : 'text-[#1e88e5]'
              }`}
            >
              {filteredRealizedPnL.KR + filteredRealizedPnL.US * rate >= 0 ? '+' : ''}
              {formatKRW(filteredRealizedPnL.KR + filteredRealizedPnL.US * rate)}
            </span>
          </div>
          <div>
            <span className="text-sm text-[#888] block mb-1">국내</span>
            <span
              className={filteredRealizedPnL.KR >= 0 ? 'text-[#e53935]' : 'text-[#1e88e5]'}
            >
              {filteredRealizedPnL.KR >= 0 ? '+' : ''}
              {formatKRW(filteredRealizedPnL.KR)}
            </span>
          </div>
          <div>
            <span className="text-sm text-[#888] block mb-1">해외</span>
            <span
              className={filteredRealizedPnL.US >= 0 ? 'text-[#e53935]' : 'text-[#1e88e5]'}
            >
              {filteredRealizedPnL.US >= 0 ? '+' : ''}${filteredRealizedPnL.US.toFixed(2)}
            </span>
          </div>
        </div>
        <TradeHistory />
      </Card>

      {/* 테마 그리드 - 해외 */}
      <ThemeGrid
        stocks={stocksData}
        cash={Object.fromEntries(
          Object.entries(cash).map(([k, v]) => [k, { amount: v.amount, targetWeight: v.targetWeight }])
        )}
        exchangeRate={rate}
        market="US"
        onThemeClick={(themeCode) => handleThemeClick(themeCode, 'US')}
        onAddClick={() => handleAddPositionClick('US')}
      />

      {/* 테마 그리드 - 국내 */}
      <ThemeGrid
        stocks={stocksData}
        cash={Object.fromEntries(
          Object.entries(cash).map(([k, v]) => [k, { amount: v.amount, targetWeight: v.targetWeight }])
        )}
        exchangeRate={rate}
        market="KR"
        onThemeClick={(themeCode) => handleThemeClick(themeCode, 'KR')}
        onAddClick={() => handleAddPositionClick('KR')}
      />

      {/* 포트폴리오 테이블 */}
      <PortfolioTable />

      {/* 테마 상세 모달 */}
      {themeModalData && (
        <ThemeDetailModal
          isOpen={themeModal.isOpen}
          onClose={() => setThemeModal({ isOpen: false, themeCode: '', market: 'KR' })}
          themeName={themeModalData.themeName}
          totalValue={themeModalData.totalValue}
          currentWeight={themeModalData.currentWeight}
          targetWeight={themeModalData.targetWeight}
          stocks={themeModalData.stocks}
          market={themeModal.market}
        />
      )}

      {/* 종목 추가 모달 */}
      <AddPositionModal
        isOpen={addPositionModal.isOpen}
        onClose={() => setAddPositionModal({ isOpen: false, market: 'US' })}
        onSubmit={handleAddPositionSubmit}
        market={addPositionModal.market}
      />
    </div>
  );
}
