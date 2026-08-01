'use client';

import { useEffect, useRef, useState } from 'react';
import { paisPeloFusoHorario } from './SeletorPais';

// Instalação do app na tela inicial.
//
// Android e iPhone funcionam de formas diferentes e isso não dá para esconder:
// - Android dispara `beforeinstallprompt` e deixa abrir o instalador por código
// - iPhone NUNCA dispara esse evento. No Safari a instalação é manual, pelo
//   menu Compartilhar. Só resta explicar direito.
//
// Por isso o botão nunca some: se não houver instalador automático, ele abre as
// instruções. Botão que aparece e some sozinho confunde mais do que ajuda.

type PromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};

// Marca no aparelho que a instalação já foi contada, para o número não subir a
// cada vez que a pessoa abre o app.
const CHAVE_CONTADO = 'rr-instalacao-contada';

/**
 * Avisa o servidor que o app foi instalado. Uma vez por aparelho.
 *
 * Manda só o país (palpite pelo fuso, sem pedir GPS) — nada que identifique a
 * pessoa. É contagem agregada, do tipo "quantas instalações", não registro de
 * quem instalou.
 */
function contarInstalacao() {
  try {
    if (localStorage.getItem(CHAVE_CONTADO)) return;
    localStorage.setItem(CHAVE_CONTADO, '1');
  } catch {
    // Sem armazenamento não dá para garantir contagem única: melhor não contar
    // do que inflar o número a cada abertura.
    return;
  }
  const country = paisPeloFusoHorario();
  // keepalive: no Android o evento chega junto com a troca de contexto para o
  // app instalado, e sem isto a requisição morreria no meio.
  fetch('/api/metrics/install', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ country }),
    keepalive: true,
  }).catch(() => { /* métrica não pode atrapalhar a instalação */ });
}

export function useInstalacao() {
  const [prompt, setPrompt] = useState<PromptEvent | null>(null);
  const [instalado, setInstalado] = useState(false);

  useEffect(() => {
    // Já está rodando como app instalado? Então não faz sentido oferecer.
    const jaEhApp =
      window.matchMedia('(display-mode: standalone)').matches ||
      // Safari no iPhone não implementa display-mode; usa esta propriedade.
      (window.navigator as { standalone?: boolean }).standalone === true;
    setInstalado(jaEhApp);

    // Conta a instalação também quando o app abre já em modo standalone. É o
    // único caminho no iPhone: o Safari nunca dispara `appinstalled` quando a
    // pessoa usa "Adicionar à tela de início". Sem isto, todo iOS ficaria fora
    // da conta. A trava no localStorage garante uma contagem por aparelho.
    if (jaEhApp) contarInstalacao();

    const aoPoderInstalar = (e: Event) => {
      e.preventDefault();
      setPrompt(e as PromptEvent);
    };
    const aoInstalar = () => {
      setInstalado(true);
      setPrompt(null);
      contarInstalacao();
    };

    window.addEventListener('beforeinstallprompt', aoPoderInstalar);
    window.addEventListener('appinstalled', aoInstalar);
    return () => {
      window.removeEventListener('beforeinstallprompt', aoPoderInstalar);
      window.removeEventListener('appinstalled', aoInstalar);
    };
  }, []);

  return { prompt, instalado, setPrompt };
}

export function ModalInstalar({ prompt, aoFechar }: {
  prompt: PromptEvent | null;
  aoFechar: () => void;
}) {
  const [ios, setIos] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    // iPad moderno se identifica como Mac; a diferença é o toque na tela.
    setIos(/iphone|ipad|ipod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1));
  }, []);

  async function instalarAgora() {
    if (!prompt) return;
    await prompt.prompt();
    await prompt.userChoice;
    aoFechar();
  }

  return (
    <div className="modal show" onClick={(e) => { if (e.target === e.currentTarget) aoFechar(); }}>
      <div className="modal-card">
        <div className="modal-head">
          <h3>Adicionar à tela inicial</h3>
          <button className="close" aria-label="Fechar" onClick={aoFechar}>×</button>
        </div>

        <div className="install-preview">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon-192.png" alt="Ícone do Radar Rider" />
          <div><b>Radar Rider</b><span>Este é o ícone que ficará no celular</span></div>
        </div>

        <p className="muted" style={{ fontSize: 14, lineHeight: 1.6 }}>
          Instalado, o Radar Rider abre em tela cheia, sem a barra do navegador,
          e fica com a logo no meio dos seus apps.
        </p>

        {prompt ? (
          <button className="btn primary" style={{ marginTop: 16 }} onClick={instalarAgora}>
            Instalar agora
          </button>
        ) : ios ? (
          <div className="privacy-box ok" style={{ marginTop: 16, display: 'block' }}>
            <p style={{ marginBottom: 10 }}><b>No iPhone e iPad</b></p>
            <p>1. Abra este site no <b>Safari</b> (não funciona pelo Chrome)</p>
            <p>2. Toque em <b>Compartilhar</b> — o quadrado com a seta para cima</p>
            <p>3. Role e toque em <b>Adicionar à Tela de Início</b></p>
          </div>
        ) : (
          <div className="privacy-box ok" style={{ marginTop: 16, display: 'block' }}>
            <p style={{ marginBottom: 10 }}><b>No Android</b></p>
            <p>1. Toque no menu do navegador — os três pontinhos <b>⋮</b></p>
            <p>2. Toque em <b>Instalar app</b> ou <b>Adicionar à tela inicial</b></p>
            <p style={{ marginTop: 10, opacity: 0.75 }}>
              Se não aparecer, recarregue a página e tente de novo.
            </p>
          </div>
        )}

        <button className="btn ghost" style={{ marginTop: 10 }} onClick={aoFechar}>Fechar</button>
      </div>
    </div>
  );
}

