'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function EsqueciASenha() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    try {
      const r = await fetch('/api/password/forgot', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error('Serviço indisponível');
      setMsg(j.mensagem ?? 'Se existir uma conta com esse e-mail, o link chegou nele.');
    } catch {
      setMsg('Falha de conexão. Tente de novo daqui a pouco.');
    } finally {
      setEnviando(false);
    }
  }

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
        <Link className="ghost-pill" href="/entrar" style={{ textDecoration: 'none' }}>← Voltar</Link>
      </header>

      <div className="pad">
        <div className="card">
          <h2 className="title">Esqueci minha senha</h2>
          <p className="muted">
            Digite o e-mail da sua conta. Mandamos um link para você criar uma senha nova.
          </p>
          <form className="stack" style={{ marginTop: 14 }} onSubmit={enviar}>
            <label>
              E-mail
              <input type="email" autoComplete="email" required
                     value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <button className="btn primary" type="submit" disabled={enviando}>
              {enviando ? 'Enviando…' : 'Enviar link de redefinição'}
            </button>
            {msg && <div className="success">{msg}</div>}
          </form>
        </div>
      </div>
    </div>
  );
}
