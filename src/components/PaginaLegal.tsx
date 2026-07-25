import Link from 'next/link';

// Moldura comum das páginas de texto legal.
//
// São páginas estáticas de propósito: nenhuma delas toca o banco. Numa
// hospedagem em que a rota de banco pode falhar, a política de privacidade
// tem que continuar de pé — é ela que a lei exige que esteja sempre acessível.
//
// lang: o site é em PORTUGUÊS. Os três documentos que a lei obriga a publicar
// (Privacidade, Termos, Cookies) existem nos dois idiomas, porque o público
// atendido está na Irlanda e no Reino Unido: o texto em português é o principal
// e o inglês é a versão equivalente para quem não lê português. Este parâmetro
// troca os textos fixos da moldura, o atributo lang do documento e os destinos
// da navegação para casar com o idioma da página.
//
// Os demais documentos existem só em português; na versão inglesa a navegação
// aponta para eles mesmo assim, que é onde o conteúdo está.

const TEXTOS = {
  pt: {
    subtitulo: 'SEGURANÇA COMUNITÁRIA',
    voltar: '← Voltar',
    atualizado: 'Última atualização:',
    outroIdioma: 'English',
    htmlLang: 'pt-BR',
    nav: {
      privacidade: 'Privacidade', cookies: 'Cookies', termos: 'Termos de uso',
      comunidade: 'Comunidade', seguranca: 'Segurança', rgpd: 'Direitos RGPD',
      denuncia: 'Denunciar abuso', contato: 'Contato', sobre: 'Sobre',
    },
  },
  en: {
    subtitulo: 'COMMUNITY SAFETY',
    voltar: '← Back',
    atualizado: 'Last updated:',
    outroIdioma: 'Português',
    htmlLang: 'en',
    nav: {
      privacidade: 'Privacy', cookies: 'Cookies', termos: 'Terms of Use',
      comunidade: 'Community', seguranca: 'Safety', rgpd: 'GDPR rights',
      denuncia: 'Report abuse', contato: 'Contact', sobre: 'About',
    },
  },
};

// Destino de cada item da navegação por idioma. Só os três documentos legais
// têm par em inglês; o resto mora nas rotas em português.
const ROTAS = {
  pt: {
    privacidade: '/privacidade', cookies: '/cookies', termos: '/termos',
  },
  en: {
    privacidade: '/privacy', cookies: '/cookie-policy', termos: '/terms',
  },
};

export function PaginaLegal({ titulo, atualizadoEm, children, lang = 'pt', versaoEm }: {
  titulo: string;
  atualizadoEm: string;
  children: React.ReactNode;
  lang?: 'pt' | 'en';
  /** Rota da MESMA página no outro idioma. Só os documentos bilíngues passam. */
  versaoEm?: string;
}) {
  const t = TEXTOS[lang];
  const rotas = ROTAS[lang];
  return (
    <div id="app">
      <header className="topbar">
        <div className="brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon-192.png" alt="" />
          <div>
            <h1>RADAR <span>RIDER</span></h1>
            <small>{t.subtitulo}</small>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {versaoEm && (
            // hreflang avisa o buscador que é a mesma página noutro idioma, e o
            // lang diz ao leitor de tela para pronunciar o rótulo corretamente.
            <Link
              className="ghost-pill"
              href={versaoEm}
              hrefLang={lang === 'pt' ? 'en' : 'pt-BR'}
              lang={lang === 'pt' ? 'en' : 'pt-BR'}
              style={{ textDecoration: 'none' }}
            >
              {t.outroIdioma}
            </Link>
          )}
          <Link className="ghost-pill" href="/" style={{ textDecoration: 'none' }}>{t.voltar}</Link>
        </div>
      </header>

      <div className="pad">
        {/* lang no elemento do conteúdo: o <html> do site é pt-BR, então sem
            isto a versão inglesa seria lida com fonética portuguesa. */}
        <article className="card legal" lang={t.htmlLang}>
          <h2 className="title">{titulo}</h2>
          <p className="legal-date">{t.atualizado} {atualizadoEm}</p>
          {children}

          <nav className="legal-nav">
            <Link href={rotas.privacidade}>{t.nav.privacidade}</Link>
            <Link href={rotas.cookies}>{t.nav.cookies}</Link>
            <Link href={rotas.termos}>{t.nav.termos}</Link>
            <Link href="/comunidade">{t.nav.comunidade}</Link>
            <Link href="/seguranca">{t.nav.seguranca}</Link>
            <Link href="/rgpd">{t.nav.rgpd}</Link>
            <Link href="/denunciar-abuso">{t.nav.denuncia}</Link>
            <Link href="/contato">{t.nav.contato}</Link>
            <Link href="/sobre">{t.nav.sobre}</Link>
          </nav>
        </article>
      </div>
    </div>
  );
}
