'use client';

import { useEffect, useState } from 'react';

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

    const aoPoderInstalar = (e: Event) => {
      e.preventDefault();
      setPrompt(e as PromptEvent);
    };
    const aoInstalar = () => {
      setInstalado(true);
      setPrompt(null);
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

/** Registra o service worker. Sem ele o Android não oferece instalar. */
export function RegistrarServiceWorker() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/service-worker.js').catch((e) => {
      console.warn('Service worker não registrou:', e);
    });
  }, []);
  return null;
}
