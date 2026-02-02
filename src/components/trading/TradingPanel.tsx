'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useAccountStore } from '@/stores/useAccountStore';
import { usePortfolioStore } from '@/stores/usePortfolioStore';
import { useTradeStore } from '@/stores/useTradeStore';
import { useUIStore } from '@/stores/useUIStore';
import { useJournalStore } from '@/stores/useJournalStore';
import { useExchangeRateStore } from '@/stores/useExchangeRateStore';
import { useSectorStore } from '@/stores/useSectorStore';
import { MARKETS, DEFAULT_ACCOUNT_NAMES } from '@/lib/constants';
import { parseNumberInput } from '@/lib/formatters';

interface SearchResult {
  code: string;
  name: string;
  market: string;
}

export function TradingPanel() {
  const { currentAccountId, accounts } = useAccountStore();
  const { addStock, fetchPortfolio, stocks } = usePortfolioStore();
  const { executeBuy, executeSell, fetchTrades } = useTradeStore();
  const { showStatus } = useUIStore();
  const { addTradeEntry } = useJournalStore();
  const { rate } = useExchangeRateStore();
  const { sectors } = useSectorStore();

  // 현재 계정 이름 가져오기
  const currentAccount = accounts.find((a) => a.accountId === currentAccountId);
  const accountName = currentAccount?.name || DEFAULT_ACCOUNT_NAMES[currentAccountId || ''] || currentAccountId || '';

  const [market, setMarket] = useState('KR');
  const [sector, setSector] = useState('AI');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedStock, setSelectedStock] = useState<SearchResult | null>(null);
  const [currentPrice, setCurrentPrice] = useState('');
  const [tradePrice, setTradePrice] = useState('');
  const [tradeQty, setTradeQty] = useState('');
  const [, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // 현금 거래 관련
  const [cashMarket, setCashMarket] = useState('KR');
  const [cashAmount, setCashAmount] = useState('');
  const [exchangeDirection, setExchangeDirection] = useState<'KR_TO_US' | 'US_TO_KR'>('KR_TO_US');

  // 거래 날짜 (과거 내역 입력용)
  const [tradeDate, setTradeDate] = useState<string>('');

  // 시장 변경 시 섹터 초기화
  useEffect(() => {
    if (market === 'CRYPTO') {
      setSector('CRYPTO');
    }
  }, [market]);

  // 검색 디바운스
  useEffect(() => {
    const timer = setTimeout(() => {
      // 이미 선택된 종목의 이름과 같으면 검색하지 않음
      if (selectedStock && searchQuery === selectedStock.name) {
        return;
      }

      if (searchQuery.length >= 1) {
        searchStock();
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, market, selectedStock]);

  const searchStock = async () => {
    setIsSearching(true);
    try {
      let endpoint = '';
      if (market === 'KR') endpoint = `/api/search/kr?q=${encodeURIComponent(searchQuery)}`;
      else if (market === 'US') endpoint = `/api/search/us?q=${encodeURIComponent(searchQuery)}`;
      else endpoint = `/api/search/crypto?q=${encodeURIComponent(searchQuery)}`;

      const res = await fetch(endpoint);
      const results = await res.json();
      setSearchResults(results);
      setShowResults(true);
    } catch (error) {
      console.error('Search failed:', error);
    }
    setIsSearching(false);
  };

  const handleSelectStock = async (stock: SearchResult) => {
    // 이미 선택된 종목이면 가격 리셋하지 않음
    if (selectedStock?.code === stock.code && selectedStock?.market === stock.market) {
      setShowResults(false);
      return;
    }

    setSelectedStock(stock);
    setSearchQuery(stock.name);
    setShowResults(false);

    // 시세 조회
    try {
      let endpoint = '';
      if (stock.market === 'KR') endpoint = `/api/prices/kr/${stock.code}`;
      else if (stock.market === 'US') endpoint = `/api/prices/us/${stock.code}`;
      else endpoint = `/api/prices/crypto/${stock.code}`;

      const res = await fetch(endpoint);
      const data = await res.json();
      if (data.price) {
        setCurrentPrice(data.price.toString());
        setTradePrice(data.price.toString());
      }
    } catch (error) {
      console.error('Failed to fetch price:', error);
    }
  };

  const handleBuy = async () => {
    if (!selectedStock || !currentAccountId) {
      showStatus('종목을 선택해주세요.', true);
      return;
    }

    const price = parseNumberInput(tradePrice);
    const qty = parseFloat(tradeQty) || 0;

    if (price <= 0 || qty <= 0) {
      showStatus('가격과 수량을 입력해주세요.', true);
      return;
    }

    // 포트폴리오에 추가
    await addStock({
      accountId: currentAccountId,
      market,
      sector,
      code: selectedStock.code,
      name: selectedStock.name,
      buyPrice: price,
      currentPrice: price,
      holdingQty: qty,
    });

    // 거래 기록
    await executeBuy({
      accountId: currentAccountId,
      market,
      code: selectedStock.code,
      name: selectedStock.name,
      price,
      qty,
      date: tradeDate || undefined,
    });

    // 매매일지에 자동 기록
    await addTradeEntry({
      accountName,
      type: 'buy',
      market,
      name: selectedStock.name,
      qty,
      price,
    }, tradeDate || undefined);

    await fetchPortfolio(currentAccountId);
    await fetchTrades(currentAccountId);

    showStatus(`${selectedStock.name} ${qty}주 매수 완료`);
    clearForm();
  };

  const handleSell = async () => {
    if (!selectedStock || !currentAccountId) {
      showStatus('종목을 선택해주세요.', true);
      return;
    }

    const price = parseNumberInput(tradePrice);
    const qty = parseFloat(tradeQty) || 0;

    if (price <= 0 || qty <= 0) {
      showStatus('가격과 수량을 입력해주세요.', true);
      return;
    }

    // 보유 종목 확인
    const holding = stocks.find(
      (s) => s.code === selectedStock.code && s.market === market
    );

    if (!holding) {
      showStatus('보유하지 않은 종목입니다.', true);
      return;
    }

    if (holding.holdingQty < qty) {
      showStatus(`보유 수량(${holding.holdingQty}주)보다 많이 매도할 수 없습니다.`, true);
      return;
    }

    // 종목 수량 감소
    await usePortfolioStore.getState().updateStock(holding.id, {
      holdingQty: holding.holdingQty - qty,
      currentPrice: price,
    });

    // 거래 기록 (실현손익 포함)
    await executeSell({
      accountId: currentAccountId,
      market,
      code: selectedStock.code,
      name: selectedStock.name,
      price,
      qty,
      buyPrice: holding.buyPrice,
      date: tradeDate || undefined,
    });

    const pnl = (price - holding.buyPrice) * qty;

    // 매매일지에 자동 기록
    await addTradeEntry({
      accountName,
      type: 'sell',
      market,
      name: selectedStock.name,
      qty,
      price,
      pnl,
    }, tradeDate || undefined);

    await fetchPortfolio(currentAccountId);
    await fetchTrades(currentAccountId);

    showStatus(
      `${selectedStock.name} ${qty}주 매도 완료 (손익: ${pnl >= 0 ? '+' : ''}${Math.round(pnl).toLocaleString()}원)`
    );
    clearForm();
  };

  const clearForm = () => {
    setSelectedStock(null);
    setSearchQuery('');
    setCurrentPrice('');
    setTradePrice('');
    setTradeQty('');
  };

  // 현금 입금 (일지에만 기록)
  const handleDeposit = async () => {
    const amount = parseNumberInput(cashAmount);
    if (amount <= 0) {
      showStatus('입금 금액을 입력해주세요.', true);
      return;
    }

    await addTradeEntry({
      accountName,
      type: 'deposit',
      market: cashMarket,
      price: amount,
    }, tradeDate || undefined);

    const amountText = cashMarket === 'US' ? `$${amount.toLocaleString()}` : `${amount.toLocaleString()}원`;
    showStatus(`${amountText} 입금 기록 완료`);
    setCashAmount('');
  };

  // 현금 출금 (일지에만 기록)
  const handleWithdraw = async () => {
    const amount = parseNumberInput(cashAmount);
    if (amount <= 0) {
      showStatus('출금 금액을 입력해주세요.', true);
      return;
    }

    await addTradeEntry({
      accountName,
      type: 'withdraw',
      market: cashMarket,
      price: amount,
    }, tradeDate || undefined);

    const amountText = cashMarket === 'US' ? `$${amount.toLocaleString()}` : `${amount.toLocaleString()}원`;
    showStatus(`${amountText} 출금 기록 완료`);
    setCashAmount('');
  };

  // 환전 (일지에만 기록)
  const handleExchange = async () => {
    const amount = parseNumberInput(cashAmount);
    if (amount <= 0) {
      showStatus('환전 금액을 입력해주세요.', true);
      return;
    }

    const fromAmount = amount;
    const toAmount = exchangeDirection === 'KR_TO_US'
      ? amount / rate
      : amount * rate;

    await addTradeEntry({
      accountName,
      type: 'exchange',
      direction: exchangeDirection,
      fromAmount,
      toAmount,
      rate,
    }, tradeDate || undefined);

    const fromText = exchangeDirection === 'KR_TO_US'
      ? `${fromAmount.toLocaleString()}원`
      : `$${fromAmount.toLocaleString()}`;
    const toText = exchangeDirection === 'KR_TO_US'
      ? `$${toAmount.toFixed(2)}`
      : `${Math.round(toAmount).toLocaleString()}원`;

    showStatus(`환전 기록 완료: ${fromText} → ${toText}`);
    setCashAmount('');
  };

  const marketOptions = Object.entries(MARKETS).map(([value, label]) => ({
    value,
    label,
  }));

  const sectorOptions = sectors.map((s) => ({
    value: s.code,
    label: s.name,
  }));

  // 오늘 날짜
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <Card title="거래">
      {/* 거래 날짜 선택 */}
      <div className="mb-6 pb-4 border-b border-white/10">
        <div className="flex items-center gap-4">
          <label className="text-sm text-[#888]">거래일:</label>
          <input
            type="date"
            value={tradeDate}
            onChange={(e) => setTradeDate(e.target.value)}
            max={todayStr}
            className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-[#4fc3f7]"
          />
          {tradeDate && (
            <button
              onClick={() => setTradeDate('')}
              className="text-sm text-[#888] hover:text-white"
            >
              오늘로 초기화
            </button>
          )}
          {tradeDate && (
            <span className="text-xs text-[#ffa726]">
              과거 날짜 입력 모드
            </span>
          )}
          {!tradeDate && (
            <span className="text-xs text-[#666]">
              비워두면 오늘 날짜로 기록됩니다
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 종목 선택 */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="시장"
              options={marketOptions}
              value={market}
              onChange={(e) => setMarket(e.target.value)}
            />
            <Select
              label="섹터"
              options={sectorOptions}
              value={sector}
              onChange={(e) => setSector(e.target.value)}
            />
          </div>

          {/* 거래가격 */}
          <Input
            label="거래가격"
            type="text"
            placeholder="거래 가격"
            value={tradePrice}
            onChange={(e) => setTradePrice(e.target.value)}
          />

          {/* 선택된 종목 정보 */}
          {selectedStock && (
            <div className="p-4 bg-white/5 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium text-white">{selectedStock.name}</div>
                  <div className="text-sm text-[#888]">
                    {selectedStock.code} · 현재가:{' '}
                    {currentPrice
                      ? market === 'US'
                        ? `$${parseFloat(currentPrice).toFixed(2)}`
                        : `${parseInt(currentPrice).toLocaleString()}원`
                      : '조회 중...'}
                  </div>
                </div>
                <button
                  onClick={clearForm}
                  className="text-[#888] hover:text-white"
                >
                  &times;
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 거래 입력 */}
        <div className="space-y-4">
          {/* 종목 검색 */}
          <div className="relative">
            <Input
              label="종목 검색"
              placeholder="종목명 또는 코드 입력"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowResults(true)}
            />

            {/* 검색 결과 */}
            {showResults && searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-[#1a1a2e] border border-white/20 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                {searchResults.map((result) => (
                  <div
                    key={`${result.market}-${result.code}`}
                    onClick={() => handleSelectStock(result)}
                    className="px-4 py-3 hover:bg-white/10 cursor-pointer border-b border-white/5 last:border-0"
                  >
                    <div className="font-medium text-white">{result.name}</div>
                    <div className="text-sm text-[#888]">{result.code}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Input
            label="수량"
            type="number"
            placeholder="거래 수량"
            value={tradeQty}
            onChange={(e) => setTradeQty(e.target.value)}
          />

          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleBuy}
              className="flex-1 bg-gradient-to-r from-[#e53935] to-[#c62828]"
            >
              매수
            </Button>
            <Button
              onClick={handleSell}
              className="flex-1 bg-gradient-to-r from-[#1e88e5] to-[#1565c0]"
            >
              매도
            </Button>
          </div>
        </div>
      </div>

      {/* 현금 거래 섹션 */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <h3 className="text-sm font-medium text-[#81d4fa] mb-4">현금 입출금 / 환전</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 입출금 */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="시장"
                options={[
                  { value: 'KR', label: '국내 (원화)' },
                  { value: 'US', label: '해외 (달러)' },
                ]}
                value={cashMarket}
                onChange={(e) => setCashMarket(e.target.value)}
              />
              <Input
                label="금액"
                type="text"
                placeholder={cashMarket === 'US' ? '달러 금액' : '원화 금액'}
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleDeposit}
                size="sm"
                className="flex-1 bg-gradient-to-r from-[#66bb6a] to-[#43a047]"
              >
                입금
              </Button>
              <Button
                onClick={handleWithdraw}
                size="sm"
                className="flex-1 bg-gradient-to-r from-[#ffa726] to-[#fb8c00]"
              >
                출금
              </Button>
            </div>
          </div>

          {/* 환전 */}
          <div className="space-y-3">
            <div className="flex items-end gap-3">
              <div className="w-1/2">
                <Select
                  label="환전 방향"
                  options={[
                    { value: 'KR_TO_US', label: '원화 → 달러' },
                    { value: 'US_TO_KR', label: '달러 → 원화' },
                  ]}
                  value={exchangeDirection}
                  onChange={(e) => setExchangeDirection(e.target.value as 'KR_TO_US' | 'US_TO_KR')}
                />
              </div>
              <Button
                onClick={handleExchange}
                size="sm"
                className="flex-1 bg-gradient-to-r from-[#9c27b0] to-[#7b1fa2]"
              >
                환전
              </Button>
            </div>
            <div className="text-right text-xs text-[#666]">
              환율: 1 USD = {rate.toLocaleString()}원
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
