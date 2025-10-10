import Image from 'next/image';
import Link from 'next/link';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

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

const faqItems = [
  {
    question: 'Who is involved in this project?',
    answer: 'An informal advisory team (see page) has been formed that is establishing a charity in the UK that will hold all of the data and assets. This group will also establish Memorandum and Articles of Association, Code of Conduct, and Editorial Principles.',
  },
  {
    question: 'What are your data sources?',
    answer: (
      <>
        The Palestinian Ministry of Health (MoH) is our primary source of truth. They periodically release updated lists of identified individuals killed in Gaza. We maintain a complete archive of all MoH data releases in our {' '}
        <a
          href="https://github.com/Gaza-Deaths/gazadeaths/tree/main/data_sources"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          GitHub repository 
        </a>
        {' '}ensuring full transparency and allowing anyone to verify our data against the original source materials.
      </>
    ),
  },
  {
    question: 'Who owns the data and how can it be used?',
    answer: 'All of the data will bis licensed and available to the public as easy downloadable files. The data and the technology platform is covered by open source and open data licensing.',
  },
  {
    question: 'How is this project funded?',
    answer: 'Already confirmed funding is sufficient to enable this project to reach its first milestone. From that point onwards it will require fundraising for its ongoing expenses (primarily technology infrastructure).',
  },
  {
    question: 'What is your relationship to Iraq Body Count?',
    answer: 'Iraq Body Count has been doing the highly important work of documenting, and quantifying, human suffering from war since 2002. They have written extensively about their process on their substack and x accounts.',
  },
  {
    question: 'What is your relationship to Tech4Palestine?',
    answer: 'Tech4Palestine is a movement and a community. They are doing fantastic work in the technology sector and we are proud to be part of their ecosystem. They have their own tracking of the MoH data releases which we have made use of.',
  },
  {
    question: 'What is your relationship to the Gaza Ministry of Health?',
    answer: 'Understandably, the Gaza MoH is very stretched currently and is providing their updates on deaths in their Telegram channel through PDFs. Today we have no partnership or open channel with them.',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background pt-8 pb-24">
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="space-y-12">
          {/* Mission Statement */}
          <div className="space-y-6 mt-6">
  
            <div className="prose prose-lg max-w-none space-y-4 text-muted-foreground">
              <p>
                Gaza Death Toll aims to memorialise those dead and missing in Gaza since Oct. 7. 
                It uses the official MoH reports as a foundation and enables the wider Palestinian 
                community to add information/corrections.
              </p>
              
              <p>
                The underlying purpose is to establish a canonical document of the human costs in Gaza, 
                that can serve as the foundation for international justice, historical accountability, 
                and collective memory. Similar resources and documents exist for other historical genocides.
              </p>
              
              <p>
                Today the Gaza Ministry of Health PDF updates confirmed deaths every 2-3 months through 
                Telegram as PDF files (which contain only name, gender, date of birth). These are made 
                available without much alteration by IraqBodyCount and Tech4Palestine.
              </p>
              
              <p className="font-semibold text-foreground">
                We believe more can be done. Remembering is both an ethical and political act.
              </p>
            </div>
          </div>

          {/* Advisory Team Section */}
          <div className="text-center border-t pt-12">
            <h2 className="text-3xl font-bold">Advisory Team</h2>
            <p className="text-muted-foreground mt-4 text-lg">
              A diverse team committed to preserving the memory of every life lost
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
            <h2 className="mb-8 text-center text-3xl font-bold">Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="w-full">
              {faqItems.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left text-lg font-medium">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {typeof item.answer === 'string' ? <p>{item.answer}</p> : item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          <div className="text-center text-sm text-muted-foreground pt-8 border-t">
            <p>We will not forget them.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
