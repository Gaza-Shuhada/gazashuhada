import { PersonSearch } from '@/components/PersonSearch';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { Card, CardContent } from '@/components/ui/card';
import { prisma } from '@/lib/prisma';
import Image from 'next/image';
import Link from 'next/link';

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
  const totalPhotos = 250;

  return (
    <div className="relative min-h-screen bg-background pt-16 pb-24">
      {/* Background Photo Grid - Now scrolls with content */}
      <div className="absolute inset-0 z-0">
        {/* Gradient overlay: black at top fading to 0% opacity around 50vh */}
        <div className="absolute inset-0 bg-gradient-to-b from-background from-0% via-background/100 via-8% to-transparent to-90% z-10 pointer-events-none" />
        
        <div className="w-full grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-8 xl:grid-cols-11 2xl:grid-cols-14 gap-5">
          {/* Repeat photos to fill the background */}
          {Array.from({ length: totalPhotos }).map((_, index) => {
            const person = people[index % people.length];
            return (
              <Link
                key={`${person.name}-${index}`}
                href="/person/803354208"
                className="group relative aspect-square overflow-hidden cursor-pointer transition-all duration-100 hover:scale-105 hover:z-20 hover:border-2 hover:border-destructive block"
              >
                <Image
                  src={person.image}
                  alt={person.name}
                  fill
                  className="object-cover opacity-80 transition-all duration-100 group-hover:opacity-80"
                  sizes="(max-width: 640px) 25vw, (max-width: 768px) 20vw, (max-width: 1024px) 14vw, 10vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-background/30 to-transparent opacity-100 group-hover:opacity-50 transition-opacity duration-100 pointer-events-none" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 mx-auto max-w-6xl px-4 pt-20 pb-0 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="mb-8 text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl text-foreground">
            We will not forget them
          </h1>
          <p className="mx-auto mb-16 max-w-3xl text-2xl sm:text-3xl lg:text-4xl text-foreground/60 leading-relaxed tracking-tight">
            Documenting and humanising the<span className="text-destructive">{' '}
            {stats ? <AnimatedCounter end={stats.totalPersons} /> : 0}{' '}</span>
            who have died in the <span className="font-bold text-accent-foreground">Gaza</span> genocide
          </p>
        </div>
      </main>

      {/* Sticky Search Card - Outside main content to allow proper sticking */}
      <div className="sticky top-[84px] z-40 mx-auto max-w-xl px-4">
        <Card className="py-0 border-2 shadow-2xl bg-card/80 backdrop-blur-md border-border rounded-2xl">
          <CardContent className="pt-10 pb-10 px-8">
            <PersonSearch />
            <p className="text-center text-muted-foreground text-md mt-6">
              Contribute missing information and help remember their lives
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Spacer to allow scrolling */}
      <div className="h-screen"></div>
    </div>
  );
}
