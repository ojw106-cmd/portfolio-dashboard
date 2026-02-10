export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/search/us?q=xxx - 미국 주식 검색
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    if (query.length < 1) {
      return NextResponse.json([]);
    }

    const response = await fetch(
      `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json([]);
    }

    const data = await response.json();

    if (data.quotes) {
      const results = data.quotes
        .filter((q: { quoteType: string }) => q.quoteType === 'EQUITY' || q.quoteType === 'ETF')
        .slice(0, 10)
        .map((q: { symbol: string; shortname?: string; longname?: string }) => ({
          code: q.symbol,
          name: q.shortname || q.longname || q.symbol,
          market: 'US',
        }));

      return NextResponse.json(results);
    }

    return NextResponse.json([]);
  } catch (error) {
    console.error('Failed to search US stocks:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
