// Radar Rider — service worker.
//
// Existe por um motivo só: sem service worker registrado, o Android não oferece
// "Instalar app". Ele é DELIBERADAMENTE conservador.
//
// Nada de HTML nem de API em cache. Um entregador que abre o app precisa ver o
// alerta de agora, não o da última vez que carregou. Cache de página numa
// ferramenta de segurança é pior do que não ter cache: mostraria uma rua limpa
// que já não está limpa.
//
// A versão anterior listava /index.html, /styles.css e /app.js — arquivos da
// versão estática, que deixaram de existir. Como addAll rejeita se QUALQUER
// endereço der 404, o service worker nunca chegava a instalar, e por isso o
// navegador nunca oferecia instalar o app.

// A versão sobe sempre que ESTATICOS muda: é o que faz o navegador descartar o
// cache antigo. Sem isso, o manifesto velho (com o ícone errado) sobreviveria.
const CACHE = 'radar-rider-v7';

// Só o que não muda de significado: a logo, o manifesto e o sino da notificação.
const ESTATICOS = [
  '/icon-192.png',
  '/icon-512.png',
  '/icon-512-maskable.png',
  '/apple-touch-icon.png',
  '/badge-sino.png',
  '/manifest.json',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      // Um a um, tolerando falha: um arquivo ausente não pode impedir a
      // instalação inteira de novo.
      .then((c) => Promise.allSettled(ESTATICOS.map((u) => c.add(u))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((chaves) => Promise.all(chaves.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // Alertas, login, sessão: sempre da rede.
  if (url.pathname.startsWith('/api/')) return;

  const ehEstatico = ESTATICOS.includes(url.pathname) || url.pathname.startsWith('/_next/static/');
  if (!ehEstatico) return;

  e.respondWith(
    caches.match(req).then(
      (achou) =>
        achou ||
        fetch(req).then((r) => {
          const copia = r.clone();
          caches.open(CACHE).then((c) => c.put(req, copia));
          return r;
        }),
    ),
  );
});

// ===== Notificação push =====
// A mensagem chega cifrada; o payload é um JSON { title, body, url }.
self.addEventListener('push', (e) => {
  let dados = {};
  try { dados = e.data ? e.data.json() : {}; } catch { dados = {}; }
  const titulo = dados.title || 'Radar Rider';
  const opcoes = {
    body: dados.body || 'Novo alerta na sua região.',
    icon: '/icon-192.png',
    // O badge é o ícone pequeno na barra de status: um sino, não a logo espremida.
    badge: '/badge-sino.png',
    data: { url: dados.url || '/' },
    // Vibra no celular; um alerta de segurança merece ser sentido.
    vibrate: [80, 40, 80],
  };
  e.waitUntil(
    (async () => {
      await self.registration.showNotification(titulo, opcoes);
      // Selo no ÍCONE do app (Badging API). Aparece um marcador no ícone do
      // Radar Rider na tela do celular, mesmo com o app fechado — o aviso de
      // "tem alerta novo" que a pessoa vê sem abrir nada. Só funciona no app
      // instalado (adicionado à tela de início); em navegador comum é no-op.
      // Sem contador: o SW não sabe quantos há por ler, então marca um selo
      // simples. Some quando a pessoa abre o app (ver client e notificationclick).
      try { await self.navigator.setAppBadge(); } catch { /* API ausente: ignora */ }
    })(),
  );
});

// Tocar na notificação abre o app (ou foca a aba já aberta) e limpa o selo.
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const destino = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(
    (async () => {
      try { await self.navigator.clearAppBadge(); } catch { /* ignora */ }
      const clientes = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const c of clientes) {
        if ('focus' in c) return c.focus();
      }
      return self.clients.openWindow(destino);
    })(),
  );
});
