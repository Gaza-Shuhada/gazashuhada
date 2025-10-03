import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { StatsCards } from '@/components/StatsCards';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface DashboardPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  const user = await currentUser();
  const userRole = user?.publicMetadata?.role as string;
  
  // Check if user has staff role (admin or moderator)
  if (userRole !== 'admin' && userRole !== 'moderator') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="text-center max-w-md">
          <CardContent className="pt-6 pb-6">
            <div className="mb-6">
              <svg className="mx-auto h-16 w-16 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-4">Staff Access Required</h1>
            <p className="text-muted-foreground mb-2">
              This application is for staff members only. You need admin or moderator privileges to access the dashboard.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Current role: <Badge variant="outline">{userRole || 'Community Member'}</Badge>
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              If you believe you should have access, please contact an administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
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
            Manage Gaza deaths data and community submissions
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

        {/* Statistics Overview */}
        <StatsCards />

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
              {!user?.publicMetadata?.role || (user?.publicMetadata?.role !== 'admin' && user?.publicMetadata?.role !== 'moderator') && (
                <Badge variant="outline">Community Member</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
