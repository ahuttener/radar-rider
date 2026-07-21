'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function Confirmacao() {
  const params = useSearchParams();
  const token = params.get('token');
  const [estado, setEstado] = useState<'checando' | 'ok' | 'erro'>('checando');
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!token) {
      setEstado('erro');
      setErro('Link incompleto. Abra o endereço exatamente como veio no e-mail.');
      return;
    }
    // O token é consumido por POST, e não ao abrir a página: pré-carregador de
    // link de e-mail costuma fazer GET, e isso queimaria o link antes da
    // pessoa clicar.
    fetch('/api/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (r) => {
        const j = await r.json();
        if (r.ok) return setEstado('ok');
        setErro(j.erro ?? 'Não foi possível confirmar.');
        setEstado('erro');
      })
      .catch(() => {
        setErro('Falha de conexão. Tente abrir o link de novo.');
        setEstado('erro');
      });
  }, [token]);

  return (
    <div className="pad">
      <div className="card" style={{ textAlign: 'center' }}>
        {estado === 'checando' && <p className="muted">Confirmando sua conta…</p>}

        {estado === 'ok' && (
          <>
            <div className="detail-head">
              <div className="big ai-green">✅</div>
              <h2 className="title">Conta confirmada</h2>
            </div>
            <p className="muted">Pronto. Agora é só entrar e começar a usar o Radar Rider.</p>
            <Link className="btn primary" style={{ marginTop: 16 }} href="/entrar">Entrar na minha conta</Link>
          </>
        )}

        {estado === 'erro' && (
          <>
            <div className="detail-head">
              <div className="big ai-red">⚠️</div>
              <h2 className="title">Não deu para confirmar</h2>
            </div>
            <p className="muted">{erro}</p>
            <Link className="btn ghost" style={{ marginTop: 16 }} href="/entrar">Ir para o login</Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function Page() {
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
      </header>
      {/* useSearchParams exige Suspense: sem isso a página inteira vira dinâmica. */}
      <Suspense fallback={<div className="pad"><div className="card muted">Carregando…</div></div>}>
        <Confirmacao />
      </Suspense>
    </div>
  );
}
