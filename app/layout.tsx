import type { ReactNode } from 'react';

export const metadata = { title: 'AI 你画我猜' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
