'use client';

import { useUser } from '@clerk/nextjs';
import { ReactNode } from 'react';

interface ProtectMetadataProps {
  role: string;
  fallback?: ReactNode;
  children: ReactNode;
}

export function ProtectMetadata({ role, fallback = null, children }: ProtectMetadataProps) {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <>{fallback}</>;
  }

  const userRole = user.publicMetadata?.role as string;

  // Check role hierarchy
  const hasAccess = () => {
    if (role === 'admin') {
      return userRole === 'admin';
    }
    if (role === 'moderator') {
      return userRole === 'moderator' || userRole === 'admin';
    }
    return userRole === role;
  };

  if (!hasAccess()) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
