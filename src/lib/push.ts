import webpush from 'web-push';
import { prisma } from './prisma';
import type { CountryCode } from './geo';

// Notificação push (Web Push).
//
// As chaves VAPID vêm do ambiente. A pública também é exposta ao cliente por
// NEXT_PUBLIC_VAPID_PUBLIC_KEY (é pública por natureza); a privada fica só aqui
// no servidor. Se as chaves não estiverem configuradas, o push simplesmente
// não funciona (o app esconde o botão e os envios viram no-op) — nada quebra.

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
// mailto de contato exigido pelo protocolo VAPID.
const SUBJECT = process.env.VAPID_SUBJECT || 'mailto:contato@radarrider.com';

let configurado = false;
export function pushConfigurado(): boolean {
  if (!PUBLIC_KEY || !PRIVATE_KEY) return false;
  if (!configurado) {
    webpush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY);
    configurado = true;
  }
  return true;
}

type Payload = { title: string; body: string; url?: string };

/**
 * Envia uma notificação para todas as inscrições de um país.
 * Inscrição com endpoint morto (404/410) é apagada. Nunca lança: uma falha de
 * push não pode derrubar a rota que a disparou (ex.: criar alerta).
 */
export async function notificarPais(country: CountryCode, payload: Payload): Promise<number> {
  if (!pushConfigurado()) return 0;

  const inscricoes = await prisma.pushSubscription.findMany({ where: { country } });
  const corpo = JSON.stringify(payload);
  let enviados = 0;

  await Promise.all(
    inscricoes.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          corpo,
        );
        enviados++;
      } catch (e: unknown) {
        const status = (e as { statusCode?: number })?.statusCode;
        // 404/410 = o navegador cancelou a inscrição. Remove para não tentar de novo.
        if (status === 404 || status === 410) {
          await prisma.pushSubscription.delete({ where: { id: s.id } }).catch(() => {});
        }
      }
    }),
  );

  return enviados;
}
