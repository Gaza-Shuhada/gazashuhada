'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { SignInButton, SignOutButton, useAuth, useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Menu, Globe } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from '@/lib/i18n-context';
import { removeLocaleFromPathname, addLocaleToPathname, type Locale } from '@/lib/i18n';

export function PublicNavbar() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { t, locale } = useTranslation();

  const isStaff = user?.publicMetadata?.role === 'admin' || user?.publicMetadata?.role === 'moderator';
  const isPersonPage = pathname?.startsWith(`/${locale}/person/`);
  const isAdminSection = pathname?.startsWith('/tools');

  // Get path without locale for comparison
  const pathWithoutLocale = removeLocaleFromPathname(pathname || '');

  // Function to switch language
  const switchLanguage = (newLocale: Locale) => {
    const pathWithoutCurrentLocale = removeLocaleFromPathname(pathname || '');
    const newPath = addLocaleToPathname(pathWithoutCurrentLocale, newLocale);
    
    // Set cookie for persistence
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`; // 1 year
    
    // Navigate to new path
    router.push(newPath);
  };

  // Don't show language toggle in admin section
  const showLanguageToggle = !isAdminSection;

  return (
    <nav className={`sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${isPersonPage ? 'border-b' : ''}`}>
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Left: Navigation Links */}
          <div className="flex items-center space-x-6 rtl:space-x-reverse">
            {/* Mobile Menu Button - Always visible */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side={locale === 'ar' ? 'right' : 'left'} className="w-64">
                <SheetHeader>
                  <SheetTitle>{t('nav.about')}</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col space-y-4 mt-6">
                  <Link
                    href={`/${locale}/about`}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3 py-2 text-base font-medium transition-colors ${
                      pathWithoutLocale === '/about'
                        ? 'text-foreground font-semibold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {t('nav.about')}
                  </Link>
                  <Link
                    href={`/${locale}/database`}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3 py-2 text-base font-medium transition-colors ${
                      pathWithoutLocale === '/database' || pathWithoutLocale.startsWith('/person/')
                        ? 'text-foreground font-semibold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {t('nav.database')}
                  </Link>
                  
                  {/* Contributions - Only when signed in */}
                  {isSignedIn && (
                    <Link
                      href={`/${locale}/contribution`}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        pathWithoutLocale.startsWith('/contribution')
                          ? 'text-foreground font-semibold'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {t('nav.contributions')}
                    </Link>
                  )}
                  
                  {/* Staff Tools Link - Only for staff */}
                  {isStaff && (
                    <Link
                      href="/tools"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-primary hover:text-primary/80 px-3 py-2 rounded-md text-sm font-medium transition-colors border-t pt-4 mt-4"
                    >
                      {t('nav.adminTools')} →
                    </Link>
                  )}

                  {/* Language Toggle - Mobile */}
                  {showLanguageToggle && (
                    <button
                      onClick={() => {
                        switchLanguage(locale === 'ar' ? 'en' : 'ar');
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-2 text-muted-foreground hover:text-foreground px-3 py-2 rounded-md text-sm font-medium transition-colors border-t pt-4 mt-4 text-left rtl:text-right"
                    >
                      <Globe className="h-4 w-4" />
                      {locale === 'ar' ? 'English' : 'العربية'}
                    </button>
                  )}

                  {/* User Button / Sign In - Mobile only */}
                  <div className="border-t pt-4 mt-4">
                    {isSignedIn ? (
                      <SignOutButton>
                        <button className="text-muted-foreground hover:text-foreground px-3 py-2 rounded-md text-sm font-medium transition-colors w-full text-left rtl:text-right">
                          {t('nav.signOut')}
                        </button>
                      </SignOutButton>
                    ) : (
                      <SignInButton mode="modal">
                        <button className="text-muted-foreground hover:text-foreground px-3 py-2 rounded-md text-sm font-medium transition-colors w-full text-left rtl:text-right">
                          {t('nav.signIn')}
                        </button>
                      </SignInButton>
                    )}
                  </div>
                </nav>
              </SheetContent>
            </Sheet>

            {/* Desktop Navigation - Always visible */}
            <div className="hidden md:flex items-center space-x-8 rtl:space-x-reverse">
              <Link
                href={`/${locale}/about`}
                className={`px-3 py-2 text-base font-medium transition-colors border-b-2 ${
                  pathWithoutLocale === '/about'
                    ? 'text-foreground font-semibold border-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground border-transparent hover:border-accent-foreground/50'
                }`}
              >
                {t('nav.about')}
              </Link>
              <Link
                href={`/${locale}/database`}
                className={`px-3 py-2 text-base font-medium transition-colors border-b-2 ${
                  pathWithoutLocale === '/database' || pathWithoutLocale.startsWith('/person/')
                    ? 'text-foreground font-semibold border-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground border-transparent hover:border-accent-foreground/50'
                }`}
              >
                {t('nav.database')}
              </Link>
              
              {/* Contributions - Only when signed in */}
              {isSignedIn && (
                <Link
                  href={`/${locale}/contribution`}
                  className={`px-3 py-2 text-base font-medium transition-colors border-b-2 ${
                    pathWithoutLocale.startsWith('/contribution')
                      ? 'text-foreground font-semibold border-accent-foreground'
                      : 'text-muted-foreground hover:text-foreground border-transparent hover:border-accent-foreground/50'
                  }`}
                >
                  {t('nav.contributions')}
                </Link>
              )}
            </div>
          </div>

          {/* Center: Logo/Title */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <Link href={`/${locale}/`} className="flex items-center gap-4">
              {locale === 'ar' ? (
                <>
                  <span className="text-2xl text-foreground/80 whitespace-nowrap">شهداء غزة</span>
                  <span className="text-xl font-bold text-foreground whitespace-nowrap">Gaza Witnesses</span>
                </>
              ) : (
                <>
                  <span className="text-xl font-bold text-foreground whitespace-nowrap">Gaza Witnesses</span>
                  <span className="text-2xl text-foreground/80 whitespace-nowrap">شهداء غزة</span>
                </>
              )}
            </Link>
          </div>

          {/* Right Side: Language + Admin Tools + User Menu (Desktop only) */}
          <div className="hidden md:flex items-center space-x-6 rtl:space-x-reverse">
            
            {/* Language Selector */}
            {showLanguageToggle && (
              <button 
                onClick={() => switchLanguage(locale === 'ar' ? 'en' : 'ar')}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                aria-label={locale === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
              >
                <Globe className="h-4 w-4" />
                <span className={locale === 'ar' ? 'text-md' : 'text-lg'}>
                  {locale === 'ar' ? 'English' : 'العربية'}
                </span>
              </button>
            )}
            
            {/* Staff Tools Link - Desktop only */}
            {isStaff && (
              <Link
                href="/tools"
                className="text-muted-foreground hover:text-foreground px-3 py-2 text-md font-medium cursor-pointer"
              >
                {t('nav.adminTools')} →
              </Link>
            )}

            {/* User Button / Sign In - Desktop only */}
            {isSignedIn ? (
              <SignOutButton>
                <button className="text-muted-foreground hover:text-foreground px-3 py-2 text-md font-medium transition-colors cursor-pointer">
                  {t('nav.signOut')}
                </button>
              </SignOutButton>
            ) : (
              <SignInButton mode="modal">
                <button className="text-muted-foreground hover:text-foreground px-3 py-2 text-md font-medium transition-colors cursor-pointer">
                  {t('nav.signIn')}
                </button>
              </SignInButton>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

