import type { MetadataRoute } from 'next';

// Sitemap das páginas públicas e indexáveis. Fica DE FORA tudo que o robots.txt
// bloqueia (telas de conta, autenticação e moderação) — não faz sentido pedir
// indexação de página que se manda o buscador não visitar.
//
// Também ficam de fora as rotas de nome em inglês que são apenas redirect para
// a versão portuguesa (/about, /gdpr, /safety…): anunciá-las dobrava o número
// de URLs sem existir conteúdo distinto, e todas respondiam 307. Elas continuam
// funcionando para links antigos, só deixam de ser oferecidas ao buscador.
//
// Os três documentos que a lei obriga a publicar existem de verdade nos dois
// idiomas, então entram os dois lados, cada um apontando para o outro por
// hreflang.

const BILINGUES = [
  { pt: '/privacidade', en: '/privacy' },
  { pt: '/termos', en: '/terms' },
  { pt: '/cookies', en: '/cookie-policy' },
];

const SO_PORTUGUES = [
  '',
  '/sobre',
  '/comunidade',
  '/seguranca',
  '/seguranca-infantil',
  '/uso-aceitavel',
  '/denunciar-abuso',
  '/pedidos-autoridades',
  // /moderacao-e-denuncias fica de fora: o robots.txt bloqueia essa rota.
  '/rgpd',
  '/retencao',
  '/responsabilidade',
  '/direitos-autorais',
  '/contato',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXTAUTH_URL || 'https://www.radarrider.com').replace(/\/$/, '');
  const agora = new Date();
  const url = (rota: string) => `${base}${rota}`;

  const simples: MetadataRoute.Sitemap = SO_PORTUGUES.map((rota) => ({
    url: url(rota),
    lastModified: agora,
    changeFrequency: rota === '' ? 'daily' : 'monthly',
    priority: rota === '' ? 1 : 0.5,
  }));

  const bilingues: MetadataRoute.Sitemap = BILINGUES.flatMap(({ pt, en }) => {
    const languages = { 'pt-BR': url(pt), en: url(en) };
    return [pt, en].map((rota) => ({
      url: url(rota),
      lastModified: agora,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
      alternates: { languages },
    }));
  });

  return [...simples, ...bilingues];
}
