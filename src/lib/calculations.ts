// 포트폴리오 계산 유틸리티

export interface StockData {
  id: string;
  market: string;
  sector: string;
  code: string;
  name: string;
  targetWeight: number;
  buyPrice: number;
  currentPrice: number;
  holdingQty: number;
}

export interface CashData {
  market: string;
  amount: number;
  targetWeight: number;
}

export interface StockCalculation {
  evalValue: number;
  costBasis: number;
  profitLoss: number;
  profitPct: number;
}

export interface RebalanceCalculation {
  targetAmount: number;
  diffAmount: number;
  rebalanceQty: number;
}

export interface MarketSummary {
  stockValue: number;
  costBasis: number;
  cashValue: number;
  totalValue: number;
  profitLoss: number;
  profitPct: number;
}

export interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  totalProfit: number;
  totalProfitPct: number;
  markets: Record<string, MarketSummary>;
  sectors: Record<string, number>;
}

// 환율 적용
export function getExchangeRate(market: string, exchangeRate: number): number {
  return market === 'US' ? exchangeRate : 1;
}

// 종목 평가금액 계산
export function calculateStockValue(
  stock: StockData,
  exchangeRate: number
): StockCalculation {
  const rate = getExchangeRate(stock.market, exchangeRate);
  const buyPrice = stock.buyPrice || stock.currentPrice;

  const costBasis = buyPrice * rate * stock.holdingQty;
  const evalValue = stock.currentPrice * rate * stock.holdingQty;
  const profitLoss = evalValue - costBasis;
  const profitPct = costBasis > 0 ? (profitLoss / costBasis) * 100 : 0;

  return { evalValue, costBasis, profitLoss, profitPct };
}

// 리밸런싱 계산
export function calculateRebalance(
  stock: StockData,
  totalValue: number,
  exchangeRate: number
): RebalanceCalculation {
  const rate = getExchangeRate(stock.market, exchangeRate);
  const evalValue = stock.currentPrice * rate * stock.holdingQty;

  const targetAmount = totalValue * (stock.targetWeight / 100);
  const diffAmount = targetAmount - evalValue;
  const rebalanceQty =
    stock.currentPrice > 0
      ? Math.floor(Math.abs(diffAmount) / (stock.currentPrice * rate))
      : 0;

  return { targetAmount, diffAmount, rebalanceQty };
}

// 포트폴리오 전체 요약 계산
export function calculatePortfolioSummary(
  stocks: StockData[],
  cash: CashData[],
  exchangeRate: number
): PortfolioSummary {
  const markets: Record<string, MarketSummary> = {};
  const sectors: Record<string, number> = {};

  let totalValue = 0;
  let totalCost = 0;

  // 시장별 초기화
  ['KR', 'US', 'CRYPTO'].forEach((market) => {
    markets[market] = {
      stockValue: 0,
      costBasis: 0,
      cashValue: 0,
      totalValue: 0,
      profitLoss: 0,
      profitPct: 0,
    };
  });

  // 주식 계산
  stocks.forEach((stock) => {
    const calc = calculateStockValue(stock, exchangeRate);
    const market = stock.market;

    markets[market].stockValue += calc.evalValue;
    markets[market].costBasis += calc.costBasis;
    totalValue += calc.evalValue;
    totalCost += calc.costBasis;

    // 섹터별 집계
    sectors[stock.sector] = (sectors[stock.sector] || 0) + calc.evalValue;
  });

  // 현금 계산
  cash.forEach((c) => {
    const rate = getExchangeRate(c.market, exchangeRate);
    const cashValue = c.amount * rate;
    markets[c.market].cashValue = cashValue;
    totalValue += cashValue;
  });

  // 시장별 총계 및 손익률 계산
  Object.keys(markets).forEach((market) => {
    const m = markets[market];
    m.totalValue = m.stockValue + m.cashValue;
    m.profitLoss = m.stockValue - m.costBasis;
    m.profitPct = m.costBasis > 0 ? (m.profitLoss / m.costBasis) * 100 : 0;
  });

  // 총 손익 = 각 시장별 손익의 합 (현금 제외)
  const totalProfit = Object.values(markets).reduce((sum, m) => sum + m.profitLoss, 0);
  const totalProfitPct = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

  return {
    totalValue,
    totalCost,
    totalProfit,
    totalProfitPct,
    markets,
    sectors,
  };
}
