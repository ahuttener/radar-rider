'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import {
  CATEGORIES, catById, severityClass, formatDistance, timeAgo,
  type AlertaPublico, type CategoryId,
} from '@/lib/display';
import { distanceMetres, CONFIRM_RADIUS_M } from '@/lib/geo';

// O mapa só existe no navegador: o Leaflet mexe em window ao ser importado.
const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => <div id="map" />,
});

type Tela = 'map' | 'alerts' | 'detail' | 'report' | 'profile';
type Posicao = { lat: number; lng: number; accuracy: number };

export default function RadarApp() {
  const { data: session, status } = useSession();
  const logado = status === 'authenticated';

  const [tela, setTela] = useState<Tela>('map');
  const [splash, setSplash] = useState(true);
  const [alertas, setAlertas] = useState<AlertaPublico[]>([]);
  const [meus, setMeus] = useState<AlertaPublico[]>([]);
  const [aba, setAba] = useState<'ativos' | 'hist'>('ativos');
  const [pos, setPos] = useState<Posicao | null>(null);
  const [calor, setCalor] = useState(false);
  const [detalhe, setDetalhe] = useState<string | null>(null);
  const [foco, setFoco] = useState<{ lat: number; lng: number } | null>(null);
  const [modal, setModal] = useState<'emergencia' | 'denuncia' | 'instalar' | null>(null);
  const [toast, setToast] = useState<{ texto: string; erro?: boolean } | null>(null);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aviso = useCallback((texto: string, erro = false) => {
    setToast({ texto, erro });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  /* ---------- dados ---------- */

  const carregar = useCallback(async () => {
    try {
      const r = await fetch('/api/alerts', { cache: 'no-store' });
      const j = await r.json();
      setAlertas(j.alerts ?? []);
    } catch {
      /* offline: mantém o que já estava na tela */
    }
  }, []);

  const carregarMeus = useCallback(async () => {
    if (!logado) return setMeus([]);
    try {
      const r = await fetch('/api/alerts/mine', { cache: 'no-store' });
      const j = await r.json();
      setMeus(j.alerts ?? []);
    } catch {
      /* silencioso */
    }
  }, [logado]);

  useEffect(() => {
    carregar();
    carregarMeus();
    // Sem Supabase não há tempo real. 30s é o meio-termo: rápido o bastante
    // para um alerta chegar enquanto a pessoa olha, leve o bastante para não
    // torrar a bateria e o pacote de dados de quem está na rua o dia todo.
    const t = setInterval(carregar, 30_000);
    return () => clearInterval(t);
  }, [carregar, carregarMeus]);

  useEffect(() => {
    const t = setTimeout(() => setSplash(false), 900);
    return () => clearTimeout(t);
  }, []);

  /* ---------- GPS ---------- */

  const localizar = useCallback((silencioso = false) => {
    return new Promise<Posicao>((resolve, reject) => {
      if (!navigator.geolocation) {
        const e = new Error('GPS não disponível neste aparelho.');
        if (!silencioso) aviso(e.message, true);
        return reject(e);
      }
      navigator.geolocation.getCurrentPosition(
        (p) => {
          const novo = { lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy };
          setPos(novo);
          resolve(novo);
        },
        (err) => {
          const e = new Error(
            err.code === 1 ? 'Permissão de localização negada.' : 'Não foi possível obter a localização.',
          );
          if (!silencioso) aviso(e.message, true);
          reject(e);
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
      );
    });
  }, [aviso]);

  useEffect(() => {
    localizar(true).catch(() => {});
  }, [localizar]);

  /* ---------- derivados ---------- */

  const lista = aba === 'hist' ? meus : alertas;
  const alertaAberto = useMemo(
    () => alertas.find((a) => a.id === detalhe) ?? meus.find((a) => a.id === detalhe) ?? null,
    [detalhe, alertas, meus],
  );

  const resumo = useMemo(
    () => ({
      total: alertas.length,
      alta: alertas.filter((a) => catById(a.category).severity === 'alta').length,
      vivo: alertas.filter((a) => a.isOngoing).length,
    }),
    [alertas],
  );

  function distanciaAte(a: AlertaPublico) {
    if (!pos) return null;
    return distanceMetres(pos, { lat: a.latitudePublic, lng: a.longitudePublic });
  }

  /* ---------- ações ---------- */

  async function confirmar(a: AlertaPublico) {
    if (!logado) return (window.location.href = '/entrar');
    try {
      const p = await localizar();
      const d = Math.round(distanceMetres(p, { lat: a.latitudePublic, lng: a.longitudePublic }));
      if (d > CONFIRM_RADIUS_M) {
        return aviso(
          `Você está a ${formatDistance(d)} daqui. Só dá para confirmar a até ${formatDistance(CONFIRM_RADIUS_M)}.`,
          true,
        );
      }
      const r = await fetch(`/api/alerts/${a.id}/confirm`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ latitude: p.lat, longitude: p.lng }),
      });
      const j = await r.json();
      if (!r.ok) return aviso(j.erro ?? 'Não foi possível confirmar.', true);
      aviso('Alerta confirmado. Obrigado por ajudar.');
      carregar();
    } catch {
      /* o localizar já avisou */
    }
  }

  const nome = session?.user?.name ?? 'Rider';
  const ehStaff = session?.user?.role === 'admin' || session?.user?.role === 'moderator';

  return (
    <>
      {splash && (
        <div id="splash">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon-512.png" alt="Radar Rider" />
          <p>DENUNCIE · INFORME · <b>PROTEJA</b></p>
        </div>
      )}

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
          <div className="top-actions">
            <button className="sos" onClick={() => setModal('emergencia')}>🚨 Emergência</button>
          </div>
        </header>

        <main>
          {/* ================= MAPA ================= */}
          <section className={`screen ${tela === 'map' ? 'active' : ''}`}>
            <div className="map-wrap">
              <MapView
                alerts={alertas}
                me={pos}
                heat={calor}
                focus={foco}
                onPick={(id) => { setDetalhe(id); setTela('detail'); }}
              />
              <div className="map-top">
                <div className="privacy-strip">
                  📍 A posição dos alertas é aproximada. Não identifique pessoas, veículos ou casas.
                </div>
                <button
                  className={`chip-toggle ${calor ? 'on' : ''}`}
                  onClick={() => setCalor((v) => !v)}
                  title="Mapa de calor"
                >🔥</button>
              </div>

              <div className="summary">
                <div className="row"><h3>Situação agora</h3><small>ao vivo</small></div>
                <div className="stats">
                  <div className="stat green"><b>{resumo.total}</b><span>Alertas ativos</span></div>
                  <div className="stat red"><b>{resumo.alta}</b><span>Risco alto</span></div>
                  <div className="stat amber"><b>{resumo.vivo}</b><span>Acontecendo</span></div>
                </div>
                <button className="btn ghost" style={{ marginTop: 10 }} onClick={() => localizar()}>
                  ◎ Minha localização
                </button>
              </div>
            </div>
          </section>

          {/* ================= ALERTAS ================= */}
          <section className={`screen ${tela === 'alerts' ? 'active' : ''}`}>
            <div className="pad">
              <h2 className="title">Alertas</h2>
              <div className="tabs">
                <div className={`tab ${aba === 'ativos' ? 'on' : ''}`} onClick={() => setAba('ativos')}>Ativos</div>
                <div className={`tab ${aba === 'hist' ? 'on' : ''}`} onClick={() => setAba('hist')}>Meu histórico</div>
              </div>

              {lista.length === 0 ? (
                <div className="card muted">
                  {aba === 'hist'
                    ? logado ? 'Você ainda não publicou nenhum alerta.' : 'Entre na sua conta para ver seu histórico.'
                    : 'Nenhum alerta ativo na comunidade agora. Isso é uma boa notícia.'}
                </div>
              ) : (
                lista.map((a) => {
                  const c = catById(a.category);
                  const d = distanciaAte(a);
                  return (
                    <div key={a.id} className="card alert-item"
                         onClick={() => { setDetalhe(a.id); setTela('detail'); }}>
                      <div className={`alert-ico ai-${severityClass(a.category)}`}>{c.icon}</div>
                      <div className="alert-body">
                        <h4>{c.label} {a.isOngoing && <span className="badge alta">AO VIVO</span>}</h4>
                        <p>{a.description}</p>
                        <div className="meta">
                          <span>{timeAgo(a.createdAt)}</span>
                          {d !== null && <span>{formatDistance(d)}</span>}
                        </div>
                        <div className="chips">
                          <Confianca n={a.confirmationsCount} />
                          <span className="area-pill">📍 Área aproximada</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* ================= DETALHE ================= */}
          <section className={`screen ${tela === 'detail' ? 'active' : ''}`}>
            <div className="pad">
              {alertaAberto && (
                <Detalhe
                  a={alertaAberto}
                  distancia={distanciaAte(alertaAberto)}
                  onVoltar={() => setTela('alerts')}
                  onMapa={() => {
                    setFoco({ lat: alertaAberto.latitudePublic, lng: alertaAberto.longitudePublic });
                    setTela('map');
                  }}
                  onConfirmar={() => confirmar(alertaAberto)}
                  onDenunciar={() => setModal('denuncia')}
                />
              )}
            </div>
          </section>

          {/* ================= REPORTAR ================= */}
          <section className={`screen ${tela === 'report' ? 'active' : ''}`}>
            <div className="pad">
              <Reportar
                logado={logado}
                pedirPosicao={localizar}
                aviso={aviso}
                aoPublicar={() => { carregar(); carregarMeus(); setTela('alerts'); }}
              />
            </div>
          </section>

          {/* ================= PERFIL ================= */}
          <section className={`screen ${tela === 'profile' ? 'active' : ''}`}>
            <div className="pad">
              {!logado ? (
                <div className="card">
                  <h2 className="title">Entre no Radar Rider</h2>
                  <p className="muted">
                    Crie uma conta para publicar, confirmar e denunciar alertas.
                    Seu nome nunca aparece junto do alerta.
                  </p>
                  <Link className="btn primary" style={{ marginTop: 14 }} href="/entrar">
                    Criar conta ou entrar
                  </Link>
                </div>
              ) : (
                <>
                  <div className="prof-head">
                    <div className="prof-av">🛵</div>
                    <div>
                      <h3>{nome}</h3>
                      <p className="muted">{session?.user?.email}</p>
                    </div>
                    <button className="ghost-pill" onClick={() => signOut({ callbackUrl: '/' })}>Sair</button>
                  </div>

                  <div className="card">
                    <span className="mini-label">Sua atividade</span>
                    <div className="rep-grid" style={{ marginTop: 10 }}>
                      <div className="stat"><b>{meus.length}</b><span>Alertas</span></div>
                      <div className="stat"><b>{meus.reduce((s, a) => s + a.confirmationsCount, 0)}</b><span>Confirmações</span></div>
                      <div className="stat"><b>{meus.filter((a) => a.status === 'active').length}</b><span>No ar</span></div>
                    </div>
                    <p className="rep-expl">
                      Confirmar o alerta de outro entregador perto de você ajuda a comunidade
                      a separar o que é real do que é boato.
                    </p>
                  </div>

                  <div className="card">
                    <h3>Minha conta</h3>
                    <div className="stack" style={{ marginTop: 10 }}>
                      <Link className="btn ghost" href="/esqueci-a-senha">Trocar minha senha</Link>
                      {ehStaff && <Link className="btn ghost" href="/moderacao">Painel de moderação</Link>}
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>
        </main>

        <nav className="bottom-nav">
          <button className={`nav-btn ${tela === 'map' ? 'on' : ''}`} onClick={() => setTela('map')}>
            <span className="ic">🗺️</span>Mapa
          </button>
          <button className={`nav-btn ${tela === 'alerts' ? 'on' : ''}`} onClick={() => setTela('alerts')}>
            <span className="ic">⚠️</span>Alertas
          </button>
          <button className="nav-btn fab" onClick={() => setTela('report')}>
            <span className="ic">＋</span>
          </button>
          <button className={`nav-btn ${tela === 'profile' ? 'on' : ''}`} onClick={() => setTela('profile')}>
            <span className="ic">👤</span>Perfil
          </button>
        </nav>

        {toast && <div className={`show ${toast.erro ? 'err' : ''}`} id="toast">{toast.texto}</div>}
      </div>

      {modal === 'emergencia' && (
        <Modal titulo="🚨 Emergência" onFechar={() => setModal(null)}>
          <div className="privacy-box">
            <span>⚠️</span>
            <p>Em perigo imediato, ligue <b>999</b> ou <b>112</b>. O Radar Rider não substitui a polícia.</p>
          </div>
          <div className="emergency-grid">
            <a className="btn danger" href="tel:999">Ligar 999</a>
            <a className="btn danger" href="tel:112">Ligar 112</a>
          </div>
          <div className="stack" style={{ marginTop: 10 }}>
            <button className="btn primary" onClick={async () => {
              try {
                const p = await localizar();
                const texto = `🚨 Preciso de ajuda. Esta é minha localização atual:\nhttps://www.google.com/maps?q=${p.lat},${p.lng}\n\nEnviado pelo Radar Rider.`;
                window.location.href = `https://wa.me/?text=${encodeURIComponent(texto)}`;
              } catch { /* já avisou */ }
            }}>Mandar minha localização no WhatsApp</button>
            <a className="btn ghost" target="_blank" rel="noopener"
               href="https://www.garda.ie/en/contact-us/station-directory/">Achar uma Garda Station</a>
          </div>
        </Modal>
      )}

      {modal === 'denuncia' && alertaAberto && (
        <Denunciar
          alertId={alertaAberto.id}
          onFechar={() => setModal(null)}
          aviso={aviso}
          logado={logado}
        />
      )}
    </>
  );
}

/* ================= peças ================= */

function Confianca({ n }: { n: number }) {
  if (n >= 3) return <span className="confidence high">✓ {n} confirmações</span>;
  if (n === 0) return <span className="confidence new">Sem confirmação</span>;
  return <span className="confidence new">{n} confirmação{n > 1 ? 'ões' : ''}</span>;
}

function Modal({ titulo, children, onFechar }: {
  titulo: string; children: React.ReactNode; onFechar: () => void;
}) {
  return (
    <div className="modal show" onClick={(e) => { if (e.target === e.currentTarget) onFechar(); }}>
      <div className="modal-card">
        <div className="modal-head">
          <h3>{titulo}</h3>
          <button className="close" onClick={onFechar}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Detalhe({ a, distancia, onVoltar, onMapa, onConfirmar, onDenunciar }: {
  a: AlertaPublico;
  distancia: number | null;
  onVoltar: () => void;
  onMapa: () => void;
  onConfirmar: () => void;
  onDenunciar: () => void;
}) {
  const c = catById(a.category);
  const expirado = new Date(a.expiresAt) <= new Date() || a.status !== 'active';
  const hora = new Date(a.expiresAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <>
      <button className="back" onClick={onVoltar}>← Voltar</button>
      <div className="detail-head">
        <div className={`big ai-${severityClass(a.category)}`}>{c.icon}</div>
        <h2 className="title">{c.label}</h2>
        <div className="chips center">
          <Confianca n={a.confirmationsCount} />
          {a.isOngoing && <span className="badge alta">AO VIVO</span>}
        </div>
      </div>

      <div className="card">
        <p>{a.description}</p>
        <div className="meta" style={{ marginTop: 10 }}>
          <span>Publicado {timeAgo(a.createdAt)}</span>
          {distancia !== null && <span>{formatDistance(distancia)} de você</span>}
        </div>
      </div>

      <div className="privacy-box">
        <span>🛡️</span>
        <p>
          A posição é <b>aproximada</b>, para proteger quem publicou. Não vá ao local
          para confrontar ninguém — em risco imediato, ligue 999 ou 112.
        </p>
      </div>

      <div className="confirm-row">
        {!expirado && <button className="btn primary" onClick={onConfirmar}>✓ Confirmar</button>}
        <button className="btn ghost" onClick={onMapa}>Ver no mapa</button>
      </div>

      <div className="expiry">
        {expirado ? <>Este alerta já <b>expirou</b></> : <>Expira às <b>{hora}</b></>}
      </div>

      {!expirado && (
        <button className="danger-link" onClick={onDenunciar}>Denunciar este alerta</button>
      )}
    </>
  );
}

function Reportar({ logado, pedirPosicao, aviso, aoPublicar }: {
  logado: boolean;
  pedirPosicao: (silencioso?: boolean) => Promise<Posicao>;
  aviso: (t: string, erro?: boolean) => void;
  aoPublicar: () => void;
}) {
  const [passo, setPasso] = useState(1);
  const [categoria, setCategoria] = useState<CategoryId | null>(null);
  const [descricao, setDescricao] = useState('');
  const [quando, setQuando] = useState(0);
  const [duracao, setDuracao] = useState(180);
  const [acontecendo, setAcontecendo] = useState(false);
  const [posicao, setPosicao] = useState<Posicao | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (!logado) {
    return (
      <div className="card">
        <h2 className="title">Entre para publicar</h2>
        <p className="muted">
          Só quem tem conta pode publicar alerta. É assim que a moderação consegue
          agir quando alguém abusa — mas seu nome nunca aparece no alerta.
        </p>
        <Link className="btn primary" style={{ marginTop: 14 }} href="/entrar">Criar conta ou entrar</Link>
      </div>
    );
  }

  async function irParaPasso2() {
    // Pede o GPS aqui, e não no envio, para a pessoa não escrever tudo e só
    // então descobrir que a permissão está negada.
    try {
      setPosicao(await pedirPosicao());
      setPasso(2);
    } catch { /* já avisou */ }
  }

  async function publicar() {
    if (descricao.trim().length < 10) return aviso('Descreva o risco com pelo menos 10 caracteres.', true);
    setEnviando(true);
    try {
      const p = posicao ?? (await pedirPosicao());
      const r = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          category: categoria,
          description: descricao.trim(),
          latitude: p.lat,
          longitude: p.lng,
          isOngoing: acontecendo,
          durationMinutes: duracao,
          occurredMinutesAgo: quando,
        }),
      });
      const j = await r.json();
      if (!r.ok) return aviso(j.erro ?? 'Não foi possível publicar.', true);

      aviso('Alerta publicado com área aproximada.');
      setPasso(1); setCategoria(null); setDescricao(''); setAcontecendo(false);
      aoPublicar();
    } catch {
      aviso('Não foi possível publicar. Verifique sua conexão.', true);
    } finally {
      setEnviando(false);
    }
  }

  const c = categoria ? catById(categoria) : null;

  return (
    <>
      <h2 className="title">Reportar ocorrência</h2>

      <div className="steps">
        {[1, 2, 3].map((n) => (
          <span key={n} style={{ display: 'contents' }}>
            <div className={`stepdot ${passo >= n ? 'on' : ''}`}>{n}</div>
            {n < 3 && <div className="stepline" />}
          </span>
        ))}
      </div>

      {passo === 1 && (
        <div>
          <label className="lbl">Tipo de ocorrência</label>
          {CATEGORIES.map((cat) => (
            <div key={cat.id}
                 className={`type-opt ${categoria === cat.id ? 'sel' : ''}`}
                 onClick={() => setCategoria(cat.id)}>
              {cat.icon} {cat.label}
            </div>
          ))}
          <button className="btn primary" style={{ marginTop: 10 }}
                  disabled={!categoria} onClick={irParaPasso2}>Próximo</button>
        </div>
      )}

      {passo === 2 && (
        <div>
          <label className="lbl">Local</label>
          <div className="card loc-card">
            📍
            <div>
              <b>Sua localização atual</b>
              <p>
                {posicao ? `Precisão de ${Math.round(posicao.accuracy)} m · ` : ''}
                publicada como área aproximada
              </p>
            </div>
          </div>

          <label className="lbl">O que aconteceu</label>
          <textarea maxLength={500} value={descricao} onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Descreva só o risco e a área. Ex.: grupo bloqueando a passagem e intimidando entregadores." />

          <div className="privacy-box" style={{ marginTop: 12 }}>
            <span>🛡️</span>
            <p>
              <b>Proteja a privacidade.</b> Não escreva nomes, idade, aparência,
              nacionalidade, placa ou endereço. Descreva o comportamento, nunca a pessoa.
            </p>
          </div>

          <label className="lbl">Quando aconteceu</label>
          <select value={quando} onChange={(e) => setQuando(Number(e.target.value))}>
            <option value={0}>Agora</option>
            <option value={5}>Há menos de 5 minutos</option>
            <option value={15}>Há menos de 15 minutos</option>
            <option value={30}>Há menos de 30 minutos</option>
            <option value={60}>Há menos de 1 hora</option>
          </select>

          <label className="lbl">Quanto tempo o alerta fica no ar</label>
          <select value={duracao} onChange={(e) => setDuracao(Number(e.target.value))}>
            <option value={60}>1 hora</option>
            <option value={180}>3 horas</option>
            <option value={360}>6 horas</option>
            <option value={720}>12 horas</option>
          </select>

          <label className="switch-line">
            <input type="checkbox" checked={acontecendo} onChange={(e) => setAcontecendo(e.target.checked)} />
            Ainda está acontecendo
          </label>

          <div className="row-btns">
            <button className="btn ghost" onClick={() => setPasso(1)}>Voltar</button>
            <button className="btn primary" onClick={() => setPasso(3)}>Próximo</button>
          </div>
        </div>
      )}

      {passo === 3 && (
        <div>
          <label className="lbl">Confirme antes de publicar</label>
          <div className="card">
            <h4>{c?.icon} {c?.label}</h4>
            <p className="muted">{descricao.trim() || 'Sem descrição adicional.'}</p>
            <p className="muted" style={{ marginTop: 10 }}>📍 Sua área aproximada</p>
            <p style={{ color: 'var(--amber)', fontSize: 12, marginTop: 6 }}>
              ⏰ Fica no ar por {duracao >= 60 ? `${duracao / 60} h` : `${duracao} min`}
            </p>
          </div>

          <div className="privacy-box ok">
            <span>🛡️</span>
            <p>
              Seu alerta é <b>anônimo</b> para os outros entregadores. Alerta falso
              derruba sua reputação e pode suspender a conta.
            </p>
          </div>

          <div className="row-btns">
            <button className="btn ghost" onClick={() => setPasso(2)}>Voltar</button>
            <button className="btn primary" onClick={publicar} disabled={enviando}>
              {enviando ? 'Publicando…' : '🚀 Publicar alerta'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function Denunciar({ alertId, onFechar, aviso, logado }: {
  alertId: string;
  onFechar: () => void;
  aviso: (t: string, erro?: boolean) => void;
  logado: boolean;
}) {
  const [motivo, setMotivo] = useState('identificacao');
  const [detalhes, setDetalhes] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviar() {
    if (!logado) return (window.location.href = '/entrar');
    setEnviando(true);
    try {
      const r = await fetch(`/api/alerts/${alertId}/report`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ reason: motivo, details: detalhes.trim() || undefined }),
      });
      const j = await r.json();
      if (!r.ok) return aviso(j.erro ?? 'Não foi possível enviar.', true);
      aviso('Denúncia enviada para moderação.');
      onFechar();
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal titulo="Denunciar alerta" onFechar={onFechar}>
      <div className="stack">
        <label>
          Motivo
          <select value={motivo} onChange={(e) => setMotivo(e.target.value)}>
            <option value="identificacao">Identifica uma pessoa</option>
            <option value="falso">Informação falsa</option>
            <option value="odio">Ódio, ameaça ou assédio</option>
            <option value="privacidade">Violação de privacidade</option>
            <option value="outro">Outro</option>
          </select>
        </label>
        <label>
          Detalhes (opcional)
          <textarea maxLength={300} value={detalhes} onChange={(e) => setDetalhes(e.target.value)} />
        </label>
        <button className="btn danger" onClick={enviar} disabled={enviando}>
          {enviando ? 'Enviando…' : 'Enviar para moderação'}
        </button>
      </div>
    </Modal>
  );
}
