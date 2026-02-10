export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/portfolio/all-stocks - 모든 보유 종목 조회 (중복 제거)
export async function GET() {
  try {
    const stocks = await prisma.stock.findMany({
      select: {
        code: true,
        name: true,
        market: true,
      },
      distinct: ['code', 'market'],
    });

    // stockId 형식으로 변환
    const allStocks = stocks.map((stock) => ({
      stockId: `${stock.code}-${stock.market}`,
      ticker: stock.code,
      name: stock.name,
    }));

    return NextResponse.json(allStocks);
  } catch (error) {
    console.error('Failed to fetch all stocks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stocks' },
      { status: 500 }
    );
  }
}
