import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const schema = z.object({
  endpoint: z.string().url().max(500),
  p256dh: z.string().max(200),
  auth: z.string().max(100),
  country: z.enum(['IE', 'GB']),
});

// Salva (ou atualiza) a inscrição de push do usuário logado.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ erro: 'Entre na sua conta.' }, { status: 401 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ erro: 'Requisição inválida.' }, { status: 400 });
  }
  const dados = schema.safeParse(body);
  if (!dados.success) {
    return NextResponse.json({ erro: 'Inscrição inválida.' }, { status: 400 });
  }

  const { endpoint, p256dh, auth, country } = dados.data;
  // O endpoint é único: se o mesmo navegador reinscreve (ou troca de país),
  // atualiza em vez de duplicar.
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { endpoint, p256dh, auth, country, userId: session.user.id },
    update: { p256dh, auth, country, userId: session.user.id },
  });

  return NextResponse.json({ ok: true });
}

// Cancela a inscrição (quando a pessoa desliga as notificações).
export async function DELETE(req: Request) {
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ erro: 'Requisição inválida.' }, { status: 400 });
  }
  const endpoint = (body as { endpoint?: unknown })?.endpoint;
  if (typeof endpoint !== 'string') {
    return NextResponse.json({ erro: 'Endpoint ausente.' }, { status: 400 });
  }
  await prisma.pushSubscription.deleteMany({ where: { endpoint } });
  return NextResponse.json({ ok: true });
}
