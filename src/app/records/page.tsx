import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { PersonsTable } from '@/components/PersonsTable';

export default async function RecordsPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  // Check if user has admin or moderator role
  const user = await currentUser();
  const userRole = user?.publicMetadata?.role as string;
  
  if (userRole !== 'admin' && userRole !== 'moderator') {
    redirect('/dashboard?error=staff_required');
  }

  return (
    <div className="min-h-screen bg-background pt-8 pb-8 px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Database Records</h1>
          <p className="text-muted-foreground mt-2">
            Browse and search all person records in the database
          </p>
        </div>

        <PersonsTable />
      </div>
    </div>
  );
}

