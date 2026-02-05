import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/research - 모든 리서치 노트 조회
export async function GET() {
  try {
    const notes = await prisma.researchNote.findMany({
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error('Failed to fetch research notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch research notes' },
      { status: 500 }
    );
  }
}

// POST /api/research - 리서치 노트 저장
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { stockId, ticker, content } = body;

    if (!stockId || !ticker) {
      return NextResponse.json(
        { error: 'stockId and ticker are required' },
        { status: 400 }
      );
    }

    const note = await prisma.researchNote.upsert({
      where: { stockId },
      create: {
        stockId,
        ticker,
        content: content || '',
      },
      update: {
        content: content || '',
      },
    });

    return NextResponse.json(note);
  } catch (error) {
    console.error('Failed to save research note:', error);
    return NextResponse.json(
      { error: 'Failed to save research note' },
      { status: 500 }
    );
  }
}
