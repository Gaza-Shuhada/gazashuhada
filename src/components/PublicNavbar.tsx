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
  const isPersonPage = pathname?.startsWith('/person/');

  return (
    <nav className={`sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${isPersonPage ? 'border-b' : ''}`}>
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Left: Navigation Links */}
          <div className="flex items-center space-x-6">
            {/* Mobile Menu Button - Always visible */}
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
                  <Link
                    href="/about"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3 py-2 text-base font-medium transition-colors ${
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
                    className={`px-3 py-2 text-base font-medium transition-colors ${
                      pathname === '/database' || pathname?.startsWith('/person/')
                        ? 'text-foreground font-semibold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Database
                  </Link>
                  
                  {/* Contributions - Only when signed in */}
                  {isSignedIn && (
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
                  )}
                  
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
            <div className="hidden md:flex items-center space-x-8">
              <Link
                href="/about"
                className={`px-3 py-2 text-base font-medium transition-colors border-b-2 ${
                  pathname === '/about'
                    ? 'text-foreground font-semibold border-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground border-transparent hover:border-accent-foreground/50'
                }`}
              >
                About
              </Link>
              <Link
                href="/database"
                className={`px-3 py-2 text-base font-medium transition-colors border-b-2 ${
                  pathname === '/database' || pathname?.startsWith('/person/')
                    ? 'text-foreground font-semibold border-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground border-transparent hover:border-accent-foreground/50'
                }`}
              >
                Database
              </Link>
              
              {/* Contributions - Only when signed in */}
              {isSignedIn && (
                <Link
                  href="/contribution"
                  className={`px-3 py-2 text-base font-medium transition-colors border-b-2 ${
                    pathname?.startsWith('/contribution')
                      ? 'text-foreground font-semibold border-accent-foreground'
                      : 'text-muted-foreground hover:text-foreground border-transparent hover:border-accent-foreground/50'
                  }`}
                >
                  Contributions
                </Link>
              )}
            </div>
          </div>

          {/* Center: Logo/Title */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-foreground whitespace-nowrap mr-8">Gaza Witnesses</span> <span className="text-2xl text-foreground/80 whitespace-nowrap">شهداء غزة</span>
            </Link>
          </div>

          {/* Right Side: Gaza Death Toll + Language + User Menu (Desktop only) */}
          <div className="hidden md:flex items-center space-x-6">
            
            {/* Language Selector */}
            <div className="flex items-center space-x-2">
              <button className="text-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                العربية
              </button>
            </div>
            
            {/* Staff Tools Link - Desktop only */}
            {isStaff && (
              <Link
                href="/tools"
                className="text-muted-foreground hover:text-foreground px-3 py-2 text-md font-medium cursor-pointer"
              >
                Admin Tools →
              </Link>
            )}

            {/* User Button / Sign In - Desktop only */}
            {isSignedIn ? (
              <SignOutButton>
                <button className="text-muted-foreground hover:text-foreground px-3 py-2 text-md font-medium transition-colors cursor-pointer">
                  Sign Out
                </button>
              </SignOutButton>
            ) : (
              <SignInButton mode="modal">
                <button className="text-muted-foreground hover:text-foreground px-3 py-2 text-md font-medium transition-colors cursor-pointer">
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

