export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 기본 섹터 (최초 실행 시 자동 추가)
const DEFAULT_SECTORS = [
  { code: 'AI', name: 'AI/반도체', color: '#7c4dff', sortOrder: 1 },
  { code: 'BIGTECH', name: '빅테크', color: '#1e88e5', sortOrder: 2 },
  { code: 'ROBOT', name: '로봇', color: '#00bcd4', sortOrder: 3 },
  { code: 'BIO', name: '바이오', color: '#66bb6a', sortOrder: 4 },
  { code: 'POWER', name: '전력/에너지', color: '#ffa726', sortOrder: 5 },
  { code: 'OPTICAL', name: '광학', color: '#ec407a', sortOrder: 6 },
  { code: 'SPACE', name: '우주/항공', color: '#5c6bc0', sortOrder: 7 },
  { code: 'DEFENSE', name: '방산', color: '#78909c', sortOrder: 8 },
  { code: 'BATTERY', name: '2차전지', color: '#26c6da', sortOrder: 9 },
  { code: 'CRYPTO', name: '크립토', color: '#ffca28', sortOrder: 10 },
  { code: 'HEDGE', name: '헷지', color: '#9c27b0', sortOrder: 11 },
  { code: 'VENTURE', name: '벤처', color: '#ff7043', sortOrder: 12 },
  { code: 'ETC', name: '기타', color: '#8d6e63', sortOrder: 13 },
];

// GET: 모든 섹터 조회
export async function GET() {
  try {
    let sectors = await prisma.sector.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    // 섹터가 없으면 기본 섹터 생성
    if (sectors.length === 0) {
      await prisma.sector.createMany({
        data: DEFAULT_SECTORS,
      });
      sectors = await prisma.sector.findMany({
        orderBy: { sortOrder: 'asc' },
      });
    }

    return NextResponse.json(sectors);
  } catch (error) {
    console.error('Failed to fetch sectors:', error);
    return NextResponse.json({ error: 'Failed to fetch sectors' }, { status: 500 });
  }
}

// POST: 섹터 추가
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, name, color } = body;

    if (!code || !name) {
      return NextResponse.json({ error: 'Code and name are required' }, { status: 400 });
    }

    // 마지막 정렬 순서 조회
    const lastSector = await prisma.sector.findFirst({
      orderBy: { sortOrder: 'desc' },
    });
    const sortOrder = (lastSector?.sortOrder || 0) + 1;

    const sector = await prisma.sector.create({
      data: {
        code: code.toUpperCase(),
        name,
        color: color || '#9e9e9e',
        sortOrder,
      },
    });

    return NextResponse.json(sector);
  } catch (error) {
    console.error('Failed to create sector:', error);
    return NextResponse.json({ error: 'Failed to create sector' }, { status: 500 });
  }
}

// PUT: 섹터 수정
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, code, name, color, sortOrder } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const sector = await prisma.sector.update({
      where: { id },
      data: {
        ...(code && { code: code.toUpperCase() }),
        ...(name && { name }),
        ...(color && { color }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    });

    return NextResponse.json(sector);
  } catch (error) {
    console.error('Failed to update sector:', error);
    return NextResponse.json({ error: 'Failed to update sector' }, { status: 500 });
  }
}

// DELETE: 섹터 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await prisma.sector.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete sector:', error);
    return NextResponse.json({ error: 'Failed to delete sector' }, { status: 500 });
  }
}
