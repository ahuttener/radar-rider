'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

// Aviso de cookies.
//
// Não é um painel de consentimento com botão de "recusar", e isso é proposital:
// o app só usa cookie estritamente necessário (a sessão do login). Pela
// ePrivacy, esse tipo não depende de consentimento — oferecer um botão de
// recusar que não desliga nada seria teatro, e teatro de consentimento é
// justamente o que a lei está tentando combater.
//
// O aviso existe para informar e para levar à política. Se um dia entrar
// qualquer coisa de análise ou anúncio, ISTO AQUI VIRA UM OPT-IN DE VERDADE,
// com recusa que realmente bloqueia o script antes de ele carregar.

const CHAVE = 'rr-aviso-cookies';

export function AvisoCookies() {
  // Começa escondido e só aparece depois de conferir o armazenamento: assim
  // quem já fechou o aviso nunca vê ele piscar na tela ao abrir o app.
  const [mostrar, setMostrar] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(CHAVE)) setMostrar(true);
    } catch {
      // Navegador com armazenamento bloqueado: não insiste com o aviso, porque
      // sem onde guardar a resposta ele apareceria em toda visita.
    }
  }, []);

  function fechar() {
    setMostrar(false);
    try {
      localStorage.setItem(CHAVE, '1');
    } catch { /* sem armazenamento: some só nesta visita */ }
  }

  if (!mostrar) return null;

  return (
    <div className="cookie-bar" role="dialog" aria-label="Aviso de cookies">
      <p>
        🍪 Usamos só os cookies que mantêm você conectado. <b>Sem rastreamento,
        sem anúncio.</b>{' '}
        <Link href="/cookies">Saiba mais</Link>
      </p>
      <button className="btn primary" onClick={fechar}>Entendi</button>
    </div>
  );
}
