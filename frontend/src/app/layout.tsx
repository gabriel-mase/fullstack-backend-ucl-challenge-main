import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';
import { Navbar } from '@/components/Navbar';

const geist = Geist({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'UCL Draw — Champions League',
  description: 'Champions League draw results and match schedule',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={geist.className}>
      <body className="min-h-screen bg-slate-50 text-slate-800">
        <Providers>
          <Navbar />
          <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
