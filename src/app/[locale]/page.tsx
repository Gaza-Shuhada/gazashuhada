'use client';

import { PersonSearch } from '@/components/PersonSearch';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n-context';
import { useState, useEffect } from 'react';

interface Person {
  id: string;
  externalId: string;
  name: string;
  photoUrlThumb?: string | null;
}

export default function Home() {
  const { t, locale } = useTranslation();
  const [stats, setStats] = useState<{ totalPersons: number } | null>(null);
  const [persons, setPersons] = useState<Person[]>([]);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/public/stats');
        const result = await response.json();
        if (result.success && result.data) {
          setStats({ totalPersons: result.data.totalPersons });
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    }
    fetchStats();
  }, []);

  useEffect(() => {
    async function fetchPersons() {
      try {
        // Use same params as database page in photos mode (limit=24)
        const response = await fetch('/api/public/persons?limit=24');
        const result = await response.json();
        if (result.success && result.data) {
          setPersons(result.data.persons);
        }
      } catch (error) {
        console.error('Failed to fetch persons:', error);
      }
    }
    fetchPersons();
  }, []);

  // Calculate number of photos needed for each screen size to fill viewport
  const totalPhotos = 250;

  return (
    <div className="relative min-h-screen bg-background pt-16 pb-24">
      {/* Background Photo Grid - Now scrolls with content */}
      <div className="absolute inset-0 z-0">
        {/* Gradient overlay: black at top fading to 0% opacity around 50vh */}
        <div className="absolute inset-0 bg-gradient-to-b from-background from-0% via-background/100 via-8% to-transparent to-90% z-10 pointer-events-none" />
        
        <div className="w-full grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-8 xl:grid-cols-11 2xl:grid-cols-14 gap-5">
          {/* Repeat photos to fill the background */}
          {persons.length > 0 && Array.from({ length: totalPhotos }).map((_, index) => {
            const person = persons[index % persons.length];
            return (
              <Link
                key={`${person.id}-${index}`}
                href={`/${locale}/person/${person.externalId}`}
                className="group relative aspect-square overflow-hidden cursor-pointer transition-all duration-100 hover:scale-105 hover:z-20 hover:border-2 hover:border-destructive block"
              >
                <Image
                  src={person.photoUrlThumb || '/placeholder.jpg'}
                  alt={person.name}
                  fill
                  className="object-cover opacity-80 transition-all duration-100 group-hover:opacity-80"
                  sizes="(max-width: 640px) 25vw, (max-width: 768px) 20vw, (max-width: 1024px) 14vw, 10vw"
                  unoptimized
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
            {t('home.title')}
          </h1>
          <p className="mx-auto mb-16 max-w-3xl text-2xl sm:text-3xl lg:text-4xl text-foreground/60 leading-relaxed tracking-tight">
            {t('home.subtitle')}
            <span className="text-destructive">
              {' '}{stats ? <AnimatedCounter end={stats.totalPersons} /> : 0}{' '}
            </span>
            {t('home.subtitleCount')} <span className="font-bold text-accent-foreground">{t('home.subtitleLocation')}</span> {t('home.subtitleEvent')}
          </p>
        </div>
      </main>

      {/* Sticky Search Card - Outside main content to allow proper sticking */}
      <div className="sticky top-[84px] z-40 mx-auto max-w-xl px-4">
        <Card className="py-0 border-2 shadow-2xl bg-card/80 backdrop-blur-md border-border rounded-2xl">
          <CardContent className="pt-10 pb-10 px-8">
            <PersonSearch />
            <p className="text-center text-muted-foreground text-md mt-6">
              {t('home.contributeText')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Spacer to allow scrolling */}
      <div className="h-screen"></div>
    </div>
  );
}

