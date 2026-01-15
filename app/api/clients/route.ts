import { NextResponse } from 'next/server';
import { readDB } from '@/lib/db';

// GET /api/clients - Get unique client names
export async function GET() {
  const db = readDB();

  // Extract unique client names from tasks
  const clients = [...new Set(db.tasks.map(t => t.client).filter(Boolean))].sort();

  return NextResponse.json(clients);
}
