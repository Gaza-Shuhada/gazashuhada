import { PersonsTable } from '@/components/PersonsTable';

export default async function RecordsPage() {
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

