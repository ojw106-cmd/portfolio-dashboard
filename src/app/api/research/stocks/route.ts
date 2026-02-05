import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/research/stocks - 모든 리서치 종목 조회
export async function GET() {
  try {
    const stocks = await prisma.researchStock.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json(stocks);
  } catch (error) {
    console.error('Failed to fetch stocks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stocks' },
      { status: 500 }
    );
  }
}

// POST /api/research/stocks - 종목 추가
export async function POST(request: NextRequest) {
  try {
    const { ticker, name, market, folderId } = await request.json();

    if (!ticker || !name || !market) {
      return NextResponse.json(
        { error: 'ticker, name, and market are required' },
        { status: 400 }
      );
    }

    const stock = await prisma.researchStock.create({
      data: {
        ticker,
        name,
        market,
        folderId: folderId || null,
      },
    });

    return NextResponse.json(stock);
  } catch (error) {
    console.error('Failed to create stock:', error);
    return NextResponse.json(
      { error: 'Failed to create stock' },
      { status: 500 }
    );
  }
}

// PATCH /api/research/stocks?id=xxx - 종목 수정 (content, folderId)
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const body = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const stock = await prisma.researchStock.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(stock);
  } catch (error) {
    console.error('Failed to update stock:', error);
    return NextResponse.json(
      { error: 'Failed to update stock' },
      { status: 500 }
    );
  }
}

// DELETE /api/research/stocks?id=xxx - 종목 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    await prisma.researchStock.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete stock:', error);
    return NextResponse.json(
      { error: 'Failed to delete stock' },
      { status: 500 }
    );
  }
}
