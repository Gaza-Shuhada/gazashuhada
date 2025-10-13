import { PersonsTable } from '@/components/PersonsTable';

export default async function RecordsPage() {
  return (
    <div className="min-h-screen bg-background pt-8 pb-8 px-8">
      <div className="max-w-8xl mx-auto">

        <PersonsTable />
      </div>
    </div>
  );
}


