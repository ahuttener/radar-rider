'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';

export default function ExcluirConta() {
  const { status } = useSession();
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);
  const [sending, setSending] = useState(false);

  async function excluir() {
    setSending(true);
    setMessage(null);
    try {
      const response = await fetch('/api/account/delete', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ confirmation }),
      });
      const body = await response.json();
      if (!response.ok) {
        setMessage({ text: body.erro ?? 'Não foi possível excluir a conta.', error: true });
        return;
      }
      await signOut({ callbackUrl: '/' });
    } catch {
      setMessage({ text: 'Falha de conexão. Nada foi excluído; tente novamente.', error: true });
    } finally {
      setSending(false);
    }
  }

  return (
    <div id="app">
      <header className="topbar">
        <div className="brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon-192.png" alt="" />
          <div><h1>RADAR <span>RIDER</span></h1><small>SEGURANÇA COMUNITÁRIA</small></div>
        </div>
        <Link className="ghost-pill" href="/" style={{ textDecoration: 'none' }}>← Voltar</Link>
      </header>
      <div className="pad">
        <article className="card legal">
          <h2 className="title">Excluir minha conta</h2>
          <p>
            A exclusão remove seu e-mail, nome, senha, tokens e a localização exata
            dos seus alertas. Alertas e registros de segurança podem continuar de
            forma anônima pelo período de retenção para preservar a utilidade do mapa
            e a integridade da moderação.
          </p>
          <p><b>Esta ação não pode ser desfeita.</b> Antes, você pode <a href="/api/account/export">baixar seus dados</a>.</p>

          {status === 'loading' ? (
            <p>Verificando sua sessão…</p>
          ) : status !== 'authenticated' ? (
            <Link className="btn primary" href="/entrar">Entrar para excluir a conta</Link>
          ) : (
            <div className="stack" style={{ marginTop: 16 }}>
              <label>
                Digite <b>EXCLUIR</b> para confirmar
                <input value={confirmation} onChange={(e) => setConfirmation(e.target.value)} />
              </label>
              <button className="btn danger" disabled={sending || confirmation !== 'EXCLUIR'} onClick={excluir}>
                {sending ? 'Excluindo…' : 'Excluir conta permanentemente'}
              </button>
              {message && <p className={message.error ? 'error' : 'success'}>{message.text}</p>}
            </div>
          )}
        </article>
      </div>
    </div>
  );
}
