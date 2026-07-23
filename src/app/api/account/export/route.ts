import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ erro: 'Entre na sua conta para exportar seus dados.' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      displayName: true,
      // Telefone é dado pessoal do usuário: precisa constar no export (RGPD).
      phone: true,
      role: true,
      reputationScore: true,
      emailVerifiedAt: true,
      createdAt: true,
      alerts: {
        select: {
          id: true, category: true, description: true, occurredAt: true,
          isOngoing: true, latitudePrivate: true, longitudePrivate: true,
          latitudePublic: true, longitudePublic: true, status: true,
          countryCode: true, confirmationsCount: true, expiresAt: true, createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      },
      confirmations: {
        select: { alertId: true, distanceMetres: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      },
      reportsMade: {
        select: { alertId: true, reason: true, details: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ erro: 'Conta não encontrada.' }, { status: 404 });
  }

  const data = new Date().toISOString().slice(0, 10);
  return NextResponse.json(
    { exportedAt: new Date().toISOString(), account: user },
    {
      headers: {
        'Cache-Control': 'private, no-store',
        'Content-Disposition': `attachment; filename="radar-rider-dados-${data}.json"`,
      },
    },
  );
}
