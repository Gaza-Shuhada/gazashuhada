import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import BulkUploadsClient from './BulkUploadsClient';

export default async function BulkUploadsPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  const user = await currentUser();
  const role = user?.publicMetadata?.role as string;
  if (role !== 'admin') redirect('/?error=admin_required');
  return <BulkUploadsClient />;
}
