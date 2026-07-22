// Bandeiras em SVG, não em emoji.
//
// 🇮🇪 e 🇬🇧 são pares de letras regionais que o sistema operacional PRECISA ter
// numa fonte de emoji para desenhar como bandeira. O Windows não tem: no
// Chrome do desktop o botão aparecia escrito "IE" e "GB", em letra crua, do
// lado do texto "IRL" e "UK". Desenhado aqui, sai igual em celular, desktop e
// print de tela.

export function BandeiraIE({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 60 30" role="img" aria-label="Irlanda">
      <rect width="20" height="30" fill="#169B62" />
      <rect x="20" width="20" height="30" fill="#FFFFFF" />
      <rect x="40" width="20" height="30" fill="#FF883E" />
    </svg>
  );
}

export function BandeiraGB({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 60 30" role="img" aria-label="Reino Unido">
      <clipPath id="rr-uj">
        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
      </clipPath>
      {/* Sem vectorEffect: a espessura TEM que encolher junto com a bandeira.
          Travada em pixels de tela, a 20px de largura os traços cobriam o
          azul inteiro e a Union Jack virava um borrão vermelho e branco. */}
      <rect width="60" height="30" fill="#012169" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#FFFFFF" strokeWidth="6" />
      <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#rr-uj)"
            stroke="#C8102E" strokeWidth="4" />
      <path d="M30,0 v30 M0,15 h60" stroke="#FFFFFF" strokeWidth="10" />
      <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
    </svg>
  );
}

/** "Todos": um globo simples, para os três botões terem o mesmo peso visual. */
export function IconeTodos({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 60 30" role="img" aria-label="Todos os países">
      <g transform="translate(16,0)" fill="none" stroke="currentColor" strokeWidth="2.2">
        <circle cx="14" cy="15" r="12" />
        <ellipse cx="14" cy="15" rx="5.2" ry="12" />
        <path d="M2.4,15 h23.2 M4.3,8.4 h19.4 M4.3,21.6 h19.4" />
      </g>
    </svg>
  );
}
