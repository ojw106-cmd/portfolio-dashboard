import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// DELETE /api/trades/[tradeId] - 거래 기록 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tradeId: string }> }
) {
  try {
    const { tradeId } = await params;

    const trade = await prisma.trade.findUnique({
      where: { id: tradeId },
    });

    if (!trade) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 });
    }

    // 매도 거래였다면 실현손익 되돌리기
    if (trade.type === 'sell' && trade.pnl !== null) {
      await prisma.realizedPnL.update({
        where: {
          accountId_market: { accountId: trade.accountId, market: trade.market! },
        },
        data: {
          amount: { decrement: trade.pnl },
        },
      });
    }

    // 거래 삭제
    await prisma.trade.delete({
      where: { id: tradeId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete trade:', error);
    return NextResponse.json({ error: 'Failed to delete trade' }, { status: 500 });
  }
}
