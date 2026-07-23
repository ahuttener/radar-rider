import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { criarToken } from '@/lib/tokens';
import { enviarRecuperacaoDeSenha } from '@/lib/mailer';
import { registrarEChecar, ipDaRequisicao } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const schema = z.object({ email: z.string().email().max(200) });

export async function POST(req: Request) {
  // No máximo 5 pedidos de redefinição por IP por hora. A resposta do limite é
  // a MESMA de sucesso, para não revelar nada sobre a existência da conta.
  const { limitado } = await registrarEChecar('reset', ipDaRequisicao(req), {
    max: 5,
    janelaMs: 60 * 60 * 1000,
  });
  if (limitado) {
    return NextResponse.json({
      ok: true,
      mensagem: 'Se existir uma conta com esse e-mail, o link de redefinição chegou nele.',
    });
  }

  let corpo: unknown;
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ erro: 'Requisição inválida.' }, { status: 400 });
  }

  const dados = schema.safeParse(corpo);
  // Mesmo com e-mail malformado a resposta é a de sucesso: qualquer diferença
  // aqui vira uma forma de descobrir quem tem conta.
  if (dados.success) {
    const email = dados.data.email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });

    if (user && !user.deletedAt) {
      const token = await criarToken(user.id, 'reset_password');
      const site = process.env.NEXTAUTH_URL || 'https://www.radarrider.com';
      await enviarRecuperacaoDeSenha(email, `${site}/nova-senha?token=${token}`);
    }
  }

  return NextResponse.json({
    ok: true,
    mensagem: 'Se existir uma conta com esse e-mail, o link de redefinição chegou nele.',
  });
}