// ===== Convite que sobe sozinho =====
//
// O botão "＋ Adicionar à tela inicial" já existia, mas só encontra quem
// procura. Este cartão sobe por conta própria e é o que faz a pessoa descobrir
// que o site pode virar aplicativo.
//
// Três travas, para convite não virar praga:
//   - aparece UMA vez por visita (sessionStorage, morre quando a aba fecha)
//   - quem dispensa não é perguntado de novo por 30 dias (localStorage)
//   - quem já instalou nunca vê
//
// E espera o aviso de cookies sair da tela antes de aparecer. Os dois moram no
// mesmo canto de baixo; sem essa espera o convite nasce escondido atrás do
// aviso. Não é hipótese: foi o defeito medido no BRDeals, e atingia justamente
// quem chegava pela primeira vez — que é o público inteiro deste cartão.

const CHAVE_DISPENSA = 'rr-instalar-dispensado-em';
/** Marca de visita: vive na sessão, portanto morre quando a aba fecha. */
const CHAVE_VISITA = 'rr-instalar-visita';
const DIAS_ATE_PERGUNTAR_DE_NOVO = 30;
/** Interromper quem acabou de chegar afasta. O convite espera. */
const ATRASO_MS = 20000;

function jaApareceuNestaVisita() {
  try {
    return sessionStorage.getItem(CHAVE_VISITA) === '1';
  } catch {
    // Sem armazenamento de sessão, não insistir é melhor do que insistir sempre.
    return true;
  }
}

function marcarVisita() {
  try {
    sessionStorage.setItem(CHAVE_VISITA, '1');
  } catch { /* sem armazenamento: o convite pode voltar noutra página */ }
}

function foiDispensadoRecentemente() {
  try {
    const registro = localStorage.getItem(CHAVE_DISPENSA);
    if (!registro) return false;

    const quando = Number(registro);
    if (!Number.isFinite(quando)) return false;

    return Date.now() - quando < DIAS_ATE_PERGUNTAR_DE_NOVO * 24 * 60 * 60 * 1000;
  } catch {
    // Armazenamento bloqueado: não insistir é melhor do que insistir sempre.
    return true;
  }
}

/**
 * O aviso de cookies só é montado no app (`RadarApp`), não na tela de entrada.
 * Por isso a espera olha a TELA e não o `localStorage`: perguntar pela chave
 * faria o convite esperar para sempre em quem nunca chegou a ver o aviso.
 */
function avisoDeCookiesNaTela() {
  return document.querySelector('.cookie-bar') !== null;
}

