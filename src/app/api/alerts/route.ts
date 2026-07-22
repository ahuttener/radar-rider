import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { publicAlertSelect, toPublicAlert, toPublicAlerts } from '@/lib/alert-visibility';
import { countryFromCoords, publicCoord, isValidCoord } from '@/lib/geo';
import { executarRetencaoSeNecessario } from '@/lib/retention';

export const dynamic = 'force-dynamic';

/** Lista os alertas ativos da comunidade. Aberto, sem precisar de conta. */
export async function GET() {
  await executarRetencaoSeNecessario();
  const alerts = await prisma.alert.findMany({
    where: { status: 'active', expiresAt: { gt: new Date() } },
    select: publicAlertSelect,
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  return NextResponse.json({ alerts: toPublicAlerts(alerts) });
}

const schema = z.object({
  category: z.enum(['intimidacao', 'roubo', 'grupo_hostil', 'via_perigosa', 'acidente', 'outro']),
  description: z.string().trim().min(10).max(500),
  latitude: z.number(),
  longitude: z.number(),
  isOngoing: z.boolean().default(false),
  // Minutos que o alerta fica no ar. O autor escolhe entre 1h e 12h.
  durationMinutes: z.number().int().min(60).max(720),
  // Há quanto tempo aconteceu, em minutos.
  occurredMinutesAgo: z.number().int().min(0).max(60),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ erro: 'Entre na sua conta para publicar um alerta.' }, { status: 401 });
  }

  let corpo: unknown;
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ erro: 'Requisição inválida.' }, { status: 400 });
  }

  const dados = schema.safeParse(corpo);
  if (!dados.success) {
    return NextResponse.json(
      { erro: 'Descreva o risco com pelo menos 10 caracteres e escolha um tipo.' },
      { status: 400 },
    );
  }

  const { latitude, longitude } = dados.data;
  if (!isValidCoord(latitude, longitude)) {
    return NextResponse.json({ erro: 'Localização inválida.' }, { status: 400 });
  }

  const countryCode = countryFromCoords(latitude, longitude);
  if (!countryCode) {
    return NextResponse.json(
      { erro: 'O Radar Rider aceita alertas apenas na Irlanda e no Reino Unido.' },
      { status: 400 },
    );
  }

  // Limite de 3 alertas por 10 minutos. Sem isso, uma conta sozinha enche o
  // mapa de alerta falso e o app vira ferramenta de pânico.
  const recentes = await prisma.alert.count({
    where: { userId: session.user.id, createdAt: { gt: new Date(Date.now() - 10 * 60_000) } },
  });
  if (recentes >= 3) {
    return NextResponse.json(
      { erro: 'Você publicou muitos alertas agora há pouco. Espere alguns minutos.' },
      { status: 429 },
    );
  }

  const agora = Date.now();
  const alerta = await prisma.alert.create({
    data: {
      userId: session.user.id,
      category: dados.data.category,
      description: dados.data.description,
      occurredAt: new Date(agora - dados.data.occurredMinutesAgo * 60_000),
      isOngoing: dados.data.isOngoing,
      // A posição exata fica gravada para moderação e nunca sai numa resposta.
      latitudePrivate: latitude,
      longitudePrivate: longitude,
      // O borrão é feito AQUI, no servidor. Se viesse pronto do cliente, daria
      // para publicar um alerta apontando para a casa de alguém.
      latitudePublic: publicCoord(latitude),
      longitudePublic: publicCoord(longitude),
      countryCode,
      expiresAt: new Date(agora + dados.data.durationMinutes * 60_000),
    },
    select: publicAlertSelect,
  });

  // O select já exclui os campos privados; a conversão é a segunda barreira
  // contra uma alteração futura da consulta que inclua coordenadas exatas.
  return NextResponse.json({ alert: toPublicAlert(alerta) }, { status: 201 });
}
