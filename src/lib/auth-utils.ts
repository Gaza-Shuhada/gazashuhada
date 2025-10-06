import { auth, currentUser } from '@clerk/nextjs/server';

/**
 * Require Admin role
 * Only users with role='admin' can proceed
 */
export async function requireAdmin() {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('Unauthorized - not logged in');
  }

  const user = await currentUser();
  const role = user?.publicMetadata?.role as string;

  if (role !== 'admin') {
    throw new Error('Unauthorized - requires admin role');
  }

  return { userId, role };
}

/**
 * Require Moderator role (or Admin)
 * Users with role='moderator' or 'admin' can proceed
 */
export async function requireModerator() {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('Unauthorized - not logged in');
  }

  const user = await currentUser();
  const role = user?.publicMetadata?.role as string;

  if (role !== 'moderator' && role !== 'admin') {
    throw new Error('Unauthorized - requires moderator or admin role');
  }

  return { userId, role };
}

/**
 * Require any authenticated user
 * Any logged-in user can proceed (admin, moderator, or community)
 */
export async function requireAuth() {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('Unauthorized - not logged in');
  }

  const user = await currentUser();
  const role = (user?.publicMetadata?.role as string) || 'community';

  return { userId, role };
}

/**
 * Get current user if logged in, null otherwise
 * Does not throw errors
 */
export async function getCurrentUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await currentUser();
  const role = (user?.publicMetadata?.role as string) || 'community';
  
  return { userId, role };
}

/**
 * Check if current user has a specific role
 */
export async function hasRole(requiredRole: string) {
  const user = await currentUser();
  const role = user?.publicMetadata?.role as string;
  
  if (requiredRole === 'moderator') {
    return role === 'moderator' || role === 'admin';
  }
  
  return role === requiredRole;
}
