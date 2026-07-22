import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, ehStaff } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ erro: 'Entre na sua conta.' }, { status: 401 });
  }
  if (!ehStaff(session.user.role)) {
    return NextResponse.json({ erro: 'Acesso restrito à moderação.' }, { status: 403 });
  }

  const reports = await prisma.alertReport.findMany({
    where: { status: { in: ['open', 'reviewing'] } },
    select: {
      id: true,
      reason: true,
      details: true,
      status: true,
      createdAt: true,
      alert: {
        select: {
          id: true,
          category: true,
          description: true,
          status: true,
          latitudePublic: true,
          longitudePublic: true,
          createdAt: true,
          expiresAt: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
    take: 100,
  });

  return NextResponse.json({ reports }, { headers: { 'Cache-Control': 'private, no-store' } });
}
