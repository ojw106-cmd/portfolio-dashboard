export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

interface EarningsDate {
  symbol: string;
  name: string;
  market: string;
  earningsDate: string | null;
  estimatedEPS: number | null;
}

// 캐시 (1시간)
let earningsCache: { data: EarningsDate[]; timestamp: number } | null = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function POST(request: Request) {
  try {
    const { stocks } = await request.json();
    
    if (!stocks || !Array.isArray(stocks)) {
      return NextResponse.json({ error: 'Invalid stocks array' }, { status: 400 });
    }

    // 캐시 확인
    if (earningsCache && Date.now() - earningsCache.timestamp < CACHE_TTL) {
      // 캐시된 종목과 요청 종목 비교
      const cachedSymbols = new Set(earningsCache.data.map(e => e.symbol));
      const requestSymbols = stocks.map((s: { code: string; market: string }) => 
        s.market === 'KR' ? `${s.code}.KS` : s.code
      );
      
      if (requestSymbols.every((sym: string) => cachedSymbols.has(sym))) {
        return NextResponse.json(earningsCache.data);
      }
    }

    const results: EarningsDate[] = [];
    
    for (const stock of stocks) {
      const symbol = stock.market === 'KR' ? `${stock.code}.KS` : stock.code;
      
      try {
        // Yahoo Finance에서 실적발표일 가져오기
        const response = await fetch(
          `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=calendarEvents,earnings`,
          {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          const calendarEvents = data?.quoteSummary?.result?.[0]?.calendarEvents;
          const earnings = calendarEvents?.earnings;
          
          let earningsDate: string | null = null;
          let estimatedEPS: number | null = null;
          
          if (earnings?.earningsDate && earnings.earningsDate.length > 0) {
            // Unix timestamp to date string
            const timestamp = earnings.earningsDate[0].raw;
            earningsDate = new Date(timestamp * 1000).toISOString().split('T')[0];
          }
          
          if (earnings?.earningsAverage?.raw) {
            estimatedEPS = earnings.earningsAverage.raw;
          }
          
          results.push({
            symbol,
            name: stock.name,
            market: stock.market,
            earningsDate,
            estimatedEPS,
          });
        } else {
          results.push({
            symbol,
            name: stock.name,
            market: stock.market,
            earningsDate: null,
            estimatedEPS: null,
          });
        }
        
        // Rate limiting - 100ms delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Failed to fetch earnings for ${symbol}:`, error);
        results.push({
          symbol,
          name: stock.name,
          market: stock.market,
          earningsDate: null,
          estimatedEPS: null,
        });
      }
    }

    // 캐시 업데이트
    earningsCache = { data: results, timestamp: Date.now() };
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Earnings API error:', error);
    return NextResponse.json({ error: 'Failed to fetch earnings' }, { status: 500 });
  }
}
