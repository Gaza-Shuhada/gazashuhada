'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useTranslation } from '@/lib/i18n-context';

type Person = {
  name: string;
  title: string;
  description: string;
  link: string;
  photo?: string;
}

const people: Person[] = [
  {
    name: 'Dima Hamdan',
    title: 'Journalist and filmmaker',
    description: 'Manager of the Marie Colvin Journalists\' Network (MCJN) | Media Trainer & Consultant',
    link: 'https://www.linkedin.com/in/dima-hamdan-9654b53/',
    photo: 'dima.jpg',
  },
  {
    name: 'Joshua Andresen',
    title: 'International lawyer & Legal academic',
    description: 'International lawyer with expertise in law of armed conflict and international human rights',
    link: 'https://www.linkedin.com/in/joshua-andresen-690907262/',
    photo: 'joshua.jpg',
  },
  {
    name: 'Randa Mirza',
    title: 'Visual artist',
    description: 'Artist focused on feminist work through photography, video, installation, and performance',
    link: 'http://www.randamirza.com/',
    photo: 'randa.jpg',
  },
  {
    name: 'Jens Munch',
    title: 'Entrepreneur & Builder',
    description: 'Building technology solutions that serve humanitarian causes and social justice',
    link: 'https://www.jensmunch.com/',
    photo: 'jens.jpg',
  },
  {
    name: 'Wil Grace',
    title: 'Product leader',
    description: '20 years of experience in product design and 8 years as a founder of UK tech startup',
    link: 'https://www.linkedin.com/in/wilgrace/',
    photo: 'wil.jpg',
  },
  {
    name: 'Heidi El-Hosaini',
    title: 'Geo data & Activism',
    description: 'Open-source GIS for NGOs, humanitarian meets tech, making data fun & interactive',
    link: 'https://www.instagram.com/he.idi.eh/?hl=en',
    photo: 'heidi.jpg',
  },
  {
    name: 'Imran Sulemanji',
    title: 'Technical Lead',
    description: 'From product to execution. Full-Stack Engineer, Technical Lead, Scalable Systems Architect',
    link: 'https://www.linkedin.com/in/imransulemanji/',
    photo: 'imran.jpg',
  },
  {
    name: 'Yousef Eldin',
    title: 'Director of video',
    description: 'Award winning director. He has shot for e.g. Guardian, BBC, Monocle, WIRED, and Vice',
    link: 'http://yousefeldin.com/info/',
    photo: 'yousef.jpg',
  },
];

export default function AboutPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background pt-8 pb-24">
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="space-y-12">
          {/* Mission Statement */}
          <div className="space-y-6 mt-6">
  
            <div className="space-y-6">
              <p className="text-xl leading-relaxed font-bold text-foreground">
                {t('about.mission')}
              </p>
              
              <p className="text-lg leading-relaxed text-muted-foreground">
                {t('about.purpose')}
              </p>
              
              <p className="text-lg leading-relaxed text-muted-foreground">
                {t('about.current')}
              </p>
              
              <p className="text-lg leading-relaxed font-semibold text-foreground">
                {t('about.belief')}
              </p>
            </div>
          </div>

          {/* Advisory Team Section */}
          <div className="text-center border-t pt-12">
            <h2 className="text-3xl font-bold">{t('about.teamTitle')}</h2>
            <p className="text-muted-foreground mt-4 text-lg">
              {t('about.teamSubtitle')}
            </p>
          </div>

          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {people.map((person) => (
              <li key={person.name} className="bg-card flex items-start gap-4 rounded-lg border p-4">
                <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-full">
                  <Image
                    src={person.photo ? `/team/${person.photo}` : '/placeholder-male-square.png'}
                    alt={person.name}
                    width={64}
                    height={64}
                    className="h-16 w-16 rounded-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 font-medium">
                    <Link
                      href={person.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {person.name}
                    </Link>
                  </div>
                  <div className="text-muted-foreground mb-2 text-sm font-medium">
                    {person.title}
                  </div>
                  <div className="text-muted-foreground text-sm leading-relaxed">
                    {person.description}
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* FAQ Section */}
          <div className="border-t pt-12">
            <h2 className="mb-8 text-center text-3xl font-bold">{t('about.faqTitle')}</h2>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-0">
                <AccordionTrigger className="text-left text-lg font-medium">
                  {t('about.faq.involved.q')}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <p>{t('about.faq.involved.a')}</p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-1">
                <AccordionTrigger className="text-left text-lg font-medium">
                  {t('about.faq.dataSources.q')}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <p>
                    {t('about.faq.dataSources.a')}{' '}
                    <a
                      href="https://github.com/Gaza-Deaths/gazadeaths/tree/main/data_sources"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {t('about.faq.dataSources.aLink')}
                    </a>
                    {' '}{t('about.faq.dataSources.a2')}
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger className="text-left text-lg font-medium">
                  {t('about.faq.ownership.q')}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <p>{t('about.faq.ownership.a')}</p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger className="text-left text-lg font-medium">
                  {t('about.faq.funding.q')}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <p>{t('about.faq.funding.a')}</p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4">
                <AccordionTrigger className="text-left text-lg font-medium">
                  {t('about.faq.iraqBodyCount.q')}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <p>{t('about.faq.iraqBodyCount.a')}</p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5">
                <AccordionTrigger className="text-left text-lg font-medium">
                  {t('about.faq.tech4palestine.q')}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <p>{t('about.faq.tech4palestine.a')}</p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6">
                <AccordionTrigger className="text-left text-lg font-medium">
                  {t('about.faq.moh.q')}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <p>{t('about.faq.moh.a')}</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <div className="text-center text-sm text-muted-foreground pt-8 border-t">
            <p>{t('about.footer')}</p>
          </div>
        </div>
      </main>
    </div>
  );
}

