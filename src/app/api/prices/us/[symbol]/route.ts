export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/prices/us/[symbol] - 미국 주식 시세
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;

  try {
    // 방법 1: Yahoo Finance Chart API
    try {
      const response = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          next: { revalidate: 60 },
        }
      );

      if (response.ok) {
        const data = await response.json();

        if (data.chart?.result?.[0]?.meta?.regularMarketPrice) {
          const price = parseFloat(data.chart.result[0].meta.regularMarketPrice);
          return NextResponse.json({ price });
        }

        if (data.chart?.result?.[0]?.indicators?.quote?.[0]?.close) {
          const closes = data.chart.result[0].indicators.quote[0].close;
          const lastPrice = closes.filter((p: number | null) => p !== null).pop();
          if (lastPrice) {
            return NextResponse.json({ price: parseFloat(lastPrice) });
          }
        }
      }
    } catch (e) {
      console.log('Yahoo chart API failed:', e);
    }

    // 방법 2: Yahoo Finance Quote API
    try {
      const response = await fetch(
        `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.quoteResponse?.result?.[0]?.regularMarketPrice) {
          const price = parseFloat(data.quoteResponse.result[0].regularMarketPrice);
          return NextResponse.json({ price });
        }
      }
    } catch (e) {
      console.log('Yahoo quote API failed:', e);
    }

    return NextResponse.json({ price: null, error: 'Price not found' });
  } catch (error) {
    console.error('Failed to fetch US price:', error);
    return NextResponse.json({ price: null, error: 'Failed to fetch price' }, { status: 500 });
  }
}
