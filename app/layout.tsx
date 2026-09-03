import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/lib/contexts/auth-context';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ProjectOS — Modern Project Management',
  description:
    'ProjectOS is a modern project management platform that combines powerful task management, Kanban boards, sprints, and team collaboration in one place.',
  openGraph: {
    title: 'ProjectOS — Modern Project Management',
    description:
      'A modern project management platform for teams that ship. Tasks, boards, sprints, and dashboards — all in one place.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ProjectOS — Modern Project Management',
    description:
      'A modern project management platform for teams that ship. Tasks, boards, sprints, and dashboards — all in one place.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
