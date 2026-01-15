import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/tasks - Get all tasks with optional filters
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const where: Record<string, unknown> = {};

  // Filter by client
  const client = searchParams.get('client');
  if (client) {
    where.client = { equals: client, mode: 'insensitive' };
  }

  // Filter by priority
  const priority = searchParams.get('priority');
  if (priority) {
    where.priority = priority;
  }

  // Filter by stageId
  const stageId = searchParams.get('stageId');
  if (stageId) {
    where.stageId = stageId;
  }

  // Search in title
  const search = searchParams.get('search');
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { checklist: { some: { text: { contains: search, mode: 'insensitive' } } } },
    ];
  }

  const tasks = await prisma.task.findMany({
    where,
    include: { checklist: true },
    orderBy: { order: 'asc' },
  });

  return NextResponse.json(tasks);
}

// POST /api/tasks - Create new task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Get max order for the stage
    const maxOrderTask = await prisma.task.findFirst({
      where: { stageId: body.stageId || 'todo' },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    const nextOrder = (maxOrderTask?.order ?? -1) + 1;

    // First verify the stage exists, create default if not
    let stage = await prisma.stage.findUnique({
      where: { id: body.stageId || 'todo' },
    });

    if (!stage) {
      // Create default stages if they don't exist
      const defaultStages = [
        { id: 'todo', name: 'To Do', order: 0, color: '#6B7280' },
        { id: 'in-progress', name: 'In Progress', order: 1, color: '#3B82F6' },
        { id: 'complete', name: 'Complete', order: 2, color: '#10B981' },
      ];

      for (const s of defaultStages) {
        await prisma.stage.upsert({
          where: { id: s.id },
          update: {},
          create: s,
        });
      }

      stage = await prisma.stage.findUnique({
        where: { id: body.stageId || 'todo' },
      });
    }

    const newTask = await prisma.task.create({
      data: {
        title: body.title || 'Untitled Task',
        client: body.client || '',
        priority: body.priority || 'medium',
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        remindMeInHours: body.remindMeInHours || null,
        reminderSent: false,
        stageId: body.stageId || 'todo',
        order: nextOrder,
        checklist: {
          create: (body.checklist || []).map((item: { text: string; completed?: boolean }) => ({
            text: item.text,
            completed: item.completed || false,
          })),
        },
      },
      include: { checklist: true },
    });

    return NextResponse.json({ success: true, task: newTask }, { status: 201 });
  } catch (error) {
    console.error('Failed to create task:', error);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
