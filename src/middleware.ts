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

// Routes for coaches/admins
const COACH_ROUTES = ['/admin'];

// Routes for super admins
const SUPER_ADMIN_ROUTES = ['/super-admin'];

// Routes for onboarding (authenticated but not onboarded)
const ONBOARDING_ROUTES = ['/onboarding'];

export async function middleware(request: NextRequest) {
  const { supabase, supabaseResponse, user } = await createMiddlewareClient(request);
  const pathname = request.nextUrl.pathname;

  // Allow static files and API routes (except protected ones)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/webhooks') ||
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
    if (userRole === 'super_admin') {
      url.pathname = '/super-admin';
    } else if (userRole === 'coach') {
      url.pathname = '/admin';
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

  // For clients, check onboarding status separately (more reliable than join with RLS)
  let isOnboardingComplete = false;
  if (role === 'client') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: clientProfile } = await (supabase as any)
      .from('clients')
      .select('onboarding_completed')
      .eq('user_id', user.id)
      .single();

    isOnboardingComplete = clientProfile?.onboarding_completed ?? false;
  }

  // Check if user needs to complete onboarding
  const isOnboardingRoute = ONBOARDING_ROUTES.some((route) => pathname.startsWith(route));

  if (role === 'client' && !isOnboardingComplete && !isOnboardingRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/onboarding';
    return NextResponse.redirect(url);
  }

  // If onboarding is complete, don't allow access to onboarding routes
  if (isOnboardingComplete && isOnboardingRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // Role-based access control
  const isCoachRoute = COACH_ROUTES.some((route) => pathname.startsWith(route));
  const isSuperAdminRoute = SUPER_ADMIN_ROUTES.some((route) => pathname.startsWith(route));

  // Super admin can access everything
  if (role === 'super_admin') {
    return supabaseResponse;
  }

  // Coach can access coach routes and client routes
  if (role === 'coach') {
    if (isSuperAdminRoute) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin';
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // Client can only access client routes
  if (role === 'client') {
    if (isCoachRoute || isSuperAdminRoute) {
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
