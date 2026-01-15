import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/tasks/[id] - Get single task
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const task = await prisma.task.findUnique({
    where: { id },
    include: { checklist: true },
  });

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

    // Check if task exists
    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: { checklist: true },
    });

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (body.title !== undefined) updateData.title = body.title;
    if (body.client !== undefined) updateData.client = body.client;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.stageId !== undefined) updateData.stageId = body.stageId;
    if (body.order !== undefined) updateData.order = body.order;
    if (body.dueDate !== undefined) {
      updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;
      // Reset reminder when deadline changes
      updateData.reminderSent = false;
    }
    if (body.remindMeInHours !== undefined) {
      updateData.remindMeInHours = body.remindMeInHours;
      // Reset reminder when reminder setting changes
      updateData.reminderSent = false;
    }
    if (body.reminderSent !== undefined) {
      updateData.reminderSent = body.reminderSent;
    }

    // Handle checklist update if provided
    if (body.checklist !== undefined) {
      // Delete existing checklist items
      await prisma.checklistItem.deleteMany({
        where: { taskId: id },
      });

      // Create new checklist items
      await prisma.checklistItem.createMany({
        data: body.checklist.map((item: { text: string; completed?: boolean; id?: string }) => ({
          id: item.id || undefined,
          text: item.text,
          completed: item.completed || false,
          taskId: id,
        })),
      });
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
      include: { checklist: true },
    });

    return NextResponse.json({ success: true, task: updatedTask });
  } catch (error) {
    console.error('Failed to update task:', error);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

// DELETE /api/tasks/[id] - Delete task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await prisma.task.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }
}
