import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { distanceMetres, isValidCoord, CONFIRM_RADIUS_M } from '@/lib/geo';

export const dynamic = 'force-dynamic';

const schema = z.object({ latitude: z.number(), longitude: z.number() });

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ erro: 'Entre na sua conta para confirmar.' }, { status: 401 });
  }

  const { id } = await ctx.params;

  let corpo: unknown;
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ erro: 'Requisição inválida.' }, { status: 400 });
  }

  const dados = schema.safeParse(corpo);
  if (!dados.success || !isValidCoord(dados.data.latitude, dados.data.longitude)) {
    return NextResponse.json({ erro: 'Localização inválida.' }, { status: 400 });
  }

  const alerta = await prisma.alert.findUnique({ where: { id } });
  if (!alerta || alerta.status !== 'active' || alerta.expiresAt <= new Date()) {
    return NextResponse.json({ erro: 'Este alerta não está mais ativo.' }, { status: 404 });
  }

  if (alerta.userId === session.user.id) {
    return NextResponse.json(
      { erro: 'Você não pode confirmar o próprio alerta.' },
      { status: 400 },
    );
  }

  // A distância é medida contra a posição PÚBLICA, que é a única que a pessoa
  // podia enxergar. Usar a privada aqui daria resultados que não batem com o
  // que o app mostrou, e ainda vazaria a posição exata por tentativa e erro.
  const distancia = Math.round(
    distanceMetres(
      { lat: dados.data.latitude, lng: dados.data.longitude },
      { lat: alerta.latitudePublic, lng: alerta.longitudePublic },
    ),
  );

  // A checagem existe no cliente para dar uma mensagem boa, mas quem decide é
  // aqui: sem isso, bastava chamar a rota direto para confirmar de outro país.
  if (distancia > CONFIRM_RADIUS_M) {
    return NextResponse.json(
      { erro: 'Você está longe demais para confirmar este alerta.' },
      { status: 403 },
    );
  }

  try {
    // Transação: o contador e a reputação precisam andar junto com a
    // confirmação, senão uma falha no meio deixa número inflado sem lastro.
    await prisma.$transaction([
      prisma.alertConfirmation.create({
        data: { alertId: id, userId: session.user.id, distanceMetres: distancia },
      }),
      prisma.alert.update({
        where: { id },
        data: { confirmationsCount: { increment: 1 } },
      }),
      prisma.user.update({
        where: { id: session.user.id },
        data: { reputationScore: { increment: 1 } },
      }),
    ]);
  } catch {
    // O índice único (alertId, userId) é o que impede confirmar duas vezes.
    return NextResponse.json({ erro: 'Você já confirmou este alerta.' }, { status: 409 });
  }

  return NextResponse.json({ ok: true });
}
