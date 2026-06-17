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
  // secureCookie must be true in production so getToken looks for the
  // __Secure-authjs.session-token cookie that Auth.js v5 sets over HTTPS.
  // Without this flag getToken searches for authjs.session-token (no prefix),
  // finds nothing, returns null, and we incorrectly redirect the signed-in user.
  const isSecure =
    process.env.NEXTAUTH_URL?.startsWith('https://') ||
    process.env.NODE_ENV === 'production';

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: isSecure,
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
