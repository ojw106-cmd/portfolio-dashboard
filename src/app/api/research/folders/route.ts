export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/research/folders - 모든 폴더 조회
export async function GET() {
  try {
    const folders = await prisma.researchFolder.findMany({
      include: {
        stocks: {
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json(folders);
  } catch (error) {
    console.error('Failed to fetch folders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch folders' },
      { status: 500 }
    );
  }
}

// POST /api/research/folders - 폴더 생성
export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    const folder = await prisma.researchFolder.create({
      data: { name },
    });

    return NextResponse.json(folder);
  } catch (error) {
    console.error('Failed to create folder:', error);
    return NextResponse.json(
      { error: 'Failed to create folder' },
      { status: 500 }
    );
  }
}

// PATCH /api/research/folders?id=xxx - 폴더 이름 변경
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const { name } = await request.json();

    if (!id || !name) {
      return NextResponse.json(
        { error: 'id and name are required' },
        { status: 400 }
      );
    }

    const folder = await prisma.researchFolder.update({
      where: { id },
      data: { name },
    });

    return NextResponse.json(folder);
  } catch (error) {
    console.error('Failed to update folder:', error);
    return NextResponse.json(
      { error: 'Failed to update folder' },
      { status: 500 }
    );
  }
}

// DELETE /api/research/folders?id=xxx - 폴더 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    await prisma.researchFolder.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete folder:', error);
    return NextResponse.json(
      { error: 'Failed to delete folder' },
      { status: 500 }
    );
  }
}
