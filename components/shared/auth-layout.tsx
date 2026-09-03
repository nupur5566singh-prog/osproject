import Link from 'next/link';
import { Logo } from '@/components/shared/logo';

export function AuthLayout({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-secondary/30">
      <header className="flex h-16 items-center px-4 sm:px-6">
        <Link href="/">
          <Logo />
        </Link>
      </header>

      <div className="flex flex-1 items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md">
          <div className="rounded-xl border border-border bg-card p-8 shadow-lg shadow-foreground/5">
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
