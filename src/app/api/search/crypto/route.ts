export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { CRYPTO_SYMBOLS } from '@/lib/constants';

// GET /api/search/crypto?q=xxx - 암호화폐 검색
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.toLowerCase() || '';

    if (query.length < 1) {
      return NextResponse.json([]);
    }

    const results: { code: string; name: string; market: string }[] = [];
    const seen = new Set<string>();

    for (const [symbol, name] of Object.entries(CRYPTO_SYMBOLS)) {
      if (
        symbol.toLowerCase().includes(query) ||
        name.toLowerCase().includes(query)
      ) {
        if (!seen.has(symbol)) {
          results.push({
            code: symbol,
            name: `${name} (${symbol})`,
            market: 'CRYPTO',
          });
          seen.add(symbol);
        }
      }
      if (results.length >= 10) break;
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Failed to search crypto:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
