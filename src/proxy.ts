import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// middleware proxy, handles route protection
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // let auth stuff pass through
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // protect specific routes only
  const protectedPaths = ['/dashboard', '/new'];
  const isProtected = protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  // read jwt from cookie
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
  // matcher for protected paths
  matcher: ['/dashboard', '/dashboard/:path*', '/new', '/new/:path*'],
};
