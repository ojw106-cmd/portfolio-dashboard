export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/prices/exchange-rate - USD/KRW 환율
export async function GET() {
  try {
    // 먼저 캐시된 환율 확인
    const cached = await prisma.exchangeRate.findUnique({
      where: { currency: 'USD' },
    });

    // 캐시가 10분 이내면 반환
    if (cached && Date.now() - cached.updatedAt.getTime() < 10 * 60 * 1000) {
      return NextResponse.json({ rate: cached.rate, cached: true });
    }

    // 외부 API에서 환율 조회
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/KRW', {
        next: { revalidate: 600 },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.rates?.USD) {
          const rate = Math.round((1 / data.rates.USD) * 100) / 100;

          // 캐시 업데이트
          await prisma.exchangeRate.upsert({
            where: { currency: 'USD' },
            create: { currency: 'USD', rate },
            update: { rate },
          });

          return NextResponse.json({ rate, cached: false });
        }
      }
    } catch (e) {
      console.log('Exchange rate API failed:', e);
    }

    // API 실패 시 캐시된 값 또는 기본값 반환
    const rate = cached?.rate || 1350;
    return NextResponse.json({ rate, cached: true, fallback: true });
  } catch (error) {
    console.error('Failed to fetch exchange rate:', error);
    return NextResponse.json({ rate: 1350, error: 'Failed to fetch rate' });
  }
}
