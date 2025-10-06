'use client';

import Link from 'next/link';
import { UserButton, useAuth, useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { useState } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';

export function Navbar() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isStaff = user?.publicMetadata?.role === 'admin' || user?.publicMetadata?.role === 'moderator';
  const isAdmin = user?.publicMetadata?.role === 'admin';

  return (
    <nav className="sticky top-0 z-50 bg-background shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-4">
            {/* Mobile Menu Button - Only visible on mobile when signed in */}
            {isSignedIn && (
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64">
                  <SheetHeader>
                    <SheetTitle>Navigation</SheetTitle>
                  </SheetHeader>
                  <nav className="flex flex-col space-y-4 mt-6">
                    {/* Staff Links */}
                    {isStaff && (
                      <>
                        {isAdmin && (
                          <>
                            <Link
                              href="/bulk-uploads"
                              onClick={() => setMobileMenuOpen(false)}
                              className="text-muted-foreground hover:text-foreground px-3 py-2 rounded-md text-sm font-medium hover:bg-accent transition-colors"
                            >
                              Bulk Uploads
                            </Link>
                            <Link
                              href="/admin/settings"
                              onClick={() => setMobileMenuOpen(false)}
                              className="text-muted-foreground hover:text-foreground px-3 py-2 rounded-md text-sm font-medium hover:bg-accent transition-colors"
                            >
                              Settings
                            </Link>
                          </>
                        )}
                        <Link
                          href="/moderation"
                          onClick={() => setMobileMenuOpen(false)}
                          className="text-muted-foreground hover:text-foreground px-3 py-2 rounded-md text-sm font-medium hover:bg-accent transition-colors"
                        >
                          Moderation
                        </Link>
                        <Link
                          href="/records"
                          onClick={() => setMobileMenuOpen(false)}
                          className="text-muted-foreground hover:text-foreground px-3 py-2 rounded-md text-sm font-medium hover:bg-accent transition-colors"
                        >
                          Records
                        </Link>
                        <Link
                          href="/audit-logs"
                          onClick={() => setMobileMenuOpen(false)}
                          className="text-muted-foreground hover:text-foreground px-3 py-2 rounded-md text-sm font-medium hover:bg-accent transition-colors"
                        >
                          Audit Logs
                        </Link>
                      </>
                    )}
                    {/* Community Link - Everyone */}
                    <Link
                      href="/community"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-muted-foreground hover:text-foreground px-3 py-2 rounded-md text-sm font-medium hover:bg-accent transition-colors"
                    >
                      Community
                    </Link>
                  </nav>
                </SheetContent>
              </Sheet>
            )}

            {/* Logo/Home */}
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-foreground">Admin Tools</span>
            </Link>

            {/* Desktop Navigation - Hidden on mobile */}
            {isSignedIn && (
              <div className="hidden md:flex items-center space-x-6">
                {/* Staff Links - admin and moderator */}
                {isStaff && (
                  <>
                    {/* Admin Links - Only show if user has admin role */}
                    {isAdmin && (
                      <>
                        <Link
                          href="/bulk-uploads"
                          className="text-muted-foreground hover:text-foreground px-3 py-2 rounded-md text-sm font-medium"
                        >
                          Bulk Uploads
                        </Link>
                        <Link
                          href="/admin/settings"
                          className="text-muted-foreground hover:text-foreground px-3 py-2 rounded-md text-sm font-medium"
                        >
                          Settings
                        </Link>
                      </>
                    )}

                    <Link
                      href="/moderation"
                      className="text-muted-foreground hover:text-foreground px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Moderation
                    </Link>

                    <Link
                      href="/records"
                      className="text-muted-foreground hover:text-foreground px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Records
                    </Link>
                    <Link
                      href="/audit-logs"
                      className="text-muted-foreground hover:text-foreground px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Audit Logs
                    </Link>
                  </>
                )}

                {/* Community Links - Show for everyone */}
                <Link
                  href="/community"
                  className="text-muted-foreground hover:text-foreground px-3 py-2 rounded-md text-sm font-medium"
                >
                  Community
                </Link>
              </div>
            )}
          </div>

          {/* Right Side: Theme + User Menu */}
          <div className="flex items-center space-x-2">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Button / Sign In */}
            {isSignedIn ? (
              <UserButton 
                appearance={{
                  elements: {
                    avatarBox: "h-8 w-8",
                    userButtonPopoverCard: "bg-background border-border",
                    userButtonPopoverActionButton: "text-foreground hover:bg-accent",
                    userButtonPopoverActionButtonText: "text-foreground",
                    userButtonPopoverFooter: "hidden",
                  },
                  variables: {
                    colorText: "hsl(var(--foreground))",
                    colorTextSecondary: "hsl(var(--muted-foreground))",
                  }
                }}
                showName
              />
            ) : (
              <div className="flex items-center space-x-2">
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
