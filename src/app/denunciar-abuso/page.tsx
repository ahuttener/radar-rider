import type { Metadata } from 'next';
import { DocumentoLegalPage } from '@/components/DocumentosLegais';
export const metadata: Metadata = { title: 'Denunciar abuso — Radar Rider' };
export default function Page() { return <DocumentoLegalPage documento="denunciar-abuso" />; }
