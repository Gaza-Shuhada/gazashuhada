import { auth, currentUser } from '@clerk/nextjs/server';

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

  return { userId };
}

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

  return { userId };
}

export async function getCurrentUser() {
  const { userId } = await auth();
  return userId ? { userId } : null;
}

export async function hasRole(requiredRole: string) {
  const user = await currentUser();
  const role = user?.publicMetadata?.role as string;
  
  if (requiredRole === 'moderator') {
    return role === 'moderator' || role === 'admin';
  }
  
  return role === requiredRole;
}
