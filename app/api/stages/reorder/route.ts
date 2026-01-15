import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PUT /api/stages/reorder - Reorder stages
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { stageIds } = body;

    if (!Array.isArray(stageIds)) {
      return NextResponse.json({ error: 'stageIds must be an array' }, { status: 400 });
    }

    // Update order based on position in array
    await Promise.all(
      stageIds.map((stageId: string, index: number) =>
        prisma.stage.update({
          where: { id: stageId },
          data: { order: index },
        })
      )
    );

    const stages = await prisma.stage.findMany({
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({ success: true, stages });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
