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
  // Telefone no formato E.164: "+" seguido do DDI e do número, só dígitos.
  // O front monta a partir do DDI escolhido e do número digitado. Aceita de 8
  // a 15 dígitos depois do "+", que cobre os países atendidos sem travar em um.
  phone: z.string().trim().regex(/^\+\d{8,15}$/, 'Telefone inválido.'),
  isAdult: z.literal(true),
  acceptedTerms: z.literal(true),
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
  const jaExiste = await prisma.user.findUnique({
    where: { email },
    select: { id: true, emailVerifiedAt: true, deletedAt: true },
  });

  // Resposta idêntica exista ou não a conta. Dizer "e-mail já cadastrado"
  // transforma o formulário num verificador de quem tem conta no app —
  // e aqui isso revela quem é rider e usa alerta de segurança.
  let userId: string | null = null;
  if (!jaExiste) {
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: await bcrypt.hash(dados.data.password, 12),
        displayName: dados.data.displayName,
        phone: dados.data.phone,
      },
    });

    userId = user.id;
  } else if (!jaExiste.emailVerifiedAt && !jaExiste.deletedAt) {
    // Um cadastro interrompido pode pedir outro link sem revelar se a conta
    // existe. O token novo invalida o anterior.
    userId = jaExiste.id;
  }

  if (userId) {
    const token = await criarToken(userId, 'verify_email');
    const site = process.env.NEXTAUTH_URL || 'https://www.radarrider.com';
    await enviarConfirmacaoDeConta(email, `${site}/confirmar?token=${token}`);
  }

  return NextResponse.json({
    ok: true,
    mensagem: 'Se este e-mail ainda não tinha conta, enviamos um link de confirmação para ele.',
  });
}
