import { PersonSearch } from '@/components/PersonSearch';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { Card, CardContent } from '@/components/ui/card';

async function getStats() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/public/stats`, {
      cache: 'no-store'
    });
    const data = await response.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    return null;
  }
}

export default async function Home() {
  const stats = await getStats();

  return (
    <div className="min-h-screen bg-background pt-16 pb-24">
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-6xl">
            We will not forget them
          </h1>
          <p className="mx-auto mb-16 max-w-3xl text-lg text-muted-foreground leading-relaxed">
            Documenting and humanising the{' '}
            {stats ? <AnimatedCounter end={stats.totalPersons} /> : <strong>0</strong>}{' '}
            who have died in the Gaza genocide
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="border-2 shadow-lg">
            <CardContent className="pt-8 pb-8 px-6">
              <h2 className="text-2xl font-semibold mb-6 text-center">Contribute missing information</h2>
              <PersonSearch />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
