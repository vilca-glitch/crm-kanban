import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';

// GET /api/stages/[id] - Get single stage
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = readDB();
  const stage = db.stages.find(s => s.id === id);

  if (!stage) {
    return NextResponse.json({ error: 'Stage not found' }, { status: 404 });
  }

  return NextResponse.json(stage);
}

// PATCH /api/stages/[id] - Update stage
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const db = readDB();

    const stageIndex = db.stages.findIndex(s => s.id === id);
    if (stageIndex === -1) {
      return NextResponse.json({ error: 'Stage not found' }, { status: 404 });
    }

    // Update only provided fields
    const updatedStage = {
      ...db.stages[stageIndex],
      ...body,
      id: db.stages[stageIndex].id, // Prevent id override
    };

    db.stages[stageIndex] = updatedStage;
    writeDB(db);

    return NextResponse.json({ success: true, stage: updatedStage });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

// DELETE /api/stages/[id] - Delete stage
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = readDB();

  const stageIndex = db.stages.findIndex(s => s.id === id);
  if (stageIndex === -1) {
    return NextResponse.json({ error: 'Stage not found' }, { status: 404 });
  }

  // Check if stage has tasks
  const tasksInStage = db.tasks.filter(t => t.stageId === id);
  if (tasksInStage.length > 0) {
    return NextResponse.json(
      { error: 'Cannot delete stage with tasks. Move or delete tasks first.' },
      { status: 400 }
    );
  }

  db.stages.splice(stageIndex, 1);
  writeDB(db);

  return NextResponse.json({ success: true });
}
