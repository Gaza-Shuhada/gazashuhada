'use client';

import Link from 'next/link';
import { UserButton, useAuth, useUser } from '@clerk/nextjs';

export function Navbar() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            {/* Logo/Home */}
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-gray-900">Gaza Deaths Admin Tools</span>
            </Link>

            {/* Navigation Links */}
            {isSignedIn && (user?.publicMetadata?.role === 'admin' || user?.publicMetadata?.role === 'moderator') && (
              <div className="flex items-center space-x-6">
                <Link
                  href="/dashboard"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </Link>

                {/* Admin Links - Only show if user has admin role */}
                {user?.publicMetadata?.role === 'admin' && (
                  <Link
                    href="/bulk-uploads"
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Bulk Uploads
                  </Link>
                )}

                {/* Moderator Links - Only show if user has moderator or admin role */}
                {(user?.publicMetadata?.role === 'moderator' || user?.publicMetadata?.role === 'admin') && (
                  <>
                    <Link
                      href="/moderation/pending"
                      className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Moderation
                    </Link>
                  </>
                )}

                {/* Staff Links - admin and moderator */}
                {(user?.publicMetadata?.role === 'admin' || user?.publicMetadata?.role === 'moderator') && (
                  <>
                    <Link
                      href="/records"
                      className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Records
                    </Link>
                    <Link
                      href="/audit-logs"
                      className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Audit Logs
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="flex items-center">
            {isSignedIn ? (
              <UserButton 
                appearance={{
                  elements: {
                    avatarBox: "h-8 w-8"
                  }
                }}
                showName
              />
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/sign-in"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
