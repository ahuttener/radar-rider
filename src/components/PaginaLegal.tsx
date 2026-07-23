import Link from 'next/link';

// Moldura comum das páginas de texto legal.
//
// São páginas estáticas de propósito: nenhuma delas toca o banco. Numa
// hospedagem em que a rota de banco pode falhar, a política de privacidade
// tem que continuar de pé — é ela que a lei exige que esteja sempre acessível.
//
// lang: as páginas obrigatórias por lei (Terms, Privacy, Cookies) são em inglês
// porque a jurisdição é a Irlanda; o resto do site é em português. Este parâmetro
// troca os textos fixos da moldura para casar com o idioma da página.

const TEXTOS = {
  pt: {
    subtitulo: 'SEGURANÇA COMUNITÁRIA',
    voltar: '← Voltar',
    atualizado: 'Última atualização:',
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
    nav: {
      privacidade: 'Privacy', cookies: 'Cookies', termos: 'Terms of Use',
      comunidade: 'Community', seguranca: 'Safety', rgpd: 'GDPR rights',
      denuncia: 'Report abuse', contato: 'Contact', sobre: 'About',
    },
  },
};

export function PaginaLegal({ titulo, atualizadoEm, children, lang = 'pt' }: {
  titulo: string;
  atualizadoEm: string;
  children: React.ReactNode;
  lang?: 'pt' | 'en';
}) {
  const t = TEXTOS[lang];
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
        <Link className="ghost-pill" href="/" style={{ textDecoration: 'none' }}>{t.voltar}</Link>
      </header>

      <div className="pad">
        <article className="card legal">
          <h2 className="title">{titulo}</h2>
          <p className="legal-date">{t.atualizado} {atualizadoEm}</p>
          {children}

          <nav className="legal-nav">
            <Link href="/privacidade">{t.nav.privacidade}</Link>
            <Link href="/cookies">{t.nav.cookies}</Link>
            <Link href="/termos">{t.nav.termos}</Link>
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
