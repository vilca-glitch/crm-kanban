import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/stages/[id] - Get single stage
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const stage = await prisma.stage.findUnique({
    where: { id },
  });

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

    const updatedStage = await prisma.stage.update({
      where: { id },
      data: {
        name: body.name !== undefined ? body.name : undefined,
        color: body.color !== undefined ? body.color : undefined,
        order: body.order !== undefined ? body.order : undefined,
      },
    });

    return NextResponse.json({ success: true, stage: updatedStage });
  } catch {
    return NextResponse.json({ error: 'Stage not found' }, { status: 404 });
  }
}

// DELETE /api/stages/[id] - Delete stage
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Check if stage has tasks
  const tasksInStage = await prisma.task.count({
    where: { stageId: id },
  });

  if (tasksInStage > 0) {
    return NextResponse.json(
      { error: 'Cannot delete stage with tasks. Move or delete tasks first.' },
      { status: 400 }
    );
  }

  try {
    await prisma.stage.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Stage not found' }, { status: 404 });
  }
}
