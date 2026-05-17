import './globals.css';
import type { Metadata, Viewport } from 'next';
import { SwRegister } from './components/sw-register';

const SITE_URL = 'https://estateos.ru';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'EstateOS — Операционная система для агентств недвижимости',
    template: '%s · EstateOS',
  },
  description:
    'AI-операционная система для агентств недвижимости. Голос агента превращается в структурированный отчёт. Утренний разбор на iPhone в 9:30. SPIN-тренажёр продаж.',
  applicationName: 'EstateOS',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/logo.svg', type: 'image/svg+xml' },
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'EstateOS',
    title: 'EstateOS — Операционная система для агентств недвижимости',
    description:
      'Голос агента превращается в структурированный отчёт. Утренний разбор на iPhone в 9:30. Без планёрок, без сводок в ночи.',
    locale: 'ru_RU',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'EstateOS' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EstateOS — Операционная система для агентств недвижимости',
    description: 'AI-операционная система для агентств. Утренний разбор · SPIN-тренажёр · Аналитика.',
    images: ['/og-image.png'],
  },
};

export const viewport: Viewport = {
  themeColor: '#FAF8F5',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap"
        />
      </head>
      <body>
        {children}
        <SwRegister />
      </body>
    </html>
  );
}
