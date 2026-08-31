import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Check if session token cookie exists
  const hasSession =
    req.cookies.has('authjs.session-token') ||
    req.cookies.has('__Secure-authjs.session-token') ||
    req.cookies.has('next-auth.session-token') ||
    req.cookies.has('__Secure-next-auth.session-token');

  // Protect admin routes — must be logged in
  if (pathname.startsWith('/admin') && !hasSession) {
    const loginUrl = new URL('/login', req.nextUrl.origin);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Customize flow (/customize/base, cover, finish, review) is open to all visitors (guests and members)
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
