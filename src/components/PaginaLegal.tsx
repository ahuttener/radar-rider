import Link from 'next/link';

// Moldura comum das páginas de texto legal (privacidade, cookies, termos).
//
// São páginas estáticas de propósito: nenhuma delas toca o banco. Numa
// hospedagem em que a rota de banco pode falhar, a política de privacidade
// tem que continuar de pé — é ela que a lei exige que esteja sempre acessível.

export function PaginaLegal({ titulo, atualizadoEm, children }: {
  titulo: string;
  atualizadoEm: string;
  children: React.ReactNode;
}) {
  return (
    <div id="app">
      <header className="topbar">
        <div className="brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon-192.png" alt="" />
          <div>
            <h1>RADAR <span>RIDER</span></h1>
            <small>SEGURANÇA COMUNITÁRIA</small>
          </div>
        </div>
        <Link className="ghost-pill" href="/" style={{ textDecoration: 'none' }}>← Voltar</Link>
      </header>

      <div className="pad">
        <article className="card legal">
          <h2 className="title">{titulo}</h2>
          <p className="legal-date">Última atualização: {atualizadoEm}</p>
          {children}

          <nav className="legal-nav">
            <Link href="/privacidade">Privacidade</Link>
            <Link href="/cookies">Cookies</Link>
            <Link href="/termos">Termos de uso</Link>
          </nav>
        </article>
      </div>
    </div>
  );
}
