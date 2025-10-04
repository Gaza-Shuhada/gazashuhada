'use client';

import { useUser } from '@clerk/nextjs';
import { ReactNode } from 'react';
import Link from 'next/link';

interface BulkUploadsLayoutProps {
  children: ReactNode;
}

export default function BulkUploadsLayout({ children }: BulkUploadsLayoutProps) {
  const { user, isLoaded } = useUser();

  // Show loading spinner while user data loads
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user is signed in
  if (!user) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-center">
          <div className="mb-6">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-4">Authentication Required</h1>
          <p className="text-muted-foreground mb-6">You must be signed in to access this page.</p>
          <Link
            href="/sign-in"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  // Check if user has admin role
  const userRole = user.publicMetadata?.role as string;
  if (userRole !== 'admin') {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-center">
          <div className="mb-6">
            <svg className="mx-auto h-16 w-16 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-4">Admin Access Required</h1>
          <p className="text-muted-foreground mb-2">You need admin privileges to access bulk uploads.</p>
          <p className="text-sm text-muted-foreground mb-6">
            Current role: <span className="font-medium">{userRole || 'Community Member'}</span>
          </p>
          <div className="space-x-4">
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md text-foreground bg-background hover:bg-muted"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // User is authenticated and has admin role - render children
  return <>{children}</>;
}

