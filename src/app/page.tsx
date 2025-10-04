import { auth, currentUser } from '@clerk/nextjs/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StatsCards } from '@/components/StatsCards';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface HomePageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Home({ searchParams }: HomePageProps) {
  const { userId } = await auth();

  // If user is NOT logged in, show marketing page
  if (!userId) {
    return (
    <div className="min-h-screen bg-background pt-16 pb-24">
      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-6xl">
            Document and Track
            <span className="block text-primary mt-2">Gaza Casualties</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground">
            A comprehensive platform to document, track, and preserve the memory of lives lost in Gaza.
            Join us in ensuring these stories are never forgotten.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/sign-up">Get Started</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/sign-in">Sign In</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                <svg className="h-6 w-6 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold">Document</h3>
              <p className="text-muted-foreground">
                Record detailed information about casualties with verified sources and documentation.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                <svg className="h-6 w-6 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold">Track</h3>
              <p className="text-muted-foreground">
                Monitor and analyze data with comprehensive statistics and visualizations.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                <svg className="h-6 w-6 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold">Remember</h3>
              <p className="text-muted-foreground">
                Preserve the memory and stories of those who have been lost.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
    );
  }

  // User is logged in - show dashboard content
  const user = await currentUser();
  const userRole = user?.publicMetadata?.role as string;
  const isStaff = userRole === 'admin' || userRole === 'moderator';
  
  const params = await searchParams;
  const error = params.error;

  return (
    <div className="min-h-screen bg-background pt-8 pb-8 px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            Welcome, {user?.firstName || 'User'}!
          </h1>
          <p className="text-muted-foreground mt-2">
            {isStaff 
              ? 'Manage Gaza deaths data and community submissions'
              : 'Help document and preserve the memory of lives lost in Gaza'
            }
          </p>
        </div>

        {/* Error Messages */}
        {error === 'admin_required' && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              You attempted to access an admin-only area. Admin privileges are required.
            </AlertDescription>
          </Alert>
        )}
        
        {error === 'moderator_required' && (
          <Alert className="mb-6">
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              You attempted to access a moderation area. Moderator or admin privileges are required.
            </AlertDescription>
          </Alert>
        )}

        {error === 'staff_required' && (
          <Alert className="mb-6">
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              You attempted to access a staff area. Admin or moderator privileges are required.
            </AlertDescription>
          </Alert>
        )}

        {/* Statistics Overview - Staff Only */}
        {isStaff && <StatsCards />}

        {/* Community Member Welcome Card */}
        {!isStaff && (
          <Card className="mb-8">
            <CardContent className="p-8">
              <div className="text-center max-w-2xl mx-auto">
                <div className="mb-6">
                  <svg className="mx-auto h-16 w-16 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mb-4">Thank You for Contributing</h2>
                <p className="text-muted-foreground mb-6">
                  As a community member, you can help document the lives lost in Gaza by submitting new records 
                  or suggesting edits to existing ones. Your contributions are reviewed by our moderation team 
                  before being added to the database.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link 
                    href="/community" 
                    className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
                  >
                    Submit a Proposal
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Role Information */}
        <Card className="mt-8">
          <CardContent className="p-4">
            <h4 className="font-medium mb-2">Your Access Level</h4>
            <div className="flex flex-wrap gap-2">
              {user?.publicMetadata?.role === 'admin' && (
                <Badge>Admin</Badge>
              )}
              {user?.publicMetadata?.role === 'moderator' && (
                <Badge variant="secondary">Moderator</Badge>
              )}
              {!isStaff && (
                <Badge variant="outline">Community Member</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
