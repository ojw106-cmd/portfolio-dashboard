export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/journal?year=xxx&month=xxx - 매매일지 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    let entries;

    if (year && month) {
      // 특정 월의 일지 조회
      const prefix = `${year}-${month.padStart(2, '0')}`;
      entries = await prisma.journalEntry.findMany({
        where: {
          date: {
            startsWith: prefix,
          },
        },
        orderBy: { date: 'asc' },
      });
    } else {
      // 전체 일지 조회
      entries = await prisma.journalEntry.findMany({
        orderBy: { date: 'desc' },
        take: 100,
      });
    }

    // 객체 형태로 변환 { date: { content, important } }
    const journalData: Record<string, { content: string; important: boolean }> = {};
    entries.forEach((entry) => {
      journalData[entry.date] = {
        content: entry.content,
        important: entry.important,
      };
    });

    return NextResponse.json(journalData);
  } catch (error) {
    console.error('Failed to fetch journal:', error);
    return NextResponse.json({ error: 'Failed to fetch journal' }, { status: 500 });
  }
}

// POST /api/journal - 일지 저장
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, content, important } = body;

    if (!date) {
      return NextResponse.json({ error: 'date is required' }, { status: 400 });
    }

    if ((!content || content.trim() === '') && important === undefined) {
      // 내용이 비어있고 중요 표시도 없으면 삭제
      await prisma.journalEntry.delete({
        where: { date },
      }).catch(() => null);

      return NextResponse.json({ success: true, deleted: true });
    }

    const entry = await prisma.journalEntry.upsert({
      where: { date },
      create: {
        date,
        content: content || '',
        important: important ?? false,
      },
      update: {
        ...(content !== undefined && { content }),
        ...(important !== undefined && { important }),
      },
    });

    return NextResponse.json(entry);
  } catch (error) {
    console.error('Failed to save journal:', error);
    return NextResponse.json({ error: 'Failed to save journal' }, { status: 500 });
  }
}
