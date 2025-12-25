import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// const protectedRoutes = ['/donate', '/my-profiles', '/my-donations'];
const protectedRoutes: any = [];
const adminRoutes = ['/admin'];
const superadminRoutes = ['/superadmin'];

function matchRoute(pathname: string, routes: string[]) {
  return routes.some(route => pathname === route || pathname.startsWith(route + '/'));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = await getToken({ req, secret: process.env.JWT_SECRET });
  const isAuthenticated = Boolean(token);
  const userRole = token?.role;


  // 2. Admin routes
  if (matchRoute(pathname, adminRoutes)) {
    if (!isAuthenticated || (userRole !== 'Admin' && userRole !== 'Superadmin')) {
      return NextResponse.redirect(new URL('/403', req.url));
    }
    return NextResponse.next();
  }

  // 3. Protected routes (authenticated users only)
  if (matchRoute(pathname, protectedRoutes)) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }
    // else if ((userRole === 'Admin' || userRole === 'Superadmin')) {
    //   return NextResponse.redirect(new URL('/admin', req.url));
    // }
    return NextResponse.next();
  }

  // 4. All other routes are public and accessible by anyone
  return NextResponse.next();
}

// Only apply middleware to app routes, not static assets or API routes
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|assets|favicon.ico|.*\\.png$).*)',
  ],
};
