import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const schema = z.object({ confirmation: z.literal('EXCLUIR') });

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ erro: 'Entre na sua conta para excluí-la.' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ erro: 'Confirmação inválida.' }, { status: 400 });
  }
  if (!schema.safeParse(body).success) {
    return NextResponse.json({ erro: 'Digite EXCLUIR para confirmar.' }, { status: 400 });
  }

  const userId = session.user.id;
  const passwordHash = await bcrypt.hash(randomBytes(32).toString('base64url'), 12);

  await prisma.$transaction(async (tx) => {
    const alerts = await tx.alert.findMany({
      where: { userId },
      select: { id: true, latitudePublic: true, longitudePublic: true },
    });

    // Apaga a precisão extra dos alertas, preservando apenas a área pública.
    for (const alert of alerts) {
      await tx.alert.update({
        where: { id: alert.id },
        data: {
          latitudePrivate: alert.latitudePublic,
          longitudePrivate: alert.longitudePublic,
        },
      });
    }

    await tx.emailToken.deleteMany({ where: { userId } });
    await tx.user.update({
      where: { id: userId },
      data: {
        email: `deleted-${userId}@deleted.invalid`,
        displayName: 'Conta excluída',
        passwordHash,
        deletedAt: new Date(),
        passwordChangedAt: new Date(),
      },
    });
  });

  return NextResponse.json(
    { ok: true, mensagem: 'Conta excluída e dados pessoais removidos.' },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
