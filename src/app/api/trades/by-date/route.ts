export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/trades/by-date?date=YYYY-MM-DD - 특정 날짜의 모든 계정 거래 내역 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json({ error: 'date is required' }, { status: 400 });
    }

    // 특정 날짜의 거래 (KST 기준 하루)
    const startOfDay = new Date(`${date}T00:00:00+09:00`);
    const endOfDay = new Date(`${date}T23:59:59+09:00`);

    const trades = await prisma.trade.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        account: {
          select: {
            accountId: true,
            name: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    // 계정별로 그룹화
    const groupedTrades: Record<string, {
      accountId: string;
      accountName: string;
      trades: typeof trades;
    }> = {};

    for (const trade of trades) {
      const accountId = trade.account.accountId;
      if (!groupedTrades[accountId]) {
        groupedTrades[accountId] = {
          accountId,
          accountName: trade.account.name,
          trades: [],
        };
      }
      groupedTrades[accountId].trades.push(trade);
    }

    return NextResponse.json(groupedTrades);
  } catch (error) {
    console.error('Failed to fetch trades by date:', error);
    return NextResponse.json({ error: 'Failed to fetch trades' }, { status: 500 });
  }
}
