import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/clients - Get unique client names
export async function GET() {
  const tasks = await prisma.task.findMany({
    where: {
      client: { not: '' },
    },
    select: { client: true },
    distinct: ['client'],
    orderBy: { client: 'asc' },
  });

  const clients = tasks.map((t) => t.client);

  return NextResponse.json(clients);
}
