import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/snapshots - 스냅샷 목록 조회
export async function GET() {
  try {
    const snapshots = await prisma.snapshot.findMany({
      orderBy: { date: 'desc' },
      take: 50, // 최근 50개만
    });

    return NextResponse.json(snapshots);
  } catch (error) {
    console.error('Failed to fetch snapshots:', error);
    return NextResponse.json({ error: 'Failed to fetch snapshots' }, { status: 500 });
  }
}

// POST /api/snapshots - 새 스냅샷 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      totalAsset,
      jinwonAsset,
      dadAsset,
      lionAsset,
      exchangeRate,
      memo,
    } = body;

    // 이전 스냅샷 조회
    const lastSnapshot = await prisma.snapshot.findFirst({
      orderBy: { date: 'desc' },
    });

    // 변화량 계산
    const totalAssetChange = lastSnapshot ? totalAsset - lastSnapshot.totalAsset : 0;
    const jinwonChange = lastSnapshot ? jinwonAsset - lastSnapshot.jinwonAsset : 0;
    const dadChange = lastSnapshot ? dadAsset - lastSnapshot.dadAsset : 0;
    const lionChange = lastSnapshot ? lionAsset - lastSnapshot.lionAsset : 0;

    // 스냅샷 생성
    const snapshot = await prisma.snapshot.create({
      data: {
        totalAsset,
        totalAssetChange,
        jinwonAsset,
        jinwonChange,
        dadAsset,
        dadChange,
        lionAsset,
        lionChange,
        exchangeRate: exchangeRate || 1400,
        memo,
      },
    });

    return NextResponse.json(snapshot, { status: 201 });
  } catch (error) {
    console.error('Failed to create snapshot:', error);
    return NextResponse.json({ error: 'Failed to create snapshot' }, { status: 500 });
  }
}

// DELETE /api/snapshots - 스냅샷 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    await prisma.snapshot.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete snapshot:', error);
    return NextResponse.json({ error: 'Failed to delete snapshot' }, { status: 500 });
  }
}
