import type { MetadataRoute } from 'next';

// Orientação para buscadores. Sem este arquivo o site respondia 404 em
// /robots.txt e o padrão dos crawlers é indexar tudo — inclusive telas que
// carregam token na URL ou são só para staff. A landing e as páginas de
// conteúdo/legais continuam indexáveis; o que sai do índice são:
// - /api/*            respostas de API, nunca conteúdo
// - telas de auth     login e recuperação não têm valor de busca e duplicam a home
// - telas com token   /confirmar e /nova-senha trazem segredo na querystring
// - painel de staff   /moderacao(-e-denuncias) e /moderation
// - fluxo de exclusão  /excluir-conta e /delete-account
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/entrar',
        '/esqueci-a-senha',
        '/nova-senha',
        '/confirmar',
        '/moderacao',
        '/moderacao-e-denuncias',
        '/moderation',
        '/excluir-conta',
        '/delete-account',
      ],
    },
  };
}
