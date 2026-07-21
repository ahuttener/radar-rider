'use client';

import { useEffect, useRef } from 'react';
import type { Map as LeafletMap, CircleMarker, Marker, Layer } from 'leaflet';
import { catById, severityClass, type AlertaPublico } from '@/lib/display';

type Props = {
  alerts: AlertaPublico[];
  me: { lat: number; lng: number } | null;
  heat: boolean;
  onPick: (id: string) => void;
  focus: { lat: number; lng: number } | null;
};

// O Leaflet mexe em window no momento em que é importado, então o import é
// dentro do efeito. Importar no topo quebra a renderização no servidor.
export default function MapView({ alerts, me, heat, onPick, focus }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const meMarker = useRef<CircleMarker | null>(null);
  const markers = useRef<Map<string, Marker>>(new Map());
  const heatLayer = useRef<Layer | null>(null);
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;

  useEffect(() => {
    if (!el.current || map.current) return;
    let cancelado = false;

    (async () => {
      const L = (await import('leaflet')).default;
      if (cancelado || !el.current) return;

      const m = L.map(el.current, { zoomControl: false }).setView([53.3498, -6.2603], 12);

      // Mapa escuro: com o mapa claro os marcadores vermelhos e o cartão de
      // status somem no contraste, e à noite — quando o app mais é usado — a
      // tela inteira acende na cara de quem está pilotando.
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      }).addTo(m);

      // No celular o zoom é por pinça; os botões só cobriam o cartão de status.
      if (window.matchMedia('(min-width:560px)').matches) {
        L.control.zoom({ position: 'topright' }).addTo(m);
      }

      map.current = m;
    })();

    return () => {
      cancelado = true;
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Marcadores dos alertas
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    let cancelado = false;

    (async () => {
      const L = (await import('leaflet')).default;
      if (cancelado || !map.current) return;

      const vistos = new Set(alerts.map((a) => a.id));
      for (const [id, marker] of markers.current) {
        if (!vistos.has(id)) {
          marker.remove();
          markers.current.delete(id);
        }
      }

      for (const a of alerts) {
        if (markers.current.has(a.id)) continue;
        const c = catById(a.category);
        const marker = L.marker([a.latitudePublic, a.longitudePublic])
          .addTo(m)
          .bindTooltip(`${c.icon} ${c.label}`)
          .on('click', () => onPickRef.current(a.id));
        markers.current.set(a.id, marker);
      }

      if (heatLayer.current) {
        m.removeLayer(heatLayer.current);
        heatLayer.current = null;
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [alerts]);

  // Camada de calor, carregada só quando alguém liga o botão
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    let cancelado = false;

    (async () => {
      if (heatLayer.current) {
        m.removeLayer(heatLayer.current);
        heatLayer.current = null;
      }
      if (!heat || alerts.length === 0) return;

      const L = (await import('leaflet')).default;
      await import('leaflet.heat');
      if (cancelado || !map.current) return;

      // Peso pela gravidade: um roubo pesa mais no mapa que uma via ruim.
      const peso = { alta: 1, media: 0.65, baixa: 0.35 } as const;
      const pontos = alerts.map((a) => [
        a.latitudePublic,
        a.longitudePublic,
        peso[catById(a.category).severity],
      ]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      heatLayer.current = (L as any)
        .heatLayer(pontos, {
          radius: 34,
          blur: 24,
          maxZoom: 16,
          gradient: { 0.3: '#23f36b', 0.6: '#ffd21a', 1: '#ff4d57' },
        })
        .addTo(m);
    })();

    return () => {
      cancelado = true;
    };
  }, [heat, alerts]);

  // Posição do rider
  useEffect(() => {
    const m = map.current;
    if (!m || !me) return;
    let cancelado = false;

    (async () => {
      const L = (await import('leaflet')).default;
      if (cancelado || !map.current) return;

      if (meMarker.current) {
        meMarker.current.setLatLng(me);
      } else {
        meMarker.current = L.circleMarker(me, {
          radius: 9,
          color: '#fff',
          weight: 3,
          fillColor: '#23f36b',
          fillOpacity: 1,
        })
          .addTo(m)
          .bindTooltip('Você está aqui');
        m.setView(me, 15);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [me]);

  // Centralizar num alerta escolhido em outra tela
  useEffect(() => {
    if (focus && map.current) map.current.setView(focus, 16);
  }, [focus]);

  // Ao voltar para a aba do mapa o container mudou de tamanho enquanto estava
  // escondido; sem isso o Leaflet desenha os tiles no lugar errado.
  useEffect(() => {
    const t = setTimeout(() => map.current?.invalidateSize(), 120);
    return () => clearTimeout(t);
  });

  return <div id="map" ref={el} />;
}

export { severityClass };
