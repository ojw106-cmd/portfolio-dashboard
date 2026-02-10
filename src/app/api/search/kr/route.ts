export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { KR_STOCKS } from '@/lib/constants';

interface NaverAutoCompleteItem {
  code: string;
  name: string;
  market: string;
  type: string;
}

// GET /api/search/kr?q=xxx - 한국 주식 검색
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim() || '';

    if (query.length < 1) {
      return NextResponse.json([]);
    }

    // 네이버 금융 자동완성 API 호출
    try {
      const naverUrl = `https://ac.finance.naver.com/ac?q=${encodeURIComponent(query)}&q_enc=utf-8&st=111&frm=stock&r_format=json&r_enc=utf-8&r_unicode=0&t_koreng=1&r_lt=111`;

      const response = await fetch(naverUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();

        // 네이버 API 응답 파싱 - items 배열에서 주식 정보 추출
        // 응답 형식: { items: [[ [name, code, market, ...], ... ]] }
        if (data.items && data.items[0]) {
          const results: NaverAutoCompleteItem[] = [];

          for (const item of data.items[0]) {
            if (item && item.length >= 2) {
              const name = item[0];
              const code = item[1];
              // 코스피/코스닥 종목만 필터링 (ETF, 선물 등 제외)
              if (code && /^\d{6}$/.test(code)) {
                results.push({
                  code,
                  name,
                  market: 'KR',
                  type: 'stock',
                });
              }
            }
            if (results.length >= 10) break;
          }

          if (results.length > 0) {
            return NextResponse.json(results);
          }
        }
      }
    } catch (apiError) {
      console.error('Naver API failed, falling back to local:', apiError);
    }

    // 로컬 DB 폴백
    const results: { code: string; name: string; market: string }[] = [];
    const lowerQuery = query.toLowerCase();

    for (const [name, code] of Object.entries(KR_STOCKS)) {
      if (name.toLowerCase().includes(lowerQuery) || code.includes(query)) {
        results.push({ code, name, market: 'KR' });
      }
      if (results.length >= 10) break;
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Failed to search KR stocks:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
