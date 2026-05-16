import './globals.css';
import type { Metadata, Viewport } from 'next';
import { SwRegister } from './components/sw-register';

export const metadata: Metadata = {
  title: 'EstateOS',
  description: 'Операционная AI-платформа для агентств недвижимости',
};

export const viewport: Viewport = {
  themeColor: '#3b82f6',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <link rel="icon" href="/icon-192.png" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="min-h-screen bg-white text-neutral-900">
        {children}
        <SwRegister />
      </body>
    </html>
  );
}
