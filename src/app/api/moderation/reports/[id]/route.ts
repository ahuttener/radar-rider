import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions, ehStaff } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const schema = z.object({
  action: z.enum(['review', 'dismiss', 'hide', 'remove']),
  notes: z.string().trim().max(500).optional(),
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
    return NextResponse.json({ erro: 'Ação de moderação inválida.' }, { status: 400 });
  }

  const { id } = await ctx.params;
  const report = await prisma.alertReport.findUnique({ where: { id }, select: { alertId: true } });
  if (!report) return NextResponse.json({ erro: 'Denúncia não encontrada.' }, { status: 404 });

  const reportStatus = parsed.data.action === 'review'
    ? 'reviewing'
    : parsed.data.action === 'dismiss' ? 'dismissed' : 'resolved';

  await prisma.$transaction(async (tx) => {
    await tx.alertReport.update({ where: { id }, data: { status: reportStatus } });
    if (parsed.data.action === 'hide' || parsed.data.action === 'remove') {
      await tx.alert.update({
        where: { id: report.alertId },
        data: { status: parsed.data.action === 'hide' ? 'hidden' : 'removed' },
      });
    }
    await tx.moderationAction.create({
      data: {
        alertId: report.alertId,
        moderatorId: session.user.id,
        action: parsed.data.action,
        notes: parsed.data.notes || null,
      },
    });
  });

  return NextResponse.json({ ok: true });
}
