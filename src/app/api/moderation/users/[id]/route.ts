import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions, ehStaff } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Enforcement de conta pela moderação.
//  suspend: bloqueia o login por `days` dias (padrão 7).
//  ban:     bloqueia o login permanentemente.
//  unban:   remove suspensão e banimento.
// O login lê estes campos em src/lib/auth.ts e recusa a entrada.
const schema = z.object({
  action: z.enum(['suspend', 'ban', 'unban']),
  reason: z.string().trim().max(200).optional(),
  days: z.number().int().min(1).max(365).optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ erro: 'Entre na sua conta.' }, { status: 401 });
  }
  if (!ehStaff(session.user.role)) {
    return NextResponse.json({ erro: 'Acesso restrito à moderação.' }, { status: 403 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ erro: 'Requisição inválida.' }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ erro: 'Ação inválida.' }, { status: 400 });
  }

  const { id } = await ctx.params;

  // Ninguém pune a própria conta nem outra conta de equipe: evita um moderador
  // se trancar para fora ou brigas internas derrubarem a moderação.
  if (id === session.user.id) {
    return NextResponse.json({ erro: 'Você não pode aplicar isso à sua própria conta.' }, { status: 400 });
  }
  const alvo = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
  if (!alvo) return NextResponse.json({ erro: 'Conta não encontrada.' }, { status: 404 });
  if (ehStaff(alvo.role)) {
    return NextResponse.json({ erro: 'Não é possível moderar uma conta da equipe.' }, { status: 400 });
  }

  const dados =
    parsed.data.action === 'ban'
      ? { bannedAt: new Date(), banReason: parsed.data.reason || null }
      : parsed.data.action === 'suspend'
        ? {
            suspendedUntil: new Date(Date.now() + (parsed.data.days ?? 7) * 24 * 60 * 60 * 1000),
            suspensionReason: parsed.data.reason || null,
          }
        : { bannedAt: null, banReason: null, suspendedUntil: null, suspensionReason: null };

  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id }, data: dados });
    await tx.moderationAction.create({
      data: {
        moderatorId: session.user.id,
        action: `user:${parsed.data.action}`,
        notes: parsed.data.reason || null,
      },
    });
  });

  return NextResponse.json({ ok: true });
}
