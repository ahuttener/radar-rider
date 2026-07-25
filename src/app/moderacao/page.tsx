'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { catById } from '@/lib/display';

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

// Rótulos legíveis. A tela mostrava os códigos crus do banco
// ("IDENTIFICACAO · OPEN · ALERTA ACTIVE"), que dizem pouco para quem está
// moderando e nada para quem entra ali pela primeira vez.
const MOTIVO: Record<string, string> = {
  identificacao: 'Motivo: identifica uma pessoa',
  falso: 'Motivo: alerta falso',
  odio: 'Motivo: discurso de ódio',
  privacidade: 'Motivo: expõe dado pessoal',
  outro: 'Motivo: outro',
};

const SITUACAO: Record<string, string> = {
  open: 'aberta',
  reviewing: 'em análise',
  resolved: 'resolvida',
  dismissed: 'descartada',
};

const ALERTA: Record<string, string> = {
  active: 'alerta no ar',
  expired: 'alerta vencido',
  hidden: 'alerta oculto',
  removed: 'alerta removido',
};

export default function Moderacao() {
  const { data: session, status } = useSession();
  const staff = session?.user?.role === 'admin' || session?.user?.role === 'moderator';
  const [reports, setReports] = useState<Report[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [aviso, setAviso] = useState('');
  const [instalacoes, setInstalacoes] = useState<
    { total: number; ultimos7dias: number; porPais: Record<string, number> } | null
  >(null);

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

  // Só busca a fila quando a sessão já resolveu E o usuário é staff. Sem isto,
  // um visitante disparava um fetch que voltava 401 e sujava o console, além de
  // ver a casca da tela de moderação.
  useEffect(() => {
    if (status === 'loading') return;
    if (staff) load();
    else setLoading(false);
  }, [status, staff, load]);

  // Quantas vezes o app foi instalado. Falha em silêncio: é informação
  // complementar e não pode impedir a moderação de trabalhar.
  useEffect(() => {
    if (!staff) return;
    fetch('/api/metrics/install', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setInstalacoes(d))
      .catch(() => {});
  }, [staff]);

  // O que dizer depois de cada ação. A denúncia sai da fila quando é resolvida,
  // então a frase é a única prova, para quem moderou, de que a coisa aconteceu.
  const CONFIRMACAO: Record<string, string> = {
    review: 'Denúncia marcada como "em análise". Ela continua na fila.',
    dismiss: 'Denúncia descartada: o alerta continua no ar.',
    hide: 'Alerta ocultado do mapa. A denúncia saiu da fila.',
    remove: 'Alerta removido do mapa. A denúncia saiu da fila.',
    restore: 'Alerta restaurado: voltou para o mapa.',
  };

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
      // Feedback explícito. Sem isto, resolver uma denúncia a fazia sumir da
      // fila sem dizer nada — e quem moderou ficava sem saber se funcionou.
      setAviso(CONFIRMACAO[action]);
      setError('');
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
        {status === 'loading' && <div className="card muted">Carregando…</div>}
        {status !== 'loading' && !staff && (
          <div className="card muted">
            <b>Acesso restrito.</b> Esta área é só para a moderação.{' '}
            <Link href="/">Voltar ao Radar Rider</Link>.
          </div>
        )}
        {staff && loading && <div className="card muted">Carregando…</div>}
        {staff && error && <div className="card data-empty-error" role="alert"><b>{error}</b></div>}
        {staff && instalacoes && (
          <div className="card">
            <span className="mini-label">Instalações do app</span>
            <div className="stats" style={{ marginTop: 8 }}>
              <div className="stat green">
                <b>{instalacoes.total}</b><span>Total</span>
              </div>
              <div className="stat">
                <b>{instalacoes.ultimos7dias}</b><span>Últimos 7 dias</span>
              </div>
              <div className="stat">
                <b>{(instalacoes.porPais.IE ?? 0)} / {(instalacoes.porPais.GB ?? 0)}</b>
                <span>Irlanda / UK</span>
              </div>
            </div>
            <p className="muted" style={{ fontSize: 11, marginTop: 8, lineHeight: 1.45 }}>
              Contagem anônima, por aparelho. Quem instalou antes desta data não
              entra na conta, e o mesmo aparelho só conta uma vez.
            </p>
          </div>
        )}

        {staff && aviso && !error && (
          <div className="card privacy-box ok" role="status" style={{ display: 'block' }}>
            <b>✓ {aviso}</b>
          </div>
        )}
        {staff && !loading && !error && reports.length === 0 && <div className="card muted">Nenhuma denúncia pendente.</div>}
        {staff && reports.map((report) => {
          const foraDoAr = report.alert.status === 'hidden' || report.alert.status === 'removed';
          return (
            <article className="card moderation-card" key={report.id}>
              <span className="mini-label">
                {MOTIVO[report.reason] ?? report.reason}
                {' · '}{SITUACAO[report.status] ?? report.status}
                {' · '}{ALERTA[report.alert.status] ?? report.alert.status}
                {' · '}{new Date(report.createdAt).toLocaleString('pt-BR')}
              </span>
              <h3>{catById(report.alert.category)?.label ?? report.alert.category}</h3>

              {/* Antes o texto do alerta e o comentário da denúncia apareciam
                  como dois parágrafos soltos, sem dizer qual era qual. */}
              <p className="moderation-campo">
                <b>Texto do alerta:</b> {report.alert.description}
              </p>
              <p className="moderation-detail">
                <b>Comentário de quem denunciou:</b>{' '}
                {report.details
                  ? report.details
                  : /* Sem isto, o campo vazio não desenhava nada e era
                       impossível saber se a pessoa não escreveu ou se a tela
                       tinha falhado. O comentário é opcional no formulário. */
                    <i className="muted">
                      não escreveu nada — o comentário é opcional, então a
                      denúncia veio só com o motivo acima.
                    </i>}
              </p>
              {/* A área pública era só um par de números na tela — não dava para
                  saber onde o alerta fica nem julgar se fazia sentido. Agora
                  abre o local no mapa, que é o que a moderação precisa ver. */}
              <p className="muted">
                Área pública:{' '}
                <a
                  href={`https://www.openstreetmap.org/?mlat=${report.alert.latitudePublic}&mlon=${report.alert.longitudePublic}#map=15/${report.alert.latitudePublic}/${report.alert.longitudePublic}`}
                  target="_blank"
                  rel="noopener"
                  className="moderation-map-link"
                >
                  📍 ver no mapa ({report.alert.latitudePublic}, {report.alert.longitudePublic})
                </a>
              </p>
              <div className="moderation-actions">
                {/* "Analisar" parecia abrir o alerta, mas só muda o status para
                    "em análise". O rótulo agora diz o que o botão faz. */}
                <button disabled={busy === report.id} onClick={() => act(report.id, 'review')}>Marcar em análise</button>
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
