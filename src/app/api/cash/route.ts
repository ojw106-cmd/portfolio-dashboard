export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/cash?accountId=xxx - 현금 보유 현황
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

    const cashHoldings = await prisma.cashHolding.findMany({
      where: { accountId: account.id },
    });

    // 객체 형태로 변환
    const cash: Record<string, { amount: number; targetWeight: number; memo: string | null }> = {};
    cashHoldings.forEach((c) => {
      cash[c.market] = {
        amount: c.amount,
        targetWeight: c.targetWeight,
        memo: c.memo,
      };
    });

    return NextResponse.json(cash);
  } catch (error) {
    console.error('Failed to fetch cash:', error);
    return NextResponse.json({ error: 'Failed to fetch cash' }, { status: 500 });
  }
}

// PUT /api/cash - 현금 수정
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { accountId, market, amount, targetWeight, memo } = body;

    if (!accountId || !market) {
      return NextResponse.json({ error: 'accountId and market are required' }, { status: 400 });
    }

    const account = await prisma.account.findUnique({
      where: { accountId },
    });

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (amount !== undefined) updateData.amount = amount;
    if (targetWeight !== undefined) updateData.targetWeight = targetWeight;
    if (memo !== undefined) updateData.memo = memo;

    const cashHolding = await prisma.cashHolding.upsert({
      where: {
        accountId_market: { accountId: account.id, market },
      },
      create: {
        accountId: account.id,
        market,
        amount: amount || 0,
        targetWeight: targetWeight || 0,
        memo: memo || null,
      },
      update: updateData,
    });

    return NextResponse.json(cashHolding);
  } catch (error) {
    console.error('Failed to update cash:', error);
    return NextResponse.json({ error: 'Failed to update cash' }, { status: 500 });
  }
}
