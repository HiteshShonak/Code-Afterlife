import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * Next.js 16 Proxy (formerly Middleware).
 * Protects authenticated routes. Public routes are always accessible.
 *
 * Protected routes: /dashboard, /new
 * Public routes: /, /graveyard, /project/*, /lineage/*, /api/auth/*
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Auth API routes — always pass through
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Only check auth for routes that strictly require it
  const protectedPaths = ['/dashboard', '/new'];
  const isProtected = protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  // Use next-auth JWT token (works without DB — reads from cookie)
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });

  if (!token) {
    const signInUrl = new URL('/', request.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  /*
   * Match only routes that need protection.
   * Explicitly excluding static files and Next internals.
   */
  matcher: ['/dashboard', '/dashboard/:path*', '/new', '/new/:path*'],
};
