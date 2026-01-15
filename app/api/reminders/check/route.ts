import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/reminders/check - Get tasks that need reminders sent
export async function GET() {
  try {
    const now = new Date();

    // Find tasks where:
    // 1. remindMeInHours is set (not null)
    // 2. reminderSent is false
    // 3. dueDate is set (not null)
    // 4. dueDate - remindMeInHours <= now (reminder time has passed)
    const tasks = await prisma.task.findMany({
      where: {
        remindMeInHours: { not: null },
        reminderSent: false,
        dueDate: { not: null },
      },
      include: { checklist: true },
    });

    // Filter tasks where reminder time has been reached
    const tasksNeedingReminders = tasks.filter((task) => {
      if (!task.dueDate || !task.remindMeInHours) return false;

      const dueDate = new Date(task.dueDate);
      const reminderTime = new Date(dueDate.getTime() - task.remindMeInHours * 60 * 60 * 1000);

      return now >= reminderTime;
    });

    // Calculate hours remaining for each task
    const tasksWithTimeRemaining = tasksNeedingReminders.map((task) => {
      const dueDate = new Date(task.dueDate!);
      const hoursRemaining = Math.max(0, Math.round((dueDate.getTime() - now.getTime()) / (60 * 60 * 1000)));

      return {
        ...task,
        hoursRemaining,
      };
    });

    return NextResponse.json({
      success: true,
      tasks: tasksWithTimeRemaining,
      count: tasksWithTimeRemaining.length,
    });
  } catch (error) {
    console.error('Failed to check reminders:', error);
    return NextResponse.json({ error: 'Failed to check reminders' }, { status: 500 });
  }
}

// POST /api/reminders/check - Mark a task's reminder as sent
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { taskId } = body;

    if (!taskId) {
      return NextResponse.json({ error: 'taskId is required' }, { status: 400 });
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { reminderSent: true },
    });

    return NextResponse.json({ success: true, task: updatedTask });
  } catch (error) {
    console.error('Failed to mark reminder as sent:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}
