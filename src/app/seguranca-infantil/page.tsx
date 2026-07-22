import type { Metadata } from 'next';
import { DocumentoLegalPage } from '@/components/DocumentosLegais';
export const metadata: Metadata = { title: 'Segurança infantil — Radar Rider' };
export default function Page() { return <DocumentoLegalPage documento="seguranca-infantil" />; }
