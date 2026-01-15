import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';
import { Stage } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

// GET /api/stages - Get all stages
export async function GET() {
  const db = readDB();
  const stages = db.stages.sort((a, b) => a.order - b.order);
  return NextResponse.json(stages);
}

// POST /api/stages - Create new stage
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const db = readDB();

    // Get max order
    const maxOrder = db.stages.length > 0
      ? Math.max(...db.stages.map(s => s.order)) + 1
      : 0;

    const newStage: Stage = {
      id: `stage-${uuidv4()}`,
      name: body.name || 'New Stage',
      order: maxOrder,
      color: body.color || '#6B7280',
    };

    db.stages.push(newStage);
    writeDB(db);

    return NextResponse.json({ success: true, stage: newStage }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
