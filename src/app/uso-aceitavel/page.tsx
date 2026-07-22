import type { Metadata } from 'next';
import { DocumentoLegalPage } from '@/components/DocumentosLegais';
export const metadata: Metadata = { title: 'Uso aceitável — Radar Rider' };
export default function Page() { return <DocumentoLegalPage documento="uso-aceitavel" />; }
