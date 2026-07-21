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

const CACHE = 'radar-rider-v3';

// Só o que não muda de significado: a logo e o manifesto.
const ESTATICOS = ['/icon-192.png', '/icon-512.png', '/apple-touch-icon.png', '/manifest.json'];

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
