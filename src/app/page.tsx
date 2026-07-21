import RadarApp from '@/components/RadarApp';

// O app é todo interativo (mapa, GPS, formulários), então não há o que
// pré-renderizar aqui: a página só monta o componente de cliente.
export default function Home() {
  return <RadarApp />;
}
