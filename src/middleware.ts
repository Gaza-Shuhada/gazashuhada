import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';

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

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const isPublic = isPublicRoute(req);
  const isAdmin = isAdminRoute(req);
  const isModerator = isModeratorRoute(req);

  // Handle users who aren't authenticated
  if (!userId && !isPublic) {
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', req.url);
    return NextResponse.redirect(signInUrl);
  }
  
  // Check admin routes - Only protect API routes in middleware, let layout handle page protection
  if (isAdmin && userId && req.nextUrl.pathname.startsWith('/api/admin')) {
    try {
      const user = await currentUser();
      const userRole = user?.publicMetadata?.role as string;
      
      if (userRole !== 'admin') {
        return NextResponse.json(
          { error: 'Forbidden - Admin access required' },
          { status: 403 }
        );
      }
    } catch (error) {
      console.error('Error checking admin role:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
  
  // Check moderator routes - Only protect API routes in middleware, let layout handle page protection
  if (isModerator && userId && req.nextUrl.pathname.startsWith('/api/moderation')) {
    try {
      const user = await currentUser();
      const userRole = user?.publicMetadata?.role as string;
      
      if (userRole !== 'moderator' && userRole !== 'admin') {
        return NextResponse.json(
          { error: 'Forbidden - Moderator access required' },
          { status: 403 }
        );
      }
    } catch (error) {
      console.error('Error checking moderator role:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
  
  // If user is signed in and the current path is /sign-in or /sign-up, redirect to dashboard
  if (userId && (req.nextUrl.pathname === '/sign-in' || req.nextUrl.pathname === '/sign-up')) {
    const dashboardUrl = new URL('/dashboard', req.url);
    return NextResponse.redirect(dashboardUrl);
  }
  
  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
