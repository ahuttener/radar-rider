'use client';

import { useState } from 'react';
import type { FiltroPais } from './SeletorPais';

// Modal de emergência.
//
// Quem abre esta tela está com medo, talvez com uma mão só no celular. Então:
//
// 1. A primeira coisa na tela é 999/112, sem rolar a página.
// 2. Cada passo do "compartilhar localização" é narrado numa linha de status.
//    O toast do resto do app não serve aqui: ele some em 3 segundos e fica no
//    rodapé. Buscar GPS demora alguns segundos, e no meio desse silêncio a
//    pessoa acha que o botão não funcionou e toca de novo.
// 3. O aviso de que a localização só é lida ao tocar aparece ANTES de tocar —
//    é a diferença entre um app que te acompanha e um que não acompanha.

type Estado = { texto: string; tipo: 'neutro' | 'indo' | 'erro' };

const PARADO: Estado = {
  texto: 'Sua localização só é solicitada quando você toca no botão.',
  tipo: 'neutro',
};

export function ModalEmergencia({ pais, aoFechar }: {
  pais: FiltroPais;
  aoFechar: () => void;
}) {
  const [estado, setEstado] = useState<Estado>(PARADO);
  const [buscando, setBuscando] = useState(false);

  function compartilharNoWhatsApp() {
    if (!navigator.geolocation) {
      return setEstado({ texto: 'Este aparelho não oferece acesso à localização.', tipo: 'erro' });
    }

    setBuscando(true);
    setEstado({ texto: 'Obtendo sua localização…', tipo: 'indo' });

    navigator.geolocation.getCurrentPosition(
      (p) => {
        const lat = p.coords.latitude.toFixed(6);
        const lng = p.coords.longitude.toFixed(6);
        const texto =
          `🚨 Preciso de ajuda. Esta é a minha localização atual:\n` +
          `https://www.google.com/maps?q=${lat},${lng}\n\nEnviado pelo Radar Rider.`;
        setEstado({ texto: 'Localização pronta. Abrindo o WhatsApp…', tipo: 'indo' });
        setBuscando(false);
        // location.href e não window.open: numa emergência o navegador não pode
        // engolir a ação como se fosse pop-up, e aqui estamos dentro de um
        // retorno assíncrono, que é justamente onde o bloqueador age.
        window.location.href = `https://wa.me/?text=${encodeURIComponent(texto)}`;
      },
      (err) => {
        setBuscando(false);
        setEstado({
          texto:
            err.code === 1
              ? 'Permissão de localização negada. Libere a localização nas configurações do navegador.'
              : 'Não foi possível obter sua localização. Tente de novo num lugar com sinal melhor.',
          tipo: 'erro',
        });
      },
      // maximumAge 0: numa emergência, posição guardada de minutos atrás pode
      // mandar socorro para a rua errada. Só serve a leitura de agora.
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }

  const uk = pais === 'GB';

  return (
    <div className="modal show" onClick={(e) => { if (e.target === e.currentTarget) aoFechar(); }}>
      <div className="modal-card">
        <div className="modal-head">
          <h3>🚨 Você está em perigo imediato?</h3>
          <button className="close" onClick={aoFechar} aria-label="Fechar">×</button>
        </div>

        <div className="privacy-box">
          <span>⚠️</span>
          <p>
            Ligue <b>999</b> ou <b>112</b> em uma emergência real. Sempre que der,
            vá primeiro para um lugar seguro — uma loja aberta, um posto, um
            lugar com movimento. O Radar Rider não chama a polícia por você.
          </p>
        </div>

        <div className="emergency-grid">
          <a className="btn danger" href="tel:999">📞 Ligar 999</a>
          <a className="btn danger" href="tel:112">📞 Ligar 112</a>
        </div>

        <div className="stack" style={{ marginTop: 10 }}>
          <button className="btn primary" onClick={compartilharNoWhatsApp} disabled={buscando}>
            📍 {buscando ? 'Localizando…' : 'Compartilhar localização pelo WhatsApp'}
          </button>

          <p className={`location-status ${estado.tipo}`} role="status" aria-live="polite">
            {estado.texto}
          </p>

          {uk ? (
            <a className="btn ghost" target="_blank" rel="noopener" href="https://www.police.uk/">
              Achar uma delegacia (Police UK)
            </a>
          ) : (
            <a className="btn ghost" target="_blank" rel="noopener"
               href="https://www.garda.ie/en/contact-us/station-directory/">
              Achar uma Garda Station
            </a>
          )}

          {/* Número de não-emergência: muita coisa que o rider vive não é 999,
              e sem esta linha ele liga para o 999 ou não liga para ninguém. */}
          <p className="muted" style={{ fontSize: 12, textAlign: 'center', lineHeight: 1.6 }}>
            Sem perigo imediato? Ligue{' '}
            {uk ? (
              <><b>101</b> (Police UK)</>
            ) : (
              <><b>1800 666 111</b> (Garda Confidential)</>
            )}
          </p>

          <button className="btn ghost" onClick={aoFechar}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}
