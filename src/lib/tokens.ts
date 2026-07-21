import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { prisma } from './prisma';

// Tokens de confirmação de e-mail e de redefinição de senha.
//
// O banco guarda só o HASH do token. Assim, um vazamento do banco não entrega
// links de redefinição válidos — quem tiver a tabela não consegue reconstruir
// o token original a partir do hash.

export type TokenPurpose = 'verify_email' | 'reset_password';

const VALIDADE_MINUTOS: Record<TokenPurpose, number> = {
  verify_email: 60 * 24, // 24 horas: a pessoa pode só ver o e-mail no dia seguinte
  reset_password: 60,    // 1 hora: janela curta porque dá acesso à conta
};

function hash(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export async function criarToken(userId: string, purpose: TokenPurpose) {
  // Um pedido novo invalida os anteriores: dois links de redefinição válidos ao
  // mesmo tempo dobram a janela de ataque sem nenhum ganho para o usuário.
  await prisma.emailToken.updateMany({
    where: { userId, purpose, usedAt: null },
    data: { usedAt: new Date() },
  });

  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + VALIDADE_MINUTOS[purpose] * 60_000);

  await prisma.emailToken.create({
    data: { userId, purpose, tokenHash: hash(token), expiresAt },
  });

  return token;
}

/**
 * Consome o token: valida e marca como usado na mesma operação.
 * Devolve o userId, ou null se o token não presta.
 */
export async function consumirToken(token: string, purpose: TokenPurpose): Promise<string | null> {
  if (!token || token.length > 200) return null;

  const registro = await prisma.emailToken.findUnique({ where: { tokenHash: hash(token) } });
  if (!registro) return null;
  if (registro.purpose !== purpose) return null;
  if (registro.usedAt) return null;
  if (registro.expiresAt <= new Date()) return null;

  // updateMany com usedAt:null em vez de update: se dois cliques chegarem
  // juntos, só um encontra a linha ainda não usada. O outro recebe count 0.
  const { count } = await prisma.emailToken.updateMany({
    where: { id: registro.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  if (count === 0) return null;

  return registro.userId;
}

/** Comparação de strings em tempo constante, para segredos curtos. */
export function comparaSegredo(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}
