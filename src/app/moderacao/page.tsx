'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

type Report = {
  id: string;
  reason: string;
  details: string | null;
  status: string;
  createdAt: string;
  alert: { id: string; category: string; description: string; status: string; latitudePublic: number; longitudePublic: number };
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

  async function act(id: string, action: 'review' | 'dismiss' | 'hide' | 'remove') {
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
        {reports.map((report) => (
          <article className="card moderation-card" key={report.id}>
            <span className="mini-label">{report.reason} · {report.status}</span>
            <h3>{report.alert.category}</h3>
            <p>{report.alert.description}</p>
            {report.details && <p className="moderation-detail">Denúncia: {report.details}</p>}
            <p className="muted">Área pública: {report.alert.latitudePublic}, {report.alert.longitudePublic}</p>
            <div className="moderation-actions">
              <button disabled={busy === report.id} onClick={() => act(report.id, 'review')}>Analisar</button>
              <button disabled={busy === report.id} onClick={() => act(report.id, 'dismiss')}>Descartar</button>
              <button disabled={busy === report.id} onClick={() => act(report.id, 'hide')}>Ocultar</button>
              <button className="danger" disabled={busy === report.id} onClick={() => act(report.id, 'remove')}>Remover</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
