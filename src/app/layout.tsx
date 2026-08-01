import type { Metadata, Viewport } from 'next';
import 'leaflet/dist/leaflet.css';
import './globals.css';
import { ConviteInstalar } from '@/components/InstalarApp';
import { Providers } from './providers';

export const metadata: Metadata = {
  // Sem isto o Next resolve a imagem de compartilhamento contra localhost, e o
  // link colado no WhatsApp aparece sem a logo.
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'https://www.radarrider.com'),
  title: 'Radar Rider — Segurança Comunitária para Entregadores',
  description:
    'Alertas de segurança em tempo real, feitos pela comunidade de entregadores na Irlanda e no Reino Unido.',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, title: 'Radar Rider', statusBarStyle: 'black-translucent' },
  icons: { icon: '/icon-192.png', apple: '/apple-touch-icon.png' },
  openGraph: {
    title: 'Radar Rider',
    description: 'Segurança comunitária para riders na Irlanda e no Reino Unido.',
    url: 'https://www.radarrider.com',
    images: ['/icon-512.png'],
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#040705',
  width: 'device-width',
  initialScale: 1,
  // viewportFit cover para o app usar a área toda em celular com entalhe.
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>{children}</Providers>
        {/* No layout raiz de propósito: o convite tem de alcançar quem chega
            pela tela de entrada, não só quem já entrou no app. */}
        <ConviteInstalar />
      </body>
    </html>
  );
}
