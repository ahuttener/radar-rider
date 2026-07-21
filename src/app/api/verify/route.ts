import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { consumirToken } from '@/lib/tokens';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let corpo: { token?: string };
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ erro: 'Requisição inválida.' }, { status: 400 });
  }

  const userId = await consumirToken(corpo.token ?? '', 'verify_email');
  if (!userId) {
    return NextResponse.json(
      { erro: 'Este link expirou ou já foi usado. Tente entrar — se não der, peça um novo.' },
      { status: 400 },
    );
  }

  await prisma.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date() } });
  return NextResponse.json({ ok: true });
}
