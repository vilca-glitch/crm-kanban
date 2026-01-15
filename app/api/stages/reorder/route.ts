import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';

// PUT /api/stages/reorder - Reorder stages
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { stageIds } = body;

    if (!Array.isArray(stageIds)) {
      return NextResponse.json({ error: 'stageIds must be an array' }, { status: 400 });
    }

    const db = readDB();

    // Update order based on position in array
    stageIds.forEach((stageId: string, index: number) => {
      const stage = db.stages.find(s => s.id === stageId);
      if (stage) {
        stage.order = index;
      }
    });

    writeDB(db);

    return NextResponse.json({ success: true, stages: db.stages.sort((a, b) => a.order - b.order) });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
