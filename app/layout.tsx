import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '秦统一至汉初 · 历史战争地图',
  description: '前230年至前180年的中国历史战争地图。',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
