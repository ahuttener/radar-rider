import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Faxina de retenção, para rodar por cron do hPanel (de hora em hora). Aceita
// GET e POST para caber em qualquer forma de cron:
//   curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://www.radarrider.com/api/cron/retention
//   curl       -H "Authorization: Bearer $CRON_SECRET" https://www.radarrider.com/api/cron/retention
//
// Sem isto a limpeza só acontecia "oportunisticamente" quando havia tráfego —
// o que não garante a retenção prometida na política de privacidade. Aqui é um
// processo determinístico e auditável (devolve as contagens).
//
// A retenção segue o schema e a política reais: um alerta vencido NÃO é apagado
// na hora — ele some do mapa (status=expired), perde a coordenada exata depois
// de alguns dias e só então, ao fim do prazo, o registro em si é removido. A
// moderação pode precisar do histórico recente.

const RETENCAO_COORD_DIAS = 7;    // apaga a coordenada exata deste tempo após sair do ar
const RETENCAO_ALERTA_MESES = 12; // remove o alerta em si depois disso

async function rodarFaxina(req: Request) {
  const segredo = process.env.CRON_SECRET;
  if (!segredo) {
    return NextResponse.json({ erro: 'CRON_SECRET não configurado.' }, { status: 503 });
  }
  if (req.headers.get('authorization') !== `Bearer ${segredo}`) {
    return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 });
  }

  const agora = new Date();
  const corteCoord = new Date(agora.getTime() - RETENCAO_COORD_DIAS * 24 * 60 * 60 * 1000);
  const corteAlerta = new Date(agora);
  corteAlerta.setMonth(corteAlerta.getMonth() - RETENCAO_ALERTA_MESES);

  try {
    // 1. Alerta vencido sai do mapa.
    const expirados = await prisma.alert.updateMany({
      where: { status: 'active', expiresAt: { lt: agora } },
      data: { status: 'expired' },
    });

    // 2. Some a coordenada EXATA de quem já saiu do ar há mais de 7 dias:
    //    sobrescreve a privada pela pública (borrada). Não há mais o que vazar.
    const coordApagadas = await prisma.$executeRaw`
      UPDATE Alert
         SET latitudePrivate = latitudePublic, longitudePrivate = longitudePublic
       WHERE status IN ('expired', 'removed')
         AND createdAt < ${corteCoord}
         AND (latitudePrivate <> latitudePublic OR longitudePrivate <> longitudePublic)`;

    // 3. Token de e-mail (confirmação e redefinição) expirado ou já usado.
    const tokens = await prisma.emailToken.deleteMany({
      where: { OR: [{ expiresAt: { lt: agora } }, { usedAt: { not: null } }] },
    });

    // 4. Retenção final: o alerta em si some depois de 12 meses.
    const alertasVelhos = await prisma.alert.deleteMany({
      where: { createdAt: { lt: corteAlerta } },
    });

    const resultado = {
      status: 'ok',
      timestamp: agora.toISOString(),
      alertasExpirados: expirados.count,
      coordenadasApagadas: Number(coordApagadas),
      tokensRemovidos: tokens.count,
      alertasRemovidosPorIdade: alertasVelhos.count,
    };
    console.log('[cron/retention]', JSON.stringify(resultado));
    return NextResponse.json(resultado, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    console.error('[cron/retention] falhou:', e instanceof Error ? e.message : e);
    return NextResponse.json({ erro: 'Falha na faxina de retenção.' }, { status: 500 });
  }
}

export const GET = rodarFaxina;
export const POST = rodarFaxina;
