'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { useState } from 'react';

export function ToolsNavbar() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

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
                          <Link
                            href="/tools/bulk-uploads"
                            onClick={() => setMobileMenuOpen(false)}
                            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                              pathname === '/tools/bulk-uploads'
                                ? 'text-foreground font-semibold'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            Bulk Uploads
                          </Link>
                        )}
                        <Link
                          href="/tools/moderation"
                          onClick={() => setMobileMenuOpen(false)}
                          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                            pathname === '/tools/moderation'
                              ? 'text-foreground font-semibold'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          Moderation
                        </Link>
                        <Link
                          href="/tools/audit-logs"
                          onClick={() => setMobileMenuOpen(false)}
                          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                            pathname === '/tools/audit-logs'
                              ? 'text-foreground font-semibold'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          Audit Logs
                        </Link>
                        {isAdmin && (
                          <Link
                            href="/tools/admin"
                            onClick={() => setMobileMenuOpen(false)}
                            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                              pathname === '/tools/admin'
                                ? 'text-foreground font-semibold'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            Admin
                          </Link>
                        )}
                      </>
                    )}
                    {/* Back to Public Site */}
                    <Link
                      href="/"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-primary hover:text-primary/80 px-3 py-2 rounded-md text-sm font-medium transition-colors border-t pt-4 mt-4"
                    >
                      ← Back to Site
                    </Link>
                  </nav>
                </SheetContent>
              </Sheet>
            )}

            {/* Logo/Home */}
            <Link href="/tools" className="flex items-center">
              <span className="text-xl font-bold text-foreground">Tools</span>
            </Link>

            {/* Desktop Navigation - Hidden on mobile */}
            {isSignedIn && (
              <div className="hidden md:flex items-center space-x-6">
                {/* Staff Links - admin and moderator */}
                {isStaff && (
                  <>
                    {/* Admin Links - Only show if user has admin role */}
                    {isAdmin && (
                      <Link
                        href="/tools/bulk-uploads"
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          pathname === '/tools/bulk-uploads'
                            ? 'text-foreground font-semibold'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Bulk Uploads
                      </Link>
                    )}

                    <Link
                      href="/tools/moderation"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        pathname === '/tools/moderation'
                          ? 'text-foreground font-semibold'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Moderation
                    </Link>

                    <Link
                      href="/tools/audit-logs"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        pathname === '/tools/audit-logs'
                          ? 'text-foreground font-semibold'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Audit Logs
                    </Link>

                    {isAdmin && (
                      <Link
                        href="/tools/admin"
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          pathname === '/tools/admin'
                            ? 'text-foreground font-semibold'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Admin
                      </Link>
                    )}
                  </>
                )}

                {/* Back to Public Site */}
                <Link
                  href="/"
                  className="text-primary hover:text-primary/80 px-3 py-2 rounded-md text-sm font-medium"
                >
                  ← Back to Site
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
