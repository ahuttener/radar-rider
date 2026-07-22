import { prisma } from './prisma';

// A limpeza é oportunista e roda no máximo uma vez por dia por processo.
// Isso mantém a retenção funcionando mesmo numa hospedagem sem cron. Em mais
// de uma instância as operações continuam idempotentes.
let ultimaExecucao = 0;
const UM_DIA = 24 * 60 * 60_000;

export async function executarRetencaoSeNecessario() {
  const agora = Date.now();
  if (agora - ultimaExecucao < UM_DIA) return;
  ultimaExecucao = agora;

  const dozeMesesAtras = new Date(agora - 365 * UM_DIA);
  const trintaDiasAtras = new Date(agora - 30 * UM_DIA);

  try {
    await prisma.$transaction([
      // Alertas levam consigo confirmações e denúncias por cascade. Ações de
      // moderação permanecem como trilha, mas sem o alerta associado.
      prisma.alert.deleteMany({ where: { createdAt: { lt: dozeMesesAtras } } }),
      prisma.emailToken.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: trintaDiasAtras } },
            { usedAt: { not: null }, createdAt: { lt: trintaDiasAtras } },
          ],
        },
      }),
      prisma.moderationAction.deleteMany({ where: { createdAt: { lt: dozeMesesAtras } } }),
    ]);
  } catch (erro) {
    // Limpeza não pode derrubar o mapa. A falha fica no log operacional e uma
    // nova visita tenta novamente no processo seguinte.
    console.error('Falha na rotina de retenção:', erro);
  }
}
