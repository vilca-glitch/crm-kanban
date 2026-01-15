import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/stages - Get all stages
export async function GET() {
  let stages = await prisma.stage.findMany({
    orderBy: { order: 'asc' },
  });

  // If no stages exist, create defaults
  if (stages.length === 0) {
    const defaultStages = [
      { id: 'todo', name: 'To Do', order: 0, color: '#6B7280' },
      { id: 'in-progress', name: 'In Progress', order: 1, color: '#3B82F6' },
      { id: 'complete', name: 'Complete', order: 2, color: '#10B981' },
    ];

    for (const stage of defaultStages) {
      await prisma.stage.create({ data: stage });
    }

    stages = await prisma.stage.findMany({
      orderBy: { order: 'asc' },
    });
  }

  return NextResponse.json(stages);
}

// POST /api/stages - Create new stage
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Get max order
    const maxOrderStage = await prisma.stage.findFirst({
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    const nextOrder = (maxOrderStage?.order ?? -1) + 1;

    const newStage = await prisma.stage.create({
      data: {
        name: body.name || 'New Stage',
        order: nextOrder,
        color: body.color || '#6B7280',
      },
    });

    return NextResponse.json({ success: true, stage: newStage }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
