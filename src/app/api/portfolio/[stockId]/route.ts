import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/portfolio/[stockId] - 종목 상세
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ stockId: string }> }
) {
  try {
    const { stockId } = await params;

    const stock = await prisma.stock.findUnique({
      where: { id: stockId },
    });

    if (!stock) {
      return NextResponse.json({ error: 'Stock not found' }, { status: 404 });
    }

    return NextResponse.json(stock);
  } catch (error) {
    console.error('Failed to fetch stock:', error);
    return NextResponse.json({ error: 'Failed to fetch stock' }, { status: 500 });
  }
}

// PUT /api/portfolio/[stockId] - 종목 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ stockId: string }> }
) {
  try {
    const { stockId } = await params;
    const body = await request.json();

    const {
      targetWeight,
      buyPrice,
      currentPrice,
      holdingQty,
      memo,
      sector,
    } = body;

    const updateData: Record<string, unknown> = {};
    if (targetWeight !== undefined) updateData.targetWeight = targetWeight;
    if (buyPrice !== undefined) updateData.buyPrice = buyPrice;
    if (currentPrice !== undefined) updateData.currentPrice = currentPrice;
    if (holdingQty !== undefined) updateData.holdingQty = holdingQty;
    if (memo !== undefined) updateData.memo = memo;
    if (sector !== undefined) updateData.sector = sector;

    const stock = await prisma.stock.update({
      where: { id: stockId },
      data: updateData,
    });

    return NextResponse.json(stock);
  } catch (error) {
    console.error('Failed to update stock:', error);
    return NextResponse.json({ error: 'Failed to update stock' }, { status: 500 });
  }
}

// DELETE /api/portfolio/[stockId] - 종목 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ stockId: string }> }
) {
  try {
    const { stockId } = await params;

    await prisma.stock.delete({
      where: { id: stockId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete stock:', error);
    return NextResponse.json({ error: 'Failed to delete stock' }, { status: 500 });
  }
}
