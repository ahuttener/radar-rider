'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

export default function Entrar() {
  const router = useRouter();
  const [modo, setModo] = useState<'login' | 'criar'>('login');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [msg, setMsg] = useState<{ texto: string; ok?: boolean } | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setEnviando(true);

    try {
      if (modo === 'criar') {
        const r = await fetch('/api/register', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ email, password: senha, displayName: nome }),
        });
        const j = await r.json();
        if (!r.ok) return setMsg({ texto: j.erro ?? 'Não foi possível criar a conta.' });
        return setMsg({ texto: j.mensagem, ok: true });
      }

      const r = await signIn('credentials', { email, password: senha, redirect: false });
      if (r?.error) {
        // A mensagem é a mesma para senha errada e e-mail inexistente: separar
        // as duas entrega quem tem conta no app para quem estiver testando.
        const texto =
          r.error === 'EMAIL_NAO_CONFIRMADO'
            ? 'Confirme seu e-mail primeiro. O link está na sua caixa de entrada.'
            : 'E-mail ou senha incorretos.';
        return setMsg({ texto });
      }
      router.push('/');
      router.refresh();
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
        <Link className="ghost-pill" href="/" style={{ textDecoration: 'none' }}>← Voltar</Link>
      </header>

      <div className="pad">
        <div className="card">
          <div className="auth-tabs">
            <button className={`auth-tab ${modo === 'login' ? 'active' : ''}`}
                    onClick={() => { setModo('login'); setMsg(null); }}>Entrar</button>
            <button className={`auth-tab ${modo === 'criar' ? 'active' : ''}`}
                    onClick={() => { setModo('criar'); setMsg(null); }}>Criar conta</button>
          </div>

          <form className="stack" onSubmit={enviar}>
            {modo === 'criar' && (
              <label>
                Nome público
                <input value={nome} onChange={(e) => setNome(e.target.value)}
                       maxLength={40} required minLength={2}
                       placeholder="Como os outros entregadores vão te ver" />
              </label>
            )}
            <label>
              E-mail
              <input type="email" autoComplete="email" required
                     value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label>
              Senha
              <input type="password" minLength={8} required
                     autoComplete={modo === 'criar' ? 'new-password' : 'current-password'}
                     value={senha} onChange={(e) => setSenha(e.target.value)} />
            </label>

            <button className="btn primary" type="submit" disabled={enviando}>
              {enviando ? 'Aguarde…' : modo === 'criar' ? 'Criar minha conta' : 'Entrar'}
            </button>

            {modo === 'login' && (
              <Link className="btn ghost" href="/esqueci-a-senha">Esqueci minha senha</Link>
            )}

            {msg && <div className={msg.ok ? 'success' : 'error'}>{msg.texto}</div>}
          </form>
        </div>

        {modo === 'criar' && (
          <div className="privacy-box">
            <span>🛡️</span>
            <p>
              Seu nome nunca aparece junto de um alerta. A conta existe para a
              moderação poder agir quando alguém abusa — não para te identificar
              na rua.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
