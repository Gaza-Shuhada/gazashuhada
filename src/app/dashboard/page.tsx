import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { PersonsTable } from '@/components/PersonsTable';
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

        {/* Statistics Overview */}
        <StatsCards />

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Admin Features */}
          {user?.publicMetadata?.role === 'admin' && (
            <Link
              href="/admin/bulk-uploads"
              className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="flex items-center mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h3 className="ml-3 text-lg font-semibold text-gray-900">Bulk Uploads</h3>
              </div>
              <p className="text-gray-600">
                Upload and manage CSV files with person data
              </p>
            </Link>
          )}

          {/* Moderator Features */}
          {(user?.publicMetadata?.role === 'moderator' || user?.publicMetadata?.role === 'admin') && (
            <Link
              href="/moderation/pending"
              className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="flex items-center mb-4">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="ml-3 text-lg font-semibold text-gray-900">Moderation</h3>
              </div>
              <p className="text-gray-600">
                Review and approve community submissions
              </p>
            </Link>
          )}

          {/* General Features */}
          <div className="p-6 bg-white rounded-lg shadow">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-900">Statistics</h3>
            </div>
            <p className="text-gray-600">
              View data statistics and reports (Coming Soon)
            </p>
          </div>

          <div className="p-6 bg-white rounded-lg shadow">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-900">Profile</h3>
            </div>
            <p className="text-gray-600">
              Manage your account settings
            </p>
          </div>

          <div className="p-6 bg-white rounded-lg shadow">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-900">Community</h3>
            </div>
            <p className="text-gray-600">
              Submit corrections and flag issues (Coming Soon)
            </p>
          </div>
        </div>

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

        {/* Database Records Section */}
        <div className="mt-8">
          <PersonsTable />
        </div>
      </div>
    </div>
  );
}
