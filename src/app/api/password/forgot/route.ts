import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { criarToken } from '@/lib/tokens';
import { enviarRecuperacaoDeSenha } from '@/lib/mailer';

export const dynamic = 'force-dynamic';

const schema = z.object({ email: z.string().email().max(200) });

export async function POST(req: Request) {
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
