'use client';

// A porta de entrada do site.
//
// www.radarrider.com deve ser a apresentação + login (a "cara" do produto),
// não o mapa cru. Então:
//   - quem NÃO está logado vê a tela de entrada (a mesma de /entrar);
//   - quem JÁ está logado vê o app (mapa, alertas, perfil).
// A rota /entrar continua existindo para o link direto e para o retorno depois
// de confirmar o e-mail; ela renderiza a mesma tela (TelaEntrada).

import { useSession } from 'next-auth/react';
import RadarApp from '@/components/RadarApp';
import TelaEntrada from '@/components/TelaEntrada';

export default function Home() {
  const { status } = useSession();

  // Enquanto a sessão não resolve, um fundo escuro evita o flash da tela de
  // login para quem, na verdade, já está logado.
  if (status === 'loading') {
    return <div style={{ minHeight: '100dvh', background: '#030704' }} />;
  }

  return status === 'authenticated' ? <RadarApp /> : <TelaEntrada />;
}
