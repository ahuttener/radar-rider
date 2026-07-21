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
    ];
  },
};

export default nextConfig;
