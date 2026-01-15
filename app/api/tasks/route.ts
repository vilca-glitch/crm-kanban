import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';
import { Task } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

// GET /api/tasks - Get all tasks with optional filters
export async function GET(request: NextRequest) {
  const db = readDB();
  const { searchParams } = new URL(request.url);

  let tasks = db.tasks;

  // Filter by client
  const client = searchParams.get('client');
  if (client) {
    tasks = tasks.filter(t => t.client.toLowerCase() === client.toLowerCase());
  }

  // Filter by priority
  const priority = searchParams.get('priority');
  if (priority) {
    tasks = tasks.filter(t => t.priority === priority);
  }

  // Filter by stageId
  const stageId = searchParams.get('stageId');
  if (stageId) {
    tasks = tasks.filter(t => t.stageId === stageId);
  }

  // Search in title and checklist
  const search = searchParams.get('search');
  if (search) {
    const searchLower = search.toLowerCase();
    tasks = tasks.filter(t =>
      t.title.toLowerCase().includes(searchLower) ||
      t.checklist.some(item => item.text.toLowerCase().includes(searchLower))
    );
  }

  return NextResponse.json(tasks);
}

// POST /api/tasks - Create new task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const db = readDB();

    // Get max order for the stage
    const stageTasks = db.tasks.filter(t => t.stageId === (body.stageId || 'todo'));
    const maxOrder = stageTasks.length > 0
      ? Math.max(...stageTasks.map(t => t.order)) + 1
      : 0;

    const newTask: Task = {
      id: `task-${uuidv4()}`,
      title: body.title || 'Untitled Task',
      client: body.client || '',
      checklist: (body.checklist || []).map((item: { text: string; completed?: boolean }) => ({
        id: `item-${uuidv4()}`,
        text: item.text,
        completed: item.completed || false,
      })),
      stageId: body.stageId || 'todo',
      priority: body.priority || 'medium',
      dueDate: body.dueDate || null,
      createdAt: new Date().toISOString(),
      order: maxOrder,
    };

    db.tasks.push(newTask);
    writeDB(db);

    return NextResponse.json({ success: true, task: newTask }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
