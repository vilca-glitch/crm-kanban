import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH /api/tasks/[id]/checklist/[itemId] - Update checklist item
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await params;
    const body = await request.json();

    // Verify task exists
    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Update the checklist item
    const updatedItem = await prisma.checklistItem.update({
      where: { id: itemId },
      data: {
        completed: body.completed !== undefined ? body.completed : undefined,
        text: body.text !== undefined ? body.text : undefined,
      },
    });

    return NextResponse.json({ success: true, item: updatedItem });
  } catch {
    return NextResponse.json({ error: 'Checklist item not found' }, { status: 404 });
  }
}

// DELETE /api/tasks/[id]/checklist/[itemId] - Delete checklist item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await params;

    // Verify task exists
    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    await prisma.checklistItem.delete({
      where: { id: itemId },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Checklist item not found' }, { status: 404 });
  }
}
