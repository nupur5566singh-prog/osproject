import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_ROUTES = ['/', '/login', '/signup', '/reset-password'];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.includes(pathname);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If env vars are not configured, don't crash — let the page-level
  // server components handle the error gracefully instead.
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next({ request });
  }

  const response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refresh the session — this also updates cookies on the response
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Redirect authenticated users away from login/signup
  if (session && (pathname === '/login' || pathname === '/signup')) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/app';
    redirectUrl.searchParams.delete('redirect');
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect unauthenticated users to login from protected routes
  if (!session && !isPublicRoute(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|_next/data|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)',
  ],
};
