import type { Metadata } from 'next';
import { DocumentoLegalPage } from '@/components/DocumentosLegais';
export const metadata: Metadata = { title: 'Direitos autorais — Radar Rider' };
export default function Page() { return <DocumentoLegalPage documento="direitos-autorais" />; }
