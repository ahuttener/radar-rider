import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions, ehStaff } from '@/lib/auth';
import { registrarEChecar, ipDaRequisicao } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

// Contador de instalações do app (PWA).
//
// O dono queria saber quantas vezes o app foi instalado. É métrica agregada:
// não guarda quem instalou, nem e-mail, nem identificador de aparelho — só a
// data e o país. Por isso não precisa de consentimento e não conflita com a
// política de privacidade, ao contrário de registrar quem entrou e quando.
//
// Guardado na tabela RateHit em vez de uma tabela nova de propósito: ela já é
// um log genérico de eventos (bucket + identifier + createdAt, indexado), e
// criar model novo exigiria migração no servidor — onde o Prisma precisa de
// chmod nos engines e cada deploy derruba o site. O ganho não paga o risco.
// bucket = 'pwa-install', identifier = país ('IE', 'GB' ou '??').

const BUCKET = 'pwa-install';

export async function POST(req: Request) {
  // Trava anti-inflação: no máximo 5 registros por IP por hora. Sem isto,
  // qualquer um poderia inflar o número chamando a rota num laço. O IP entra
  // só no controle de limite (bucket separado, que se limpa sozinho), nunca
  // no registro da instalação.
  const { limitado } = await registrarEChecar('install-ip', ipDaRequisicao(req), {
    max: 5,
    janelaMs: 60 * 60 * 1000,
  });
  // Responde ok mesmo quando limitado: é métrica, não vale expor a trava nem
  // fazer o app do usuário tentar de novo.
  if (limitado) return NextResponse.json({ ok: true });

  let pais = '??';
  try {
    const corpo = (await req.json()) as { country?: unknown };
    if (corpo.country === 'IE' || corpo.country === 'GB') pais = corpo.country;
  } catch { /* sem corpo: fica '??' */ }

  try {
    await prisma.rateHit.create({ data: { bucket: BUCKET, identifier: pais } });
  } catch { /* banco fora não pode quebrar a instalação do app */ }

  return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
}

// Leitura do contador — só para a moderação. É informação de negócio, não
// precisa ficar pública.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ erro: 'Entre na sua conta.' }, { status: 401 });
  }
  if (!ehStaff(session.user.role)) {
    return NextResponse.json({ erro: 'Acesso restrito à moderação.' }, { status: 403 });
  }

  const seteDiasAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [porPais, ultimos7] = await Promise.all([
    prisma.rateHit.groupBy({
      by: ['identifier'],
      where: { bucket: BUCKET },
      _count: { _all: true },
    }),
    prisma.rateHit.count({ where: { bucket: BUCKET, createdAt: { gte: seteDiasAtras } } }),
  ]);

  const total = porPais.reduce((soma, linha) => soma + linha._count._all, 0);
  const paises: Record<string, number> = {};
  for (const linha of porPais) paises[linha.identifier] = linha._count._all;

  return NextResponse.json(
    { total, ultimos7dias: ultimos7, porPais: paises },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
