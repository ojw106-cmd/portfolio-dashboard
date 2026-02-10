export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/portfolio?accountId=xxx - 포트폴리오 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json({ error: 'accountId is required' }, { status: 400 });
    }

    const account = await prisma.account.findUnique({
      where: { accountId },
    });

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const stocks = await prisma.stock.findMany({
      where: { accountId: account.id },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(stocks);
  } catch (error) {
    console.error('Failed to fetch portfolio:', error);
    return NextResponse.json({ error: 'Failed to fetch portfolio' }, { status: 500 });
  }
}

// POST /api/portfolio - 종목 추가
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      accountId,
      market,
      sector,
      code,
      name,
      targetWeight = 0,
      buyPrice = 0,
      currentPrice = 0,
      holdingQty = 0,
      memo = null,
    } = body;

    if (!accountId || !market || !sector || !code || !name) {
      return NextResponse.json(
        { error: 'accountId, market, sector, code, name are required' },
        { status: 400 }
      );
    }

    const account = await prisma.account.findUnique({
      where: { accountId },
    });

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // 기존 종목 확인
    const existing = await prisma.stock.findUnique({
      where: {
        accountId_code_market: {
          accountId: account.id,
          code,
          market,
        },
      },
    });

    if (existing) {
      // 기존 종목이 있으면 평균매수가 계산 후 업데이트
      const totalCost = existing.buyPrice * existing.holdingQty + buyPrice * holdingQty;
      const totalQty = existing.holdingQty + holdingQty;
      const avgBuyPrice = totalQty > 0 ? totalCost / totalQty : buyPrice;

      const updated = await prisma.stock.update({
        where: { id: existing.id },
        data: {
          buyPrice: avgBuyPrice,
          holdingQty: totalQty,
          currentPrice: currentPrice || existing.currentPrice,
        },
      });

      return NextResponse.json(updated);
    }

    // 새 종목 추가
    const stock = await prisma.stock.create({
      data: {
        accountId: account.id,
        market,
        sector,
        code,
        name,
        targetWeight,
        buyPrice,
        currentPrice,
        holdingQty,
        memo,
      },
    });

    return NextResponse.json(stock, { status: 201 });
  } catch (error) {
    console.error('Failed to add stock:', error);
    return NextResponse.json({ error: 'Failed to add stock' }, { status: 500 });
  }
}
