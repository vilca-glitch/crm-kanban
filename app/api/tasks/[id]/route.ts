import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';

// GET /api/tasks/[id] - Get single task
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = readDB();
  const task = db.tasks.find(t => t.id === id);

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  return NextResponse.json(task);
}

// PATCH /api/tasks/[id] - Update task
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const db = readDB();

    const taskIndex = db.tasks.findIndex(t => t.id === id);
    if (taskIndex === -1) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Update only provided fields
    const updatedTask = {
      ...db.tasks[taskIndex],
      ...body,
      id: db.tasks[taskIndex].id, // Prevent id override
      createdAt: db.tasks[taskIndex].createdAt, // Prevent createdAt override
    };

    db.tasks[taskIndex] = updatedTask;
    writeDB(db);

    return NextResponse.json({ success: true, task: updatedTask });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

// DELETE /api/tasks/[id] - Delete task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = readDB();

  const taskIndex = db.tasks.findIndex(t => t.id === id);
  if (taskIndex === -1) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  db.tasks.splice(taskIndex, 1);
  writeDB(db);

  return NextResponse.json({ success: true });
}
