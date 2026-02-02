import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/accounts - 모든 계정 목록
export async function GET() {
  try {
    const accounts = await prisma.account.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json(accounts);
  } catch (error) {
    console.error('Failed to fetch accounts:', error);
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
  }
}

// POST /api/accounts - 새 계정 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accountId, name } = body;

    if (!accountId || !name) {
      return NextResponse.json({ error: 'accountId and name are required' }, { status: 400 });
    }

    // 중복 체크
    const existing = await prisma.account.findUnique({
      where: { accountId },
    });

    if (existing) {
      return NextResponse.json({ error: 'Account already exists' }, { status: 409 });
    }

    const account = await prisma.account.create({
      data: { accountId, name },
    });

    // 기본 현금 항목 생성
    await prisma.cashHolding.createMany({
      data: [
        { accountId: account.id, market: 'KR', amount: 0, targetWeight: 0 },
        { accountId: account.id, market: 'US', amount: 0, targetWeight: 0 },
        { accountId: account.id, market: 'CRYPTO', amount: 0, targetWeight: 0 },
      ],
    });

    // 기본 실현손익 항목 생성
    await prisma.realizedPnL.createMany({
      data: [
        { accountId: account.id, market: 'KR', amount: 0 },
        { accountId: account.id, market: 'US', amount: 0 },
      ],
    });

    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    console.error('Failed to create account:', error);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}
