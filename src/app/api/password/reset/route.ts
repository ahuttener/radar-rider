import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { consumirToken } from '@/lib/tokens';

export const dynamic = 'force-dynamic';

const schema = z.object({
  token: z.string().min(10).max(200),
  password: z.string().min(8).max(200),
});

export async function POST(req: Request) {
  let corpo: unknown;
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ erro: 'Requisição inválida.' }, { status: 400 });
  }

  const dados = schema.safeParse(corpo);
  if (!dados.success) {
    return NextResponse.json({ erro: 'A senha precisa ter ao menos 8 caracteres.' }, { status: 400 });
  }

  const userId = await consumirToken(dados.data.token, 'reset_password');
  if (!userId) {
    return NextResponse.json(
      { erro: 'Este link expirou ou já foi usado. Peça um novo na tela de entrar.' },
      { status: 400 },
    );
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: await bcrypt.hash(dados.data.password, 12),
      // Derruba as sessões que já estavam abertas. Quem pede para redefinir a
      // senha normalmente quer justamente expulsar alguém.
      passwordChangedAt: new Date(),
      // Quem redefine a senha pelo e-mail provou que é dono da caixa. Se a
      // conta ainda não estava confirmada, confirma agora — senão a pessoa
      // troca a senha e continua sem conseguir entrar.
      emailVerifiedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
