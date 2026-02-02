import { NextRequest, NextResponse } from 'next/server';
import { COINGECKO_IDS } from '@/lib/constants';

// GET /api/prices/crypto/[symbol] - 암호화폐 시세
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;

  try {
    const coinId = COINGECKO_IDS[symbol.toUpperCase()] || symbol.toLowerCase();

    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=krw`,
      {
        headers: {
          Accept: 'application/json',
        },
        next: { revalidate: 60 },
      }
    );

    if (response.ok) {
      const data = await response.json();
      if (data[coinId]?.krw) {
        return NextResponse.json({ price: data[coinId].krw });
      }
    }

    return NextResponse.json({ price: null, error: 'Price not found' });
  } catch (error) {
    console.error('Failed to fetch crypto price:', error);
    return NextResponse.json({ price: null, error: 'Failed to fetch price' }, { status: 500 });
  }
}
