import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/reminders/check - Get tasks that need reminders sent
export async function GET() {
  try {
    const now = new Date();

    // Find tasks where:
    // 1. remindMeInMinutes is set (not null)
    // 2. reminderSent is false
    // 3. dueDate is set (not null)
    // 4. dueDate - remindMeInMinutes <= now (reminder time has passed)
    const tasks = await prisma.task.findMany({
      where: {
        remindMeInMinutes: { not: null },
        reminderSent: false,
        dueDate: { not: null },
      },
      include: { checklist: true },
    });

    // Filter tasks where reminder time has been reached
    const tasksNeedingReminders = tasks.filter((task) => {
      if (!task.dueDate || !task.remindMeInMinutes) return false;

      const dueDate = new Date(task.dueDate);
      const reminderTime = new Date(dueDate.getTime() - task.remindMeInMinutes * 60 * 1000);

      return now >= reminderTime;
    });

    // Calculate time remaining for each task
    const tasksWithTimeRemaining = tasksNeedingReminders.map((task) => {
      const dueDate = new Date(task.dueDate!);
      const msRemaining = dueDate.getTime() - now.getTime();
      const minutesRemaining = Math.max(0, Math.round(msRemaining / (60 * 1000)));
      const hoursRemaining = Math.floor(minutesRemaining / 60);

      return {
        ...task,
        minutesRemaining,
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
