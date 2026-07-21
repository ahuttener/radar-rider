import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { criarToken } from '@/lib/tokens';
import { enviarConfirmacaoDeConta } from '@/lib/mailer';

export const dynamic = 'force-dynamic';

const schema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(8).max(200),
  displayName: z.string().trim().min(2).max(40),
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
    return NextResponse.json(
      { erro: 'Confira os dados. A senha precisa ter ao menos 8 caracteres.' },
      { status: 400 },
    );
  }

  const email = dados.data.email.trim().toLowerCase();
  const jaExiste = await prisma.user.findUnique({ where: { email }, select: { id: true } });

  // Resposta idêntica exista ou não a conta. Dizer "e-mail já cadastrado"
  // transforma o formulário num verificador de quem tem conta no app —
  // e aqui isso revela quem é rider e usa alerta de segurança.
  if (!jaExiste) {
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: await bcrypt.hash(dados.data.password, 12),
        displayName: dados.data.displayName,
      },
    });

    const token = await criarToken(user.id, 'verify_email');
    const site = process.env.NEXTAUTH_URL || 'https://www.radarrider.com';
    await enviarConfirmacaoDeConta(email, `${site}/confirmar?token=${token}`);
  }

  return NextResponse.json({
    ok: true,
    mensagem: 'Se este e-mail ainda não tinha conta, enviamos um link de confirmação para ele.',
  });
}
