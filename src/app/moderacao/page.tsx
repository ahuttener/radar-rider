'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

type Report = {
  id: string;
  reason: string;
  details: string | null;
  status: string;
  createdAt: string;
  alert: {
    id: string;
    userId: string;
    category: string;
    description: string;
    status: string;
    latitudePublic: number;
    longitudePublic: number;
  };
};

export default function Moderacao() {
  const [reports, setReports] = useState<Report[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/moderation/reports', { cache: 'no-store' });
      const body = await response.json();
      if (!response.ok) throw new Error(body.erro ?? 'Não foi possível carregar a fila.');
      setReports(body.reports);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível carregar a fila.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function act(id: string, action: 'review' | 'dismiss' | 'hide' | 'remove' | 'restore') {
    setBusy(id);
    try {
      const response = await fetch(`/api/moderation/reports/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.erro ?? 'Ação não concluída.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ação não concluída.');
    } finally { setBusy(null); }
  }

  // Suspende (7 dias) ou bane o autor do alerta. A razão é opcional e fica no
  // registro de moderação.
  async function actUser(reportId: string, userId: string, action: 'suspend' | 'ban') {
    const rotulo = action === 'ban' ? 'BANIR' : 'suspender por 7 dias';
    if (!window.confirm(`Confirma ${rotulo} o autor deste alerta?`)) return;
    const reason = window.prompt('Motivo (opcional):') ?? undefined;
    setBusy(reportId);
    try {
      const response = await fetch(`/api/moderation/users/${userId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action, reason, days: action === 'suspend' ? 7 : undefined }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.erro ?? 'Ação não concluída.');
      setError('');
      window.alert(action === 'ban' ? 'Autor banido.' : 'Autor suspenso por 7 dias.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ação não concluída.');
    } finally { setBusy(null); }
  }

  return (
    <div id="app">
      <header className="topbar">
        <div className="brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon-192.png" alt="" />
          <div><h1>RADAR <span>RIDER</span></h1><small>MODERAÇÃO</small></div>
        </div>
        <Link className="ghost-pill" href="/" style={{ textDecoration: 'none' }}>← Voltar</Link>
      </header>
      <div className="pad">
        <h2 className="title">Fila de denúncias</h2>
        {loading && <div className="card muted">Carregando…</div>}
        {error && <div className="card data-empty-error" role="alert"><b>{error}</b></div>}
        {!loading && !error && reports.length === 0 && <div className="card muted">Nenhuma denúncia pendente.</div>}
        {reports.map((report) => {
          const foraDoAr = report.alert.status === 'hidden' || report.alert.status === 'removed';
          return (
            <article className="card moderation-card" key={report.id}>
              <span className="mini-label">{report.reason} · {report.status} · alerta {report.alert.status}</span>
              <h3>{report.alert.category}</h3>
              <p>{report.alert.description}</p>
              {report.details && <p className="moderation-detail">Denúncia: {report.details}</p>}
              <p className="muted">Área pública: {report.alert.latitudePublic}, {report.alert.longitudePublic}</p>
              <div className="moderation-actions">
                <button disabled={busy === report.id} onClick={() => act(report.id, 'review')}>Analisar</button>
                <button disabled={busy === report.id} onClick={() => act(report.id, 'dismiss')}>Descartar</button>
                {foraDoAr
                  ? <button disabled={busy === report.id} onClick={() => act(report.id, 'restore')}>Restaurar</button>
                  : <button disabled={busy === report.id} onClick={() => act(report.id, 'hide')}>Ocultar</button>}
                <button className="danger" disabled={busy === report.id} onClick={() => act(report.id, 'remove')}>Remover</button>
              </div>
              <div className="moderation-actions" style={{ marginTop: 7 }}>
                <button disabled={busy === report.id} onClick={() => actUser(report.id, report.alert.userId, 'suspend')}>Suspender autor 7d</button>
                <button className="danger" disabled={busy === report.id} onClick={() => actUser(report.id, report.alert.userId, 'ban')}>Banir autor</button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
