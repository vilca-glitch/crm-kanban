import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/bot/activity - Get activity logs (newest first)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const activities = await prisma.botActivity.findMany({
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.botActivity.count();

    return NextResponse.json({
      activities,
      total,
      hasMore: offset + activities.length < total,
    });
  } catch (error) {
    console.error('Failed to fetch bot activity:', error);
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 });
  }
}

// POST /api/bot/activity - Log new activity
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userRequest, botAction, success = true, error } = body;

    if (!userRequest || !botAction) {
      return NextResponse.json(
        { error: 'userRequest and botAction are required' },
        { status: 400 }
      );
    }

    const activity = await prisma.botActivity.create({
      data: {
        userRequest,
        botAction,
        success,
        error: error || null,
      },
    });

    return NextResponse.json({ success: true, activity }, { status: 201 });
  } catch (error) {
    console.error('Failed to log bot activity:', error);
    return NextResponse.json({ error: 'Failed to log activity' }, { status: 500 });
  }
}
