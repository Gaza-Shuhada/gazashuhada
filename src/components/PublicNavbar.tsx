'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton, useAuth, useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { useState } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';

export function PublicNavbar() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const isStaff = user?.publicMetadata?.role === 'admin' || user?.publicMetadata?.role === 'moderator';

  return (
    <nav className="sticky top-0 z-50 bg-background shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Left: Navigation Links */}
          <div className="flex items-center space-x-6">
            {/* Mobile Menu Button - Only visible on mobile */}
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
                  
                  {/* Staff Tools Link */}
                  {isStaff && (
                    <Link
                      href="/tools"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-primary hover:text-primary/80 px-3 py-2 rounded-md text-sm font-medium transition-colors border-t pt-4 mt-4"
                    >
                      Admin Tools →
                    </Link>
                  )}
                </nav>
              </SheetContent>
            </Sheet>

            {/* Desktop Navigation - Hidden on mobile */}
            <div className="hidden md:flex items-center space-x-6">
              <Link
                href="/database"
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
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname?.startsWith('/contribution')
                    ? 'text-foreground font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Contributions
              </Link>
              <Link
                href="/about"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === '/about'
                    ? 'text-foreground font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                About
              </Link>
            </div>
          </div>

          {/* Center: Logo/Title */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-foreground whitespace-nowrap">Gaza Deaths وفيات غزة</span>
            </Link>
          </div>

          {/* Right Side: Staff Tools + Theme + User Menu */}
          <div className="flex items-center space-x-2">
            {/* Staff Tools Link - Desktop only */}
            {isStaff && (
              <Link
                href="/tools"
                className="hidden md:block text-primary hover:text-primary/80 px-3 py-2 rounded-md text-sm font-medium"
              >
                Admin Tools →
              </Link>
            )}

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

