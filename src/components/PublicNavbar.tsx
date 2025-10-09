'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignInButton, SignOutButton, useAuth, useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { useState } from 'react';

export function PublicNavbar() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const isStaff = user?.publicMetadata?.role === 'admin' || user?.publicMetadata?.role === 'moderator';

  return (
    <nav className="sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Left: Navigation Links */}
          <div className="flex items-center space-x-6">
            {/* Mobile Menu Button - Always visible */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden text-white hover:text-white/80 hover:bg-white/10">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64">
                <SheetHeader>
                  <SheetTitle>Navigation</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col space-y-4 mt-6">
                  <Link
                    href="/about"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      pathname === '/about'
                        ? 'text-foreground font-semibold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    About
                  </Link>
                  <Link
                    href="/database"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      pathname === '/database'
                        ? 'text-foreground font-semibold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Database
                  </Link>
                  <Link
                    href="/contribution"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      pathname?.startsWith('/contribution')
                        ? 'text-foreground font-semibold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Contributions
                  </Link>
                  
                  {/* Staff Tools Link - Only for staff */}
                  {isStaff && (
                    <Link
                      href="/tools"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-primary hover:text-primary/80 px-3 py-2 rounded-md text-sm font-medium transition-colors border-t pt-4 mt-4"
                    >
                      Admin Tools →
                    </Link>
                  )}

                  {/* User Button / Sign In - Mobile only */}
                  <div className="border-t pt-4 mt-4">
                    {isSignedIn ? (
                      <SignOutButton>
                        <button className="text-muted-foreground hover:text-foreground px-3 py-2 rounded-md text-sm font-medium transition-colors w-full text-left">
                          Sign Out
                        </button>
                      </SignOutButton>
                    ) : (
                      <SignInButton mode="modal">
                        <button className="text-muted-foreground hover:text-foreground px-3 py-2 rounded-md text-sm font-medium transition-colors w-full text-left">
                          Sign In
                        </button>
                      </SignInButton>
                    )}
                  </div>
                </nav>
              </SheetContent>
            </Sheet>

            {/* Desktop Navigation - Always visible */}
            <div className="hidden md:flex items-center space-x-6">
              <Link
                href="/about"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === '/about'
                    ? 'text-white font-semibold'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                About
              </Link>
              <Link
                href="/database"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === '/database'
                    ? 'text-white font-semibold'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                Database
              </Link>
              <Link
                href="/contribution"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname?.startsWith('/contribution')
                    ? 'text-white font-semibold'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                Contributions
              </Link>
            </div>
          </div>

          {/* Center: Logo/Title */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-white whitespace-nowrap">Gaza Deaths وفيات غزة</span>
            </Link>
          </div>

          {/* Right Side: Staff Tools + User Menu (Desktop only) */}
          <div className="hidden md:flex items-center space-x-2">
            {/* Staff Tools Link - Desktop only */}
            {isStaff && (
              <Link
                href="/tools"
                className="text-white/80 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Admin Tools →
              </Link>
            )}

            {/* User Button / Sign In - Desktop only */}
            {isSignedIn ? (
              <SignOutButton>
                <button className="text-white/80 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Sign Out
                </button>
              </SignOutButton>
            ) : (
              <SignInButton mode="modal">
                <button className="text-white/80 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Sign In
                </button>
              </SignInButton>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

