import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Fixa a raiz no próprio projeto. Sem isto, havendo um package-lock.json em
  // alguma pasta acima, o Next elege aquela pasta como raiz do workspace e
  // passa a resolver arquivo do lugar errado.
  turbopack: { root: __dirname },

  // A hospedagem compartilhada limita quantas threads o processo pode criar.
  // O Next dimensiona os workers pela CPU da máquina inteira — 17 no servidor
  // da Hostinger — e a compilação morria com "OS can't spawn worker thread:
  // Resource temporarily unavailable (os error 11)", deixando um .next pela
  // metade, sem BUILD_ID. Com um worker só, a compilação conclui.
  experimental: { cpus: 1, workerThreads: false },

  // Domínio canônico: tudo em www.radarrider.com.
  //
  // radarrider.com e www.radarrider.com eram servidos os dois, sem um apontar
  // para o outro. Isso criava DOIS caches separados no CDN (um servia a versão
  // nova, o outro uma antiga presa) e, pior, o cookie de sessão fica preso a um
  // host só — quem entrava por um domínio e era mandado para o outro aparecia
  // deslogado. O NEXTAUTH_URL já é o www, então o www é o canônico.
  //
  // permanent:false (307) de propósito: se algo der errado, um 301/308 fica
  // gravado no navegador e é penoso de reverter. Dá para promover a permanente
  // depois de confirmar que está tudo certo.
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'radarrider.com' }],
        destination: 'https://www.radarrider.com/:path*',
        permanent: false,
      },
    ];
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          // O app precisa do GPS; câmera e microfone ele nunca usa.
          { key: 'Permissions-Policy', value: 'geolocation=(self), camera=(), microphone=()' },
        ],
      },
      {
        // O service worker não pode ficar em cache, senão o celular de quem já
        // instalou continua rodando a versão antiga depois de um deploy.
        source: '/service-worker.js',
        headers: [{ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }],
      },
      {
        // Rota de dados: nunca cachear. É um app em tempo real; alerta novo tem
        // de aparecer na hora, não daqui a um minuto.
        source: '/api/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store, must-revalidate' }],
      },
      {
        // O HTML das páginas NÃO pode ficar preso no CDN. Por padrão o Next marca
        // página prerender com s-maxage de um ano; o CDN da Hostinger cacheia esse
        // HTML e, depois de um deploy, continua servindo a versão antiga — que
        // aponta para arquivos /_next/static que o build novo já apagou (o CSS dá
        // 404 e a página aparece sem estilo). Com s-maxage curto o CDN revalida
        // logo após o deploy. Os assets em /_next/static ficam DE FORA de propósito:
        // são versionados por hash, nunca mudam para a mesma URL, então merecem o
        // cache imutável que o Next já dá a eles.
        source: '/((?!_next/static|_next/image|api|service-worker.js).*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, s-maxage=60, stale-while-revalidate=300' },
        ],
      },
    ];
  },
};

export default nextConfig;
