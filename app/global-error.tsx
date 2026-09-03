'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
          <div className="text-6xl font-bold text-primary">Oops</div>
          <h1 className="mt-4 text-xl font-semibold">
            Something went wrong
          </h1>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            An unexpected error occurred. Try refreshing the page, or go back to the home page.
          </p>
          <div className="mt-6 flex gap-3">
            <Button onClick={reset} variant="outline">
              Try again
            </Button>
            <Link href="/">
              <Button>Back to home</Button>
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
