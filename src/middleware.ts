import { NextResponse, type NextRequest } from 'next/server';
import { createMiddlewareClient } from '@/lib/supabase/middleware';

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/auth/callback',
  '/apply', // Public client application form
  '/accept-invite', // Client invite acceptance page
];

// Routes for coaches
const COACH_ROUTES = ['/coach'];

// Routes for admins
const ADMIN_ROUTES = ['/admin'];

export async function middleware(request: NextRequest) {
  const { supabase, supabaseResponse, user } = await createMiddlewareClient(request);
  const pathname = request.nextUrl.pathname;

  // Allow static files and API routes (except protected ones)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/webhooks') ||
    pathname.startsWith('/api/cron') || // Vercel cron jobs
    pathname.startsWith('/api/test-') ||
    pathname.startsWith('/api/test/') || // Test API routes
    pathname.startsWith('/api/applications') || // Public application API
    pathname.startsWith('/api/payment-settings') || // Public payment settings for apply form
    pathname.startsWith('/api/upload/payment-screenshot') || // Public screenshot upload
    pathname.includes('.')
  ) {
    return supabaseResponse;
  }

  // Check if route is public
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

  // Routes that should be accessible even when logged in (don't redirect)
  const noRedirectRoutes = ['/apply', '/accept-invite'];
  const shouldNotRedirect = noRedirectRoutes.some((route) => pathname.startsWith(route));

  // If public route and user is logged in, redirect based on role (except for certain routes)
  if (isPublicRoute && user && !shouldNotRedirect) {
    // Get user role to determine redirect destination
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userProfile } = await (supabase as any)
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const userRole = userProfile?.role || 'client';
    const url = request.nextUrl.clone();

    // Redirect based on role
    if (userRole === 'admin') {
      url.pathname = '/admin';
    } else if (userRole === 'coach') {
      url.pathname = '/coach';
    } else {
      url.pathname = '/dashboard';
    }
    return NextResponse.redirect(url);
  }

  // If public route and user is not logged in, allow access
  if (isPublicRoute) {
    return supabaseResponse;
  }

  // All other routes require authentication
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  // Get user profile to check role
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: userProfile } = await (supabase as any)
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = userProfile?.role || 'client';

  // Role-based access control
  const isCoachRoute = COACH_ROUTES.some((route) => pathname.startsWith(route));
  const isAdminRoute = ADMIN_ROUTES.some((route) => pathname.startsWith(route));

  // Admin can access everything
  if (role === 'admin') {
    return supabaseResponse;
  }

  // Coach can access coach routes and client routes
  if (role === 'coach') {
    if (isAdminRoute) {
      const url = request.nextUrl.clone();
      url.pathname = '/coach';
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // Client can only access client routes
  if (role === 'client') {
    if (isCoachRoute || isAdminRoute) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // Default: allow access
  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
