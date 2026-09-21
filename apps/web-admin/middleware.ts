import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check for our custom isLoggedIn cookie
  const isLoggedIn = request.cookies.get('isLoggedIn');

  // Public external portal routes accessible by Customers, Vendors, and Drivers without login
  const isExternalPortalRoute = 
    request.nextUrl.pathname.startsWith('/quotation') ||
    request.nextUrl.pathname.startsWith('/bidding') ||
    request.nextUrl.pathname.startsWith('/pod') ||
    request.nextUrl.pathname.startsWith('/invoices');

  if (isExternalPortalRoute) {
    return NextResponse.next();
  }

  const isAuthRoute = 
    request.nextUrl.pathname === '/' ||
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/register');

  // If we are navigating to any protected route and not logged in
  if (!isAuthRoute && !isLoggedIn) {
    // Redirect instantly to the login page on the server side
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If they are logged in and trying to access auth routes (like login/register/home), redirect to dashboard
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Apply this middleware to all pages except api, static files, images, etc.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|logo.png).*)'],
};
