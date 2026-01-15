import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const STATUS_FILE = path.join(process.cwd(), 'bot', 'status.json');

interface BotStatus {
  connected: boolean;
  lastPing: string | null;
  error: string | null;
}

export async function GET() {
  try {
    if (!fs.existsSync(STATUS_FILE)) {
      return NextResponse.json({
        connected: false,
        lastPing: null,
        error: 'Status file not found. Bot may not have started yet.',
      });
    }

    const statusData = fs.readFileSync(STATUS_FILE, 'utf-8');
    const status: BotStatus = JSON.parse(statusData);

    // Check if the last ping was within the last 2 minutes
    if (status.lastPing) {
      const lastPingTime = new Date(status.lastPing).getTime();
      const now = Date.now();
      const twoMinutesAgo = now - 2 * 60 * 1000;

      if (lastPingTime < twoMinutesAgo) {
        return NextResponse.json({
          ...status,
          connected: false,
          error: 'Bot has not responded in over 2 minutes',
        });
      }
    }

    return NextResponse.json(status);
  } catch (error) {
    console.error('Error reading bot status:', error);
    return NextResponse.json({
      connected: false,
      lastPing: null,
      error: 'Failed to read bot status',
    });
  }
}
