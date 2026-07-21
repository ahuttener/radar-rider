// Geografia do Radar Rider.
// Sem dependência do navegador de propósito: o servidor precisa recalcular
// país e coordenada pública por conta própria. Confiar no que o cliente manda
// deixaria qualquer um publicar um alerta com a posição borrada que quisesse
// — ou com a posição exata de outra pessoa.

export type CountryCode = 'IE' | 'GB';

// Contorno grosseiro da Irlanda do Norte. Existe porque a ilha da Irlanda tem
// dois países: uma caixa de latitude/longitude sozinha colocaria o Donegal
// (República) dentro do Reino Unido.
const NI_OUTLINE: Array<[number, number]> = [
  [-8.18, 54.46], [-7.90, 54.20], [-7.30, 54.12], [-6.65, 54.05], [-6.27, 54.09],
  [-5.85, 54.02], [-5.43, 54.40], [-5.50, 54.68], [-5.72, 54.85], [-6.05, 55.05],
  [-6.50, 55.25], [-7.05, 55.15], [-7.45, 55.10], [-7.55, 54.85], [-7.90, 54.70],
];

function insidePolygon(lng: number, lat: number, poly: Array<[number, number]>): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

export function countryFromCoords(lat: number, lng: number): CountryCode {
  if (insidePolygon(lng, lat, NI_OUTLINE)) return 'GB';                        // Irlanda do Norte
  if (lat >= 51.3 && lat <= 55.5 && lng >= -10.7 && lng <= -5.3) return 'IE';  // ilha da Irlanda
  if (lat >= 49.8 && lat <= 60.9 && lng >= -8.2 && lng <= 1.8) return 'GB';    // Grã-Bretanha
  return 'IE';
}

// Arredondar para 3 casas move o ponto para uma área de ~100 m. É o que impede
// o alerta de apontar para a porta de uma casa.
export function publicCoord(n: number): number {
  return Math.round(n * 1000) / 1000;
}

export function distanceMetres(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Confirmação só vale de perto: de longe não é testemunho, é opinião.
export const CONFIRM_RADIUS_M = 2000;

export function isValidCoord(lat: unknown, lng: unknown): boolean {
  return (
    typeof lat === 'number' && Number.isFinite(lat) && lat >= -90 && lat <= 90 &&
    typeof lng === 'number' && Number.isFinite(lng) && lng >= -180 && lng <= 180
  );
}
