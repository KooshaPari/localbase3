import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define which routes require authentication
const protectedRoutes = [
  '/dashboard',
  '/profile',
  '/api-keys',
  '/provider',
  '/jobs',
  '/billing',
];

// Define which routes are for non-authenticated users only
const authRoutes = [
  '/signin',
  '/signup',
  '/forgot-password',
  '/reset-password',
];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  try {
    const supabase = createMiddlewareClient({ req, res });

    // Get the current path
    const path = req.nextUrl.pathname;

    // Check if the user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession();

  // If the route requires authentication and the user is not authenticated
  if (protectedRoutes.some(route => path.startsWith(route)) && !session) {
    const redirectUrl = new URL('/signin', req.url);
    redirectUrl.searchParams.set('redirectTo', path);
    return NextResponse.redirect(redirectUrl);
  }

  // If the route is for non-authenticated users and the user is authenticated
  if (authRoutes.some(route => path.startsWith(route)) && session) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return res;
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
