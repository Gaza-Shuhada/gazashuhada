import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from 'next/server';

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhook",
  "/api/trpc/example.hello"
]);

// Define admin routes that require admin role
const isAdminRoute = createRouteMatcher([
  "/admin(.*)",
  "/api/admin(.*)"
]);

// Define moderator routes that require moderator or admin role
const isModeratorRoute = createRouteMatcher([
  "/moderation(.*)",
  "/api/moderation(.*)"
]);

// Note: Community routes (/community, /api/community) are accessible by all authenticated users
// No special matcher needed since everyone (admin, moderator, community) can access them

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();
  const isPublic = isPublicRoute(req);
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
  
  // Check admin routes - Only protect API routes in middleware, let layout handle page protection
  if (isAdmin && userId && req.nextUrl.pathname.startsWith('/api/admin')) {
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }
  }
  
  // Check moderator routes - Only protect API routes in middleware, let layout handle page protection
  if (isModerator && userId && req.nextUrl.pathname.startsWith('/api/moderation')) {
    if (userRole !== 'moderator' && userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Moderator access required' },
        { status: 403 }
      );
    }
  }

  // Community routes are accessible by everyone (admin, moderator, and community members)
  // No special restrictions needed - everyone is part of the community
  
  // If user is signed in and the current path is /sign-in or /sign-up, redirect based on role
  if (userId && (req.nextUrl.pathname === '/sign-in' || req.nextUrl.pathname === '/sign-up')) {
    if (userRole === 'admin' || userRole === 'moderator') {
      const dashboardUrl = new URL('/dashboard', req.url);
      return NextResponse.redirect(dashboardUrl);
    } else {
      // Community members go to submissions page
      const communityUrl = new URL('/community/submit', req.url);
      return NextResponse.redirect(communityUrl);
    }
  }
  
  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
