import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';

// PATCH /api/tasks/[id]/checklist/[itemId] - Update checklist item
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await params;
    const body = await request.json();
    const db = readDB();

    const taskIndex = db.tasks.findIndex(t => t.id === id);
    if (taskIndex === -1) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const task = db.tasks[taskIndex];
    const itemIndex = task.checklist.findIndex(item => item.id === itemId);
    if (itemIndex === -1) {
      return NextResponse.json({ error: 'Checklist item not found' }, { status: 404 });
    }

    // Update the checklist item
    task.checklist[itemIndex] = {
      ...task.checklist[itemIndex],
      ...body,
      id: task.checklist[itemIndex].id, // Prevent id override
    };

    db.tasks[taskIndex] = task;
    writeDB(db);

    return NextResponse.json({ success: true, item: task.checklist[itemIndex] });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

// DELETE /api/tasks/[id]/checklist/[itemId] - Delete checklist item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { id, itemId } = await params;
  const db = readDB();

  const taskIndex = db.tasks.findIndex(t => t.id === id);
  if (taskIndex === -1) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  const task = db.tasks[taskIndex];
  const itemIndex = task.checklist.findIndex(item => item.id === itemId);
  if (itemIndex === -1) {
    return NextResponse.json({ error: 'Checklist item not found' }, { status: 404 });
  }

  task.checklist.splice(itemIndex, 1);
  db.tasks[taskIndex] = task;
  writeDB(db);

  return NextResponse.json({ success: true });
}
