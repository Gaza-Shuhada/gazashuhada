import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from 'next/server';

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhook",
  "/api/public(.*)"
]);

// Define staff routes that require admin or moderator role
const isStaffRoute = createRouteMatcher([
  "/tools"
]);

// Define admin routes that require admin role
const isAdminRoute = createRouteMatcher([
  "/tools/settings(.*)",
  "/tools/bulk-uploads(.*)",
  "/api/admin(.*)"
]);

// Define moderator routes that require moderator or admin role
const isModeratorRoute = createRouteMatcher([
  "/tools/moderation(.*)",
  "/tools/audit-logs(.*)",
  "/api/moderator(.*)"
]);

// Note: Community routes (/community, /api/community) are accessible by all authenticated users
// No special matcher needed since everyone (admin, moderator, community) can access them

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();
  const isPublic = isPublicRoute(req);
  const isStaff = isStaffRoute(req);
  const isAdmin = isAdminRoute(req);
  const isModerator = isModeratorRoute(req);

  // Handle users who aren't authenticated
  if (!userId && !isPublic) {
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', req.url);
    return NextResponse.redirect(signInUrl);
  }
  
  // Get user role from session claims
  const userRole = sessionClaims?.metadata?.role as string | undefined;
  
  // Check staff routes - Require admin or moderator
  if (isStaff && userId) {
    if (userRole !== 'admin' && userRole !== 'moderator') {
      const homeUrl = new URL('/', req.url);
      homeUrl.searchParams.set('error', 'staff_required');
      return NextResponse.redirect(homeUrl);
    }
  }
  
  // Check admin routes - Protect both API and page routes
  if (isAdmin && userId) {
    if (userRole !== 'admin') {
      if (req.nextUrl.pathname.startsWith('/api/admin')) {
        return NextResponse.json(
          { error: 'Forbidden - Admin access required' },
          { status: 403 }
        );
      }
      // Redirect to home for page routes
      const homeUrl = new URL('/', req.url);
      homeUrl.searchParams.set('error', 'admin_required');
      return NextResponse.redirect(homeUrl);
    }
  }
  
  // Check moderator routes - Protect both API and page routes
  if (isModerator && userId) {
    if (userRole !== 'moderator' && userRole !== 'admin') {
      if (req.nextUrl.pathname.startsWith('/api/moderator')) {
        return NextResponse.json(
          { error: 'Forbidden - Moderator access required' },
          { status: 403 }
        );
      }
      // Redirect to home for page routes
      const homeUrl = new URL('/', req.url);
      homeUrl.searchParams.set('error', 'moderator_required');
      return NextResponse.redirect(homeUrl);
    }
  }

  // Community routes are accessible by everyone (admin, moderator, and community members)
  // No special restrictions needed - everyone is part of the community
  
  // If user is signed in and the current path is /sign-in or /sign-up, redirect to home
  if (userId && (req.nextUrl.pathname === '/sign-in' || req.nextUrl.pathname === '/sign-up')) {
    const homeUrl = new URL('/', req.url);
    return NextResponse.redirect(homeUrl);
  }
  
  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
