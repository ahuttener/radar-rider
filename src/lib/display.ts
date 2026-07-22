// Apresentação: categorias, distâncias e tempo.
// Compartilhado entre servidor e navegador — nada aqui toca banco nem DOM.

export type CategoryId =
  | 'roubo' | 'grupo_hostil' | 'intimidacao' | 'acidente' | 'via_perigosa' | 'outro';

export type Severity = 'alta' | 'media' | 'baixa';

export const CATEGORIES: Array<{
  id: CategoryId;
  icon: string;
  label: string;
  severity: Severity;
}> = [
  { id: 'roubo',        icon: '🚨', label: 'Roubo ou tentativa',     severity: 'alta'  },
  { id: 'grupo_hostil', icon: '👥', label: 'Grupo hostil',           severity: 'alta'  },
  { id: 'intimidacao',  icon: '⚠️', label: 'Intimidação ou assédio', severity: 'media' },
  { id: 'acidente',     icon: '⛔', label: 'Acidente ou bloqueio',   severity: 'media' },
  { id: 'via_perigosa', icon: '🛣️', label: 'Via perigosa',           severity: 'baixa' },
  { id: 'outro',        icon: '📍', label: 'Outro risco',            severity: 'baixa' },
];

export function catById(id: string) {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[5];
}

export function severityClass(id: string) {
  return ({ alta: 'red', media: 'amber', baixa: 'green' } as const)[catById(id).severity];
}

/**
 * Irlanda usa km, Reino Unido usa milhas.
 * A unidade segue o aparelho de quem está olhando, não o país do alerta: quem
 * mora em Belfast pensa em milhas mesmo lendo um alerta de Dublin.
 */
export function milesForDevice(): boolean {
  if (typeof Intl === 'undefined') return false;
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone === 'Europe/London';
  } catch {
    return false;
  }
}

export function formatDistance(metres: number, miles = milesForDevice()): string {
  if (miles) {
    const mi = metres / 1609.34;
    return mi < 0.2 ? `${Math.round(metres * 1.094)} yd` : `${mi.toFixed(1)} mi`;
  }
  return metres < 950 ? `${Math.round(metres)} m` : `${(metres / 1000).toFixed(1)} km`;
}

export function timeAgo(iso: string | Date): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `há ${mins} min`;
  const h = Math.round(mins / 60);
  return h < 24 ? `há ${h} h` : `há ${Math.round(h / 24)} d`;
}

export type AlertaPublico = {
  id: string;
  category: CategoryId;
  description: string;
  occurredAt: string;
  isOngoing: boolean;
  latitudePublic: number;
  longitudePublic: number;
  status: string;
  countryCode: 'IE' | 'GB';
  confirmationsCount: number;
  expiresAt: string;
  createdAt: string;
};
