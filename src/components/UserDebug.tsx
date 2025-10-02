'use client';

import { useUser } from '@clerk/nextjs';

export function UserDebug() {
  const { user } = useUser();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <h4 className="font-medium text-yellow-900 mb-2">Debug Info (Development Only)</h4>
      <div className="text-sm text-yellow-800">
        <p><strong>User ID:</strong> {user?.id}</p>
        <p><strong>Email:</strong> {user?.primaryEmailAddress?.emailAddress}</p>
        <p><strong>Public Metadata:</strong></p>
        <pre className="mt-1 bg-yellow-100 p-2 rounded text-xs overflow-auto">
          {JSON.stringify(user?.publicMetadata, null, 2)}
        </pre>
      </div>
    </div>
  );
}
