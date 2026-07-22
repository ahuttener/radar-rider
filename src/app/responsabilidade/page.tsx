import type { Metadata } from 'next';
import { DocumentoLegalPage } from '@/components/DocumentosLegais';
export const metadata: Metadata = { title: 'Aviso de responsabilidade — Radar Rider' };
export default function Page() { return <DocumentoLegalPage documento="responsabilidade" />; }
