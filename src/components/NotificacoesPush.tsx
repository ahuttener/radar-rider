'use client';

import { useEffect, useState } from 'react';
import type { CountryCode } from '@/lib/geo';

// Botão de ativar/desativar notificação push.
//
// Notifica por PAÍS escolhido (não por localização exata — o app não rastreia
// posição em segundo plano). A chave pública VAPID vem de env; se não existir,
// o recurso não aparece.

const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

// A chave VAPID vem em base64url; o pushManager quer um Uint8Array.
function chaveParaBytes(base64: string): Uint8Array {
  const pad = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + pad).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function NotificacoesPush({ pais }: { pais: CountryCode | 'todos' }) {
  const [suportado, setSuportado] = useState(false);
  const [ativo, setAtivo] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const ok = typeof window !== 'undefined'
      && 'serviceWorker' in navigator
      && 'PushManager' in window
      && !!VAPID;
    setSuportado(ok);
    if (!ok) return;
    // Já inscrito neste aparelho?
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setAtivo(!!sub))
      .catch(() => {});
  }, []);

  async function ativar() {
    setOcupado(true); setMsg('');
    try {
      const permissao = await Notification.requestPermission();
      if (permissao !== 'granted') {
        setMsg('Permissão negada. Você pode liberar nas configurações do navegador.');
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        // cast: os tipos novos do DOM exigem ArrayBuffer estrito; o Uint8Array
        // que geramos serve na prática.
        applicationServerKey: chaveParaBytes(VAPID!) as unknown as BufferSource,
      });
      const json = sub.toJSON();
      const r = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          p256dh: json.keys?.p256dh,
          auth: json.keys?.auth,
          // Sem país escolhido ainda, assume Irlanda (mercado padrão).
          country: pais === 'todos' ? 'IE' : pais,
        }),
      });
      if (!r.ok) throw new Error();
      setAtivo(true);
      setMsg('Pronto! Você vai receber alertas da sua região.');
    } catch {
      setMsg('Não foi possível ativar as notificações. Tente de novo.');
    } finally {
      setOcupado(false);
    }
  }

  async function desativar() {
    setOcupado(true); setMsg('');
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setAtivo(false);
      setMsg('Notificações desligadas.');
    } catch {
      setMsg('Não foi possível desligar agora.');
    } finally {
      setOcupado(false);
    }
  }

  if (!suportado) return null;

  return (
    <div className="card">
      <span className="mini-label">Notificações</span>
      <p className="muted" style={{ margin: '6px 0 12px' }}>
        Receba um aviso no celular quando surgir um alerta na sua região
        {pais === 'GB' ? ' (Reino Unido)' : ' (Irlanda)'}. Nada de rastrear sua
        localização — o aviso é pelo país que você escolheu.
      </p>
      <button
        className={`btn ${ativo ? 'ghost' : 'primary'}`}
        disabled={ocupado}
        onClick={ativo ? desativar : ativar}
      >
        {ocupado ? 'Aguarde…' : ativo ? 'Desativar notificações' : '🔔 Ativar notificações'}
      </button>
      {msg && <p className="muted" style={{ marginTop: 10, fontSize: 13 }}>{msg}</p>}
    </div>
  );
}
