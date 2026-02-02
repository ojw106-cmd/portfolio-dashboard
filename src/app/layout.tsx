import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '주식 포트폴리오 관리 대시보드',
  description: '포트폴리오 관리 및 리밸런싱 도구',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
