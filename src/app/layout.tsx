import type { Metadata, Viewport } from 'next';
import { Nunito, Fredoka } from 'next/font/google';
import './globals.css';

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-nunito',
  display: 'swap',
});

const fredoka = Fredoka({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-fredoka',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'LittleBridge 小桥',
  description: 'Bilingual English-Mandarin learning app for young children / 适合幼儿的中英双语学习应用',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className={`${nunito.variable} ${fredoka.variable}`}>
      <body className="min-h-screen bg-[#FFF9F0]">
        {children}
      </body>
    </html>
  );
}
