import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import ModerationClient from '@/app/tools/moderation/ModerationClient';

export default async function ModerationPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  const user = await currentUser();
  const role = user?.publicMetadata?.role as string;
  if (role !== 'admin' && role !== 'moderator') redirect('/?error=moderator_required');

  return (
    <div className="min-h-screen bg-background pt-8 pb-8 px-8">
      <div className="max-w-7xl mx-auto">
        <ModerationClient />
      </div>
    </div>
  );
}
