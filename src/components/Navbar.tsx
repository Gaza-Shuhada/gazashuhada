'use client';

import Link from 'next/link';
import { UserButton, useAuth, useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';

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
              <span className="text-xl font-bold text-gray-900">Admin Tools</span>
            </Link>

            {/* Navigation Links */}
            {isSignedIn && (
              <div className="flex items-center space-x-6">
                {/* Staff Links - admin and moderator */}
                {(user?.publicMetadata?.role === 'admin' || user?.publicMetadata?.role === 'moderator') && (
                  <>
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

                    <Link
                      href="/moderation/pending"
                      className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Moderation
                    </Link>

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

                {/* Community Links - Show for everyone (admins, moderators, and community members) */}
                <Link
                  href="/community/submit"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Community
                </Link>
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
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/sign-in">Sign In</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/sign-up">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
