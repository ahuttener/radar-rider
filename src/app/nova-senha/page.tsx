'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function Formulario() {
  const token = useSearchParams().get('token') ?? '';
  const [senha, setSenha] = useState('');
  const [repetir, setRepetir] = useState('');
  const [msg, setMsg] = useState<{ texto: string; ok?: boolean } | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [pronto, setPronto] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (senha.length < 8) return setMsg({ texto: 'A senha precisa ter ao menos 8 caracteres.' });
    if (senha !== repetir) return setMsg({ texto: 'As duas senhas não são iguais.' });

    setEnviando(true);
    try {
      const r = await fetch('/api/password/reset', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token, password: senha }),
      });
      const j = await r.json();
      if (!r.ok) return setMsg({ texto: j.erro ?? 'Não foi possível trocar a senha.' });
      setPronto(true);
    } catch {
      setMsg({ texto: 'Falha de conexão. Tente de novo.' });
    } finally {
      setEnviando(false);
    }
  }

  if (!token) {
    return (
      <div className="card">
        <h2 className="title">Link incompleto</h2>
        <p className="muted">Abra o endereço exatamente como veio no e-mail.</p>
        <Link className="btn ghost" style={{ marginTop: 14 }} href="/esqueci-a-senha">Pedir um link novo</Link>
      </div>
    );
  }

  if (pronto) {
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <div className="detail-head">
          <div className="big ai-green">✅</div>
          <h2 className="title">Senha alterada</h2>
        </div>
        <p className="muted">Agora entre com a senha nova.</p>
        <Link className="btn primary" style={{ marginTop: 16 }} href="/entrar">Entrar</Link>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="title">Criar nova senha</h2>
      <p className="muted">Escolha uma senha nova para a sua conta.</p>
      <form className="stack" style={{ marginTop: 14 }} onSubmit={enviar}>
        <label>
          Nova senha
          <input type="password" minLength={8} required autoComplete="new-password"
                 value={senha} onChange={(e) => setSenha(e.target.value)} />
        </label>
        <label>
          Repita a nova senha
          <input type="password" minLength={8} required autoComplete="new-password"
                 value={repetir} onChange={(e) => setRepetir(e.target.value)} />
        </label>
        <button className="btn primary" type="submit" disabled={enviando}>
          {enviando ? 'Salvando…' : 'Salvar nova senha'}
        </button>
        {msg && <div className={msg.ok ? 'success' : 'error'}>{msg.texto}</div>}
      </form>
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
      <div className="pad">
        <Suspense fallback={<div className="card muted">Carregando…</div>}>
          <Formulario />
        </Suspense>
      </div>
    </div>
  );
}
