'use client';

import { useCallback, useEffect, useState } from 'react';
import type { CountryCode } from '@/lib/geo';
import { countryFromCoords } from '@/lib/geo';
import { BandeiraIE, BandeiraGB, IconeTodos } from './Bandeiras';

// Filtro de país.
//
// A Irlanda e o Reino Unido são dois mercados de entrega separados: quem roda
// em Dublin não tem nada a ver com um alerta em Manchester, e o mapa cheio de
// ponto do outro país só atrapalha. O `countryCode` já vem calculado do
// servidor em cada alerta, então o filtro aqui é só de exibição.
//
// O padrão é 'todos' até o GPS dizer onde a pessoa está. Chutar um país antes
// disso mostraria um mapa vazio para metade dos usuários, que concluiria que o
// app não funciona.

export type FiltroPais = CountryCode | 'todos';

const CHAVE = 'rr-pais';

export const PAISES: Array<{
  id: FiltroPais;
  Bandeira: (p: { className?: string }) => React.ReactElement;
  nome: string;
  curto: string;
}> = [
  { id: 'todos', Bandeira: IconeTodos, nome: 'Todos',       curto: 'Todos' },
  { id: 'IE',    Bandeira: BandeiraIE, nome: 'Irlanda',     curto: 'IRL'   },
  { id: 'GB',    Bandeira: BandeiraGB, nome: 'Reino Unido', curto: 'UK'    },
];

function ehFiltroValido(v: string | null): v is FiltroPais {
  return v === 'todos' || v === 'IE' || v === 'GB';
}

/** Preferência já gravada, ou null se a pessoa nunca escolheu. */
export function lerPaisSalvo(): FiltroPais | null {
  try {
    const v = localStorage.getItem(CHAVE);
    return ehFiltroValido(v) ? v : null;
  } catch {
    return null;
  }
}

export function salvarPais(p: FiltroPais) {
  try {
    localStorage.setItem(CHAVE, p);
  } catch { /* sem armazenamento: vale só nesta visita */ }
}

/**
 * Palpite de país pelo fuso horário do aparelho.
 *
 * Serve para a tela de login, onde não há GPS: pedir a localização de alguém
 * que ainda nem tem conta é invasivo e a maioria nega. O fuso acerta quase
 * sempre e não custa permissão nenhuma. É só um palpite de exibição — quem
 * decide de verdade, depois, é o GPS dentro do app.
 */
export function paisPeloFusoHorario(): CountryCode {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone === 'Europe/London' ? 'GB' : 'IE';
  } catch {
    return 'IE';
  }
}

export function usePais(pos: { lat: number; lng: number } | null) {
  const [pais, setPais] = useState<FiltroPais>('todos');
  // Escolha manual trava o filtro: depois que a pessoa clicou, o GPS não tem
  // mais o direito de mudar a tela debaixo dela.
  const [manual, setManual] = useState(false);

  useEffect(() => {
    try {
      const salvo = localStorage.getItem(CHAVE);
      if (ehFiltroValido(salvo)) {
        setPais(salvo);
        setManual(true);
      }
    } catch { /* sem armazenamento: segue com o padrão */ }
  }, []);

  // Primeira leitura do GPS define o país sozinha — quem está em Belfast abre o
  // app já vendo o Reino Unido, sem precisar tocar em nada.
  useEffect(() => {
    if (manual || !pos) return;
    const detectado = countryFromCoords(pos.lat, pos.lng);
    // Fora da região atendida, mantém “Todos” em vez de rotular o usuário
    // como Irlanda por padrão.
    if (detectado) setPais(detectado);
  }, [pos, manual]);

  const escolher = useCallback((novo: FiltroPais) => {
    setPais(novo);
    setManual(true);
    try {
      localStorage.setItem(CHAVE, novo);
    } catch { /* sem armazenamento: vale só nesta visita */ }
  }, []);

  return { pais, escolher };
}

export function SeletorPais({ pais, aoEscolher, contagem }: {
  pais: FiltroPais;
  aoEscolher: (p: FiltroPais) => void;
  contagem: Record<FiltroPais, number>;
}) {
  return (
    <div className="pais-bar" role="group" aria-label="Filtrar por país">
      {PAISES.map(({ id, Bandeira, nome, curto }) => (
        <button
          key={id}
          className={`pais-chip ${pais === id ? 'on' : ''}`}
          aria-pressed={pais === id}
          onClick={() => aoEscolher(id)}
          title={`Ver alertas — ${nome}`}
        >
          <Bandeira className="flag" />
          {curto}
          <span className="n">{contagem[id]}</span>
        </button>
      ))}
    </div>
  );
}
