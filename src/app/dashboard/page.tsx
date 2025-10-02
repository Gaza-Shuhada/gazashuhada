import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { StatsCards } from '@/components/StatsCards';

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="mb-6">
            <svg className="mx-auto h-16 w-16 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Staff Access Required</h1>
          <p className="text-gray-600 mb-2">
            This application is for staff members only. You need admin or moderator privileges to access the dashboard.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Current role: <span className="font-medium">{userRole || 'Community Member'}</span>
          </p>
          <p className="text-sm text-gray-500 mb-6">
            If you believe you should have access, please contact an administrator.
          </p>
        </div>
      </div>
    );
  }
  
  const params = await searchParams;
  const error = params.error;

  return (
    <div className="min-h-screen bg-gray-50 pt-8 pb-8 px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, {user?.firstName || 'User'}!
          </h1>
          <p className="text-gray-600 mt-2">
            Manage Gaza deaths data and community submissions
          </p>
        </div>

        {/* Error Messages */}
        {error === 'admin_required' && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Access Denied</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>You attempted to access an admin-only area. Admin privileges are required.</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {error === 'moderator_required' && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Access Denied</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>You attempted to access a moderation area. Moderator or admin privileges are required.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {error === 'staff_required' && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Access Denied</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>You attempted to access a staff area. Admin or moderator privileges are required.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Overview */}
        <StatsCards />

        {/* Role Information */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Your Access Level</h4>
          <div className="flex flex-wrap gap-2">
            {user?.publicMetadata?.role === 'admin' && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                Admin
              </span>
            )}
            {user?.publicMetadata?.role === 'moderator' && (
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                Moderator
              </span>
            )}
            {!user?.publicMetadata?.role || (user?.publicMetadata?.role !== 'admin' && user?.publicMetadata?.role !== 'moderator') && (
              <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                Community Member
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