export function ConviteInstalar() {
  const { prompt, instalado } = useInstalacao();
  const [querAparecer, setQuerAparecer] = useState(false);
  const [caminhoLivre, setCaminhoLivre] = useState(false);
  const [ios, setIos] = useState(false);
  /** Arma o temporizador uma única vez, mesmo que o evento chegue depois. */
  const armado = useRef(false);
  const temporizador = useRef<number | null>(null);

  useEffect(() => {
    const ua = navigator.userAgent;
    // iPad moderno se identifica como Mac; a diferença é o toque na tela.
    setIos(/iphone|ipad|ipod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1));
  }, []);

  useEffect(() => () => {
    if (temporizador.current !== null) window.clearTimeout(temporizador.current);
  }, []);

  useEffect(() => {
    if (armado.current || instalado) return;
    // Só arma quando existe caminho real de instalação: no Android quando o
    // evento chega; no iPhone sempre, porque lá a instalação é manual e o
    // evento nunca vem.
    if (!prompt && !ios) return;
    if (foiDispensadoRecentemente() || jaApareceuNestaVisita()) return;

    armado.current = true;
    marcarVisita();
    temporizador.current = window.setTimeout(() => setQuerAparecer(true), ATRASO_MS);
  }, [prompt, ios, instalado]);

  // Só vigia o aviso de cookies depois que o convite já quer aparecer: assim
  // nenhum temporizador fica rodando para quem nunca veria o cartão.
  useEffect(() => {
    if (!querAparecer || caminhoLivre) return;

    if (!avisoDeCookiesNaTela()) {
      setCaminhoLivre(true);
      return;
    }

    const intervalo = window.setInterval(() => {
      if (!avisoDeCookiesNaTela()) setCaminhoLivre(true);
    }, 1500);
    return () => window.clearInterval(intervalo);
  }, [querAparecer, caminhoLivre]);

  function dispensar() {
    try {
      localStorage.setItem(CHAVE_DISPENSA, String(Date.now()));
    } catch { /* sem armazenamento: o convite volta na próxima visita */ }
    setQuerAparecer(false);
  }

  async function instalarAgora() {
    if (!prompt) return;
    try {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      // Recusou o instalador do navegador: guardar a dispensa, senão o cartão
      // voltaria na próxima visita para quem acabou de dizer não.
      if (outcome === 'dismissed') dispensar();
    } catch {
      // `prompt()` só pode ser usado uma vez por evento; se o modal manual já
      // tiver consumido este, não há o que fazer além de fechar o cartão.
    }
    setQuerAparecer(false);
  }

  if (instalado || !querAparecer || !caminhoLivre) return null;

  const titulo = ios ? 'Adicionar à Tela de Início' : 'Instale o Radar Rider no seu celular';

  return (
    <div className="rr-convite" role="dialog" aria-label={titulo}>
      <button className="rr-convite-fechar" aria-label="Fechar" onClick={dispensar}>×</button>

      <div className="rr-convite-topo">
        {/* eslint-disable-next-line @next/next/no-img-element -- imagem estática já dimensionada; o otimizador só acrescentaria uma requisição. */}
        <img src="/icon-192.png" alt="Radar Rider" width={192} height={192} />
        <div>
          <p className="rr-convite-titulo">{titulo}</p>
          <p className="rr-convite-desc">
            Abre em tela cheia, sem a barra do navegador, e fica com a logo no meio dos seus apps.
          </p>
        </div>
      </div>

      {prompt ? (
        <div className="rr-convite-acoes">
          <button className="btn primary" onClick={instalarAgora}>Baixar aplicativo</button>
          <button className="btn ghost" onClick={dispensar}>Agora não</button>
        </div>
      ) : (
        <>
          <div className="privacy-box ok rr-convite-passos">
            <p>1. Toque em <b>Compartilhar</b> — o quadrado com a seta para cima</p>
            <p>2. Role e toque em <b>Adicionar à Tela de Início</b></p>
            <p>3. Confirme em <b>Adicionar</b></p>
          </div>
          <div className="rr-convite-acoes">
            <button className="btn ghost" onClick={dispensar}>Agora não</button>
          </div>
        </>
      )}
    </div>
  );
}

/** Registra o service worker. Sem ele o Android não oferece instalar. */
export function RegistrarServiceWorker() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    // Auto-atualização. Quando uma versão nova é publicada, o service worker
    // novo assume (skipWaiting + clients.claim) e dispara 'controllerchange';
    // aí recarregamos a tela UMA vez para trocar o código velho pelo novo, sem
    // a pessoa precisar limpar cache na mão. Só recarrega se JÁ existia um
    // controller — senão a primeira visita se recarregaria à toa.
    let recarregando = false;
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (recarregando) return;
        recarregando = true;
        window.location.reload();
      });
    }

    // updateViaCache:'none' força revalidar o proprio service-worker.js pela
    // rede (sem isso o navegador pode servir um SW velho do cache HTTP por
    // horas). reg.update() checa por versao nova ja na abertura.
    navigator.serviceWorker
      .register('/service-worker.js', { updateViaCache: 'none' })
      .then((reg) => reg.update().catch(() => {}))
      .catch((e) => console.warn('Service worker não registrou:', e));

    // Ao abrir (ou voltar para) o app, o selo do ícone perdeu o sentido: a
    // pessoa já está aqui vendo os alertas. Limpa o marcador. O SW o coloca
    // quando chega um push com o app fechado; aqui ele some quando ela chega.
    const limparSelo = () => {
      if (document.visibilityState === 'visible' && 'clearAppBadge' in navigator) {
        navigator.clearAppBadge().catch(() => {});
      }
    };
    limparSelo();
    document.addEventListener('visibilitychange', limparSelo);
    return () => document.removeEventListener('visibilitychange', limparSelo);
  }, []);
  return null;
}
