import { NextRequest, NextResponse } from 'next/server';

// GET /api/prices/kr/[code] - 한국 주식 시세
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  try {
    // 방법 1: 네이버 모바일 API
    try {
      const response = await fetch(
        `https://m.stock.naver.com/api/stock/${code}/basic`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          next: { revalidate: 60 },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const priceFields = ['stockEndPrice', 'closePrice', 'now', 'currentPrice', 'price'];

        for (const field of priceFields) {
          if (data[field]) {
            const priceStr = String(data[field]).replace(/,/g, '');
            const price = parseFloat(priceStr);
            if (price > 0) {
              return NextResponse.json({ price: Math.round(price) });
            }
          }
        }
      }
    } catch (e) {
      console.log('Naver mobile API failed:', e);
    }

    // 방법 2: 네이버 실시간 API
    try {
      const response = await fetch(
        `https://polling.finance.naver.com/api/realtime/domestic/stock/${code}`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data?.datas?.[0]?.nv) {
          const price = parseInt(data.datas[0].nv, 10);
          if (price > 0) {
            return NextResponse.json({ price });
          }
        }
      }
    } catch (e) {
      console.log('Naver realtime API failed:', e);
    }

    return NextResponse.json({ price: null, error: 'Price not found' });
  } catch (error) {
    console.error('Failed to fetch KR price:', error);
    return NextResponse.json({ price: null, error: 'Failed to fetch price' }, { status: 500 });
  }
}
