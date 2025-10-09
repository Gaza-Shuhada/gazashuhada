import { PersonSearch } from '@/components/PersonSearch';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { Card, CardContent } from '@/components/ui/card';
import { prisma } from '@/lib/prisma';
import Image from 'next/image';

async function getStats() {
  try {
    // Fetch stats directly from database instead of API call
    const totalPersons = await prisma.person.count({
      where: { isDeleted: false }
    });
    
    return { totalPersons };
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    return null;
  }
}

const people = [
  { name: 'Anas', image: '/people/anas.jpeg' },
  { name: 'Faten', image: '/people/faten.jpeg' },
  { name: 'Hind', image: '/people/hind.jpg' },
  { name: 'Ismael', image: '/people/ismael.jpeg' },
  { name: 'Khaled', image: '/people/khaled.jpg' },
  { name: 'Lana', image: '/people/lana.jpg' },
  { name: 'Omar', image: '/people/omar.jpg' },
  { name: 'Rakan', image: '/people/rakan.jpg' },
  { name: 'Sara', image: '/people/sara.jpeg' },
  { name: 'Suleiman', image: '/people/suleiman.jpeg' },
  { name: 'Yaqeen', image: '/people/yaqeen.jpg' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.10.17.png' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.10.24.png' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.10.30.png' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.10.34.png' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.10.38.png' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.10.42.png' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.10.48.png' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.10.52.png' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.10.56.png' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.11.02.png' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.11.05.png' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.11.09.png' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.11.13.png' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.11.16.png' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.11.20.png' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.11.25.png' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.11.29.png' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.11.33.png' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.11.37.png' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.11.40.png' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.11.44.png' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.11.48.png' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.11.52.png' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.11.56.png' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.12.00.png' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.12.03.png' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.12.06.png' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.12.11.png' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.12.15.png' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.12.19.png' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.12.26.png' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.12.29.png' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.12.33.png' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.12.36.png' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.12.39.png' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.12.44.png' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.12.48.png' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.12.52.png' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.21.07.png' },
];

export default async function Home() {
  const stats = await getStats();

  return (
    <div className="relative min-h-screen bg-black pt-16 pb-24">
      {/* Background Photo Grid */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-14 gap-0.5">
          {/* Repeat photos to fill the background */}
          {Array.from({ length: 120 }).map((_, index) => {
            const person = people[index % people.length];
            return (
              <div
                key={`${person.name}-${index}`}
                className="group relative aspect-square overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:z-10"
              >
                <Image
                  src={person.image}
                  alt={person.name}
                  fill
                  className="object-cover opacity-40 transition-all duration-300 group-hover:opacity-70"
                  sizes="(max-width: 640px) 16vw, (max-width: 768px) 12vw, (max-width: 1024px) 10vw, 7vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-100 group-hover:opacity-50 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-2 text-white font-medium text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center">
                  {person.name}
                </div>
              </div>
            );
          })}
        </div>
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Main Content */}
      <main className="relative z-10 mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-6xl text-white">
            We will not forget them
          </h1>
          <p className="mx-auto mb-16 max-w-3xl text-lg text-gray-300 leading-relaxed">
            Documenting and humanising the{' '}
            {stats ? <AnimatedCounter end={stats.totalPersons} /> : <strong>0</strong>}{' '}
            who have died in the Gaza genocide
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="border-2 shadow-2xl bg-black/40 backdrop-blur-sm border-white/10">
            <CardContent className="pt-8 pb-8 px-6">
              <h2 className="text-2xl font-semibold mb-6 text-center text-white">Contribute missing information</h2>
              <PersonSearch />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
