import type { Metadata } from 'next';
import { DocumentoLegalPage } from '@/components/DocumentosLegais';
export const metadata: Metadata = { title: 'Pedidos de autoridades — Radar Rider' };
export default function Page() { return <DocumentoLegalPage documento="autoridades" />; }
