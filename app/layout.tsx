import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import { ToastProvider } from '@/components/Toast';
import { DemoBanner } from '@/components/DemoBanner';
import { Navbar } from '@/components/Navbar';
import { BottomNav } from '@/components/BottomNav';

export const metadata: Metadata = {
  title: 'SOM HUIT – Chợ Sinh Viên & Việc Vặt Nội Bộ',
  description: 'Nền tảng SOM (Student • Order • Market) dành riêng cho sinh viên HUIT. Việc khó có chợ sinh viên lo.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans pb-16 sm:pb-0">
        <AuthProvider>
          <ToastProvider>
            <DemoBanner />
            <Navbar />
            <div className="flex-1">{children}</div>
            <BottomNav />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
