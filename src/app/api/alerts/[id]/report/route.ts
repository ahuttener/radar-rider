import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const schema = z.object({
  reason: z.enum(['identificacao', 'falso', 'odio', 'privacidade', 'outro']),
  details: z.string().trim().max(300).optional(),
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ erro: 'Entre na sua conta para denunciar.' }, { status: 401 });
  }

  const { id } = await ctx.params;

  let corpo: unknown;
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ erro: 'Requisição inválida.' }, { status: 400 });
  }

  const dados = schema.safeParse(corpo);
  if (!dados.success) {
    return NextResponse.json({ erro: 'Escolha um motivo válido.' }, { status: 400 });
  }

  const alerta = await prisma.alert.findUnique({ where: { id }, select: { id: true } });
  if (!alerta) {
    return NextResponse.json({ erro: 'Alerta não encontrado.' }, { status: 404 });
  }

  // Uma denúncia por pessoa por alerta (índice único). Repetir o envio devolve
  // sucesso em vez de erro: para quem denuncia, o resultado é o mesmo, e
  // diferenciar só entregaria se aquele alerta já foi denunciado antes.
  try {
    await prisma.alertReport.create({
      data: {
        alertId: id,
        reportedBy: session.user.id,
        reason: dados.data.reason,
        details: dados.data.details || null,
      },
    });
  } catch (erro) {
    // Repetir uma denúncia é idempotente; qualquer outra falha precisa ser
    // informada. Dizer “enviada” quando o banco caiu perderia uma denúncia.
    if (!(erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === 'P2002')) {
      console.error('Falha ao registrar denúncia:', erro);
      return NextResponse.json(
        { erro: 'Não foi possível registrar a denúncia agora. Tente novamente.' },
        { status: 503 },
      );
    }
  }

  return NextResponse.json({ ok: true });
}
