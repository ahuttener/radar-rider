import type { MetadataRoute } from 'next';

// Sitemap das páginas públicas e indexáveis. Fica DE FORA tudo que o robots.txt
// bloqueia (telas de conta, autenticação e moderação) — não faz sentido pedir
// indexação de página que se manda o buscador não visitar.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXTAUTH_URL || 'https://www.radarrider.com').replace(/\/$/, '');
  const agora = new Date();

  const rotas = [
    '',
    '/sobre', '/about',
    '/comunidade', '/community',
    '/seguranca', '/safety',
    '/seguranca-infantil', '/child-safety',
    '/uso-aceitavel', '/acceptable-use',
    '/denunciar-abuso', '/report-abuse',
    '/pedidos-autoridades', '/law-enforcement',
    '/termos', '/terms',
    '/privacidade', '/privacy',
    '/cookies',
    '/rgpd', '/gdpr',
    '/retencao', '/retention',
    '/responsabilidade', '/disclaimer',
    '/direitos-autorais', '/copyright',
    '/contato', '/contact',
  ];

  return rotas.map((rota) => ({
    url: `${base}${rota}`,
    lastModified: agora,
    changeFrequency: rota === '' ? 'daily' : 'monthly',
    priority: rota === '' ? 1 : 0.5,
  }));
}
