import './globals.css';
import type { Metadata, Viewport } from 'next';
import { SwRegister } from './components/sw-register';

export const metadata: Metadata = {
  title: 'EstateOS',
  description: 'Операционная AI-платформа для агентств недвижимости',
};

export const viewport: Viewport = {
  themeColor: '#C4836A',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <link rel="icon" href="/icon-192.png" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap"
        />
      </head>
      <body className="min-h-screen text-[var(--color-ink)]" style={{ backgroundColor: 'var(--color-bg)' }}>
        {children}
        <SwRegister />
      </body>
    </html>
  );
}
