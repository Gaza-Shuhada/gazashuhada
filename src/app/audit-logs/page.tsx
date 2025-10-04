import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import AuditLogsClient from '@/app/audit-logs/AuditLogsClient';

export default async function AuditLogsPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  const user = await currentUser();
  const role = user?.publicMetadata?.role as string;
  if (role !== 'admin' && role !== 'moderator') redirect('/?error=moderator_required');
  return (
    <div className="min-h-screen bg-background pt-8 pb-8 px-8">
      <div className="max-w-7xl mx-auto">
        <AuditLogsClient />
      </div>
    </div>
  );
}

