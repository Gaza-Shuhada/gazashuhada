import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function Home() {
  const { userId } = await auth();

  // If user is already signed in, redirect to dashboard
  if (userId) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pt-16">
      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="mb-6 text-5xl font-bold tracking-tight text-white sm:text-6xl">
            Document and Track
            <span className="block text-blue-400">Gaza Casualties</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-300">
            A comprehensive platform to document, track, and preserve the memory of lives lost in Gaza.
            Join us in ensuring these stories are never forgotten.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/sign-up"
              className="rounded-lg bg-blue-600 px-8 py-3 text-base font-semibold text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl"
            >
              Get Started
            </Link>
            <Link
              href="/sign-in"
              className="rounded-lg border border-gray-600 bg-white/5 px-8 py-3 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10"
            >
              Sign In
            </Link>
          </div>
        </div>

        <div className="mt-24 grid gap-8 md:grid-cols-3">
          <div className="rounded-lg bg-white/5 p-8 backdrop-blur-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-semibold text-white">Document</h3>
            <p className="text-gray-400">
              Record detailed information about casualties with verified sources and documentation.
            </p>
          </div>

          <div className="rounded-lg bg-white/5 p-8 backdrop-blur-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-semibold text-white">Track</h3>
            <p className="text-gray-400">
              Monitor and analyze data with comprehensive statistics and visualizations.
            </p>
          </div>

          <div className="rounded-lg bg-white/5 p-8 backdrop-blur-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-semibold text-white">Remember</h3>
            <p className="text-gray-400">
              Preserve the memory and stories of those who have been lost.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
