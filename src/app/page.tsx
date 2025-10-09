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
    
    // Count persons with community contributions (approved submissions)
    const personsWithCommunityEdits = await prisma.person.count({
      where: {
        isDeleted: false,
        submissions: {
          some: {
            status: 'APPROVED'
          }
        }
      }
    });
    
    // Calculate percentage of records still missing community information
    const percentageMissing = totalPersons > 0 
      ? Math.round(((totalPersons - personsWithCommunityEdits) / totalPersons) * 100)
      : 0;
    
    return { totalPersons, percentageMissing };
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    return null;
  }
}

const people = [
  { name: 'Anas', image: '/people/anas.webp' },
  { name: 'Faten', image: '/people/faten.webp' },
  { name: 'Hind', image: '/people/hind.webp' },
  { name: 'Ismael', image: '/people/ismael.webp' },
  { name: 'Khaled', image: '/people/khaled.webp' },
  { name: 'Lana', image: '/people/lana.webp' },
  { name: 'Omar', image: '/people/omar.webp' },
  { name: 'Rakan', image: '/people/rakan.webp' },
  { name: 'Sara', image: '/people/sara.webp' },
  { name: 'Suleiman', image: '/people/suleiman.webp' },
  { name: 'Yaqeen', image: '/people/yaqeen.webp' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.10.17.webp' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.10.24.webp' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.10.30.webp' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.10.34.webp' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.10.38.webp' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.10.42.webp' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.10.48.webp' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.10.52.webp' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.10.56.webp' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.11.02.webp' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.11.05.webp' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.11.09.webp' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.11.13.webp' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.11.16.webp' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.11.20.webp' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.11.25.webp' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.11.29.webp' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.11.33.webp' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.11.37.webp' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.11.40.webp' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.11.44.webp' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.11.48.webp' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.11.52.webp' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.11.56.webp' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.12.00.webp' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.12.03.webp' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.12.06.webp' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.12.11.webp' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.12.15.webp' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.12.19.webp' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.12.26.webp' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.12.29.webp' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.12.33.webp' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.12.36.webp' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.12.39.webp' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.12.44.webp' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.12.48.webp' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.12.52.webp' },
  { name: 'Person', image: '/people/Screenshot 2025-10-09 at 11.21.07.webp' },
];

export default async function Home() {
  const stats = await getStats();

  // Calculate number of photos needed for each screen size to fill viewport
  // Mobile: 6x12 = 72, Tablet: 8x8 = 64, Desktop: 12x6 = 72, Large: 14x6 = 84, XLarge: 20x8 = 160
  const totalPhotos = 160;

  return (
    <div className="relative min-h-screen bg-black pt-16 pb-24">
      {/* Background Photo Grid */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <div className="w-full grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-16 2xl:grid-cols-20 gap-0.5">
          {/* Repeat photos to fill the background */}
          {Array.from({ length: totalPhotos }).map((_, index) => {
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
          <p className="mx-auto mb-4 max-w-3xl text-lg text-gray-300 leading-relaxed">
            Documenting and humanising the{' '}
            {stats ? <AnimatedCounter end={stats.totalPersons} /> : <strong>0</strong>}{' '}
            who have died in the Gaza genocide
          </p>
          {stats && stats.percentageMissing > 0 && (
            <p className="mx-auto mb-16 max-w-3xl text-base text-gray-400 leading-relaxed">
              {stats.percentageMissing}% of our records are still missing information. Help us by spreading the word and contributing.
            </p>
          )}
          {stats && stats.percentageMissing === 0 && (
            <p className="mx-auto mb-16 max-w-3xl text-base text-gray-400 leading-relaxed">
              Help us by spreading the word and contributing more information.
            </p>
          )}
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
