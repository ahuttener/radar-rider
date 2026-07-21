import type { Alert } from '@prisma/client';

// ESTE ARQUIVO É A GARANTIA DE PRIVACIDADE DO APP.
//
// No Supabase quem impedia vazamento era a RLS e o grant por coluna: o banco
// simplesmente não devolvia latitudePrivate nem userId, por mais errada que
// fosse a consulta. Aqui não existe essa rede de proteção — o Prisma devolve
// tudo que a linha tem. Então a regra passou a ser do servidor, e mora aqui.
//
// REGRA: nenhuma rota devolve um alerta ao cliente sem passar por uma destas
// funções. Não monte objeto de alerta à mão numa rota.

/** Campos que podem sair para qualquer pessoa. */
export const publicAlertSelect = {
  id: true,
  category: true,
  description: true,
  occurredAt: true,
  isOngoing: true,
  latitudePublic: true,
  longitudePublic: true,
  status: true,
  countryCode: true,
  confirmationsCount: true,
  expiresAt: true,
  createdAt: true,
} as const;

export type PublicAlert = Pick<Alert, keyof typeof publicAlertSelect>;

/**
 * Última barreira antes da resposta HTTP.
 *
 * Recebe qualquer coisa parecida com um alerta e devolve só o que é público.
 * É redundante com o `select` do Prisma de propósito: o dia em que alguém
 * trocar o select por um `include` distraído, a coordenada exata ainda não
 * vaza. Redundância barata contra um erro caro.
 */
export function toPublicAlert(alert: Alert | PublicAlert): PublicAlert {
  return {
    id: alert.id,
    category: alert.category,
    description: alert.description,
    occurredAt: alert.occurredAt,
    isOngoing: alert.isOngoing,
    latitudePublic: alert.latitudePublic,
    longitudePublic: alert.longitudePublic,
    status: alert.status,
    countryCode: alert.countryCode,
    confirmationsCount: alert.confirmationsCount,
    expiresAt: alert.expiresAt,
    createdAt: alert.createdAt,
  };
}

export function toPublicAlerts(alerts: Array<Alert | PublicAlert>): PublicAlert[] {
  return alerts.map(toPublicAlert);
}

/**
 * Coordenada exata, só para moderação.
 *
 * Existe como função separada e com nome explícito para que qualquer uso dela
 * salte aos olhos numa revisão. Quem chamar isto TEM que ter checado que o
 * usuário é staff — a função não checa sozinha porque não conhece a sessão.
 */
export function staffOnlyExactLocation(alert: Alert) {
  return { latitude: alert.latitudePrivate, longitude: alert.longitudePrivate };
}
