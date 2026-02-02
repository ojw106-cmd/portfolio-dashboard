// 계정
export interface Account {
  id: string;
  accountId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

// 주식
export interface Stock {
  id: string;
  accountId: string;
  market: string;
  sector: string;
  code: string;
  name: string;
  targetWeight: number;
  buyPrice: number;
  currentPrice: number;
  holdingQty: number;
  memo: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// 현금 보유
export interface CashHolding {
  id: string;
  accountId: string;
  market: string;
  amount: number;
  targetWeight: number;
  memo: string | null;
  updatedAt: Date;
}

// 거래
export interface Trade {
  id: string;
  accountId: string;
  date: Date;
  type: 'buy' | 'sell' | 'deposit' | 'withdraw' | 'exchange';
  market?: string | null;
  code?: string | null;
  name?: string | null;
  price?: number | null;
  qty?: number | null;
  amount?: number | null;
  pnl?: number | null;
  buyPrice?: number | null;
  direction?: string | null;
  fromAmount?: number | null;
  toAmount?: number | null;
  rate?: number | null;
  createdAt: Date;
}

// 실현손익
export interface RealizedPnL {
  id: string;
  accountId: string;
  market: string;
  amount: number;
  updatedAt: Date;
}

// 매매일지
export interface JournalEntry {
  id: string;
  date: string;
  content: string;
  updatedAt: Date;
}

// 환율
export interface ExchangeRate {
  id: string;
  currency: string;
  rate: number;
  updatedAt: Date;
}

// API 응답 타입
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// 포트폴리오 계정 상세 데이터
export interface AccountDetail extends Account {
  portfolio: Stock[];
  cashHoldings: CashHolding[];
  realizedPnL: RealizedPnL[];
}

// 검색 결과
export interface SearchResult {
  code: string;
  name: string;
  market: string;
}

// 시세 응답
export interface PriceResponse {
  price: number | null;
  error?: string;
}
