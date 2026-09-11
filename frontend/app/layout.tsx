import type { Metadata } from 'next';
import { Cairo } from 'next/font/google';
import './globals.css';
import { AuthProvider } from './lib/auth-context';
import { ToastProvider } from './components/ui/toast';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'Power Gym | باور جيم', template: '%s | Power Gym' },
  description: 'نظام إدارة الجيم المتكامل',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full bg-[#09090B] text-[#FAFAFA] antialiased font-['Cairo',sans-serif]">
        <ToastProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
