import { prisma } from './prisma';

// Rate limiting apoiado no banco.
//
// Não dá para usar um contador em memória: a Hostinger roda o app em vários
// processos e cada um teria a própria contagem, então o teto real seria N vezes
// maior. Aqui cada tentativa vira uma linha em RateHit e o servidor conta as
// recentes por (bucket, identifier) dentro da janela.
//
// bucket    = a ação ("login", "register", "reset").
// identifier= quem está sendo limitado (IP ou e-mail), já normalizado.

export type LimiteConfig = { max: number; janelaMs: number };

/**
 * Registra a tentativa e diz se estourou o limite.
 * Retorna { limitado: true } quando o número de tentativas na janela passou de `max`.
 * Falha aberta: se o banco cair, não trava o usuário legítimo (retorna liberado).
 */
export async function registrarEChecar(
  bucket: string,
  identifier: string,
  { max, janelaMs }: LimiteConfig,
): Promise<{ limitado: boolean }> {
  const agora = Date.now();
  const desde = new Date(agora - janelaMs);
  const id = identifier.slice(0, 190);

  try {
    await prisma.rateHit.create({ data: { bucket, identifier: id } });

    const recentes = await prisma.rateHit.count({
      where: { bucket, identifier: id, createdAt: { gte: desde } },
    });

    // Faxina oportunista das linhas velhas deste bucket/identifier, para a
    // tabela não crescer sem fim. Barato porque o índice cobre a consulta.
    if (recentes % 20 === 0) {
      await prisma.rateHit
        .deleteMany({ where: { bucket, identifier: id, createdAt: { lt: desde } } })
        .catch(() => {});
    }

    return { limitado: recentes > max };
  } catch {
    // Banco indisponível não pode virar um cadeado no usuário legítimo.
    return { limitado: false };
  }
}

/** Conta tentativas recentes sem registrar uma nova. Para o login, onde só as
 *  FALHAS contam — não se deve punir quem digita a senha certa várias vezes. */
export async function contarRecentes(bucket: string, identifier: string, janelaMs: number): Promise<number> {
  try {
    return await prisma.rateHit.count({
      where: { bucket, identifier: identifier.slice(0, 190), createdAt: { gte: new Date(Date.now() - janelaMs) } },
    });
  } catch {
    return 0;
  }
}

/** Registra uma ocorrência (ex.: uma falha de login). Nunca lança. */
export async function registrar(bucket: string, identifier: string): Promise<void> {
  try {
    await prisma.rateHit.create({ data: { bucket, identifier: identifier.slice(0, 190) } });
  } catch { /* banco fora: não trava o fluxo */ }
}

/** IP de origem a partir dos cabeçalhos do proxy. Cai em "sem-ip" se ausente. */
export function ipDaRequisicao(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip')?.trim() || 'sem-ip';
}
