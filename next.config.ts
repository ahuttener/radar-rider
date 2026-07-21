import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Fixa a raiz no próprio projeto. Sem isto, havendo um package-lock.json em
  // alguma pasta acima, o Next elege aquela pasta como raiz do workspace e
  // passa a resolver arquivo do lugar errado.
  turbopack: { root: __dirname },

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
