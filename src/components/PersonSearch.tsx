'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Search, ArrowRight } from 'lucide-react';
import { useTranslation, useFormatDate } from '@/lib/i18n-context';

interface Person {
  externalId: string;
  name: string;
  nameEnglish: string | null;
  dateOfBirth: string | null;
  dateOfDeath: string | null;
}

interface PersonSearchProps {
  variant?: 'default' | 'header';
}

export function PersonSearch({ variant = 'default' }: PersonSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const { t, locale } = useTranslation();
  const { formatDate } = useFormatDate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchPersons = async () => {
      if (query.trim().length < 2) {
        setResults([]);
        setShowResults(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/public/persons?search=${encodeURIComponent(query)}&limit=10`
        );
        const data = await response.json();
        
        if (data.success) {
          setResults(data.data.persons);
          setShowResults(true);
        }
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchPersons, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleSelectPerson = (externalId: string) => {
    setShowResults(false);
    setQuery('');
    router.push(`/${locale}/person/${externalId}`);
  };

  const isHeaderVariant = variant === 'header';

  return (
    <div className={`relative ${isHeaderVariant ? 'w-auto' : 'w-full'}`} ref={searchRef}>
      <div className="relative flex items-center">
        <div className="absolute left-3 z-10">
          <Search className={`h-5 w-5 ${isHeaderVariant ? 'text-gray-400' : 'text-muted-foreground'}`} />
        </div>
        
        <Input
          type="text"
          placeholder={t('search.placeholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setShowResults(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && results.length > 0) {
              handleSelectPerson(results[0].externalId);
            }
          }}
          className={
            isHeaderVariant
              ? "w-auto min-w-[300px] h-10 pl-10 pr-4 text-lg text-white bg-black border-0 rounded-md shadow-none focus:ring-0 focus:outline-none placeholder:text-gray-500"
              : "w-full h-14 pl-10 pr-14 text-xl text-black bg-white border-2 border-white/10 rounded-md shadow-lg focus:border-accent-foreground transition-colors placeholder:text-base placeholder:text-gray-500"
          }
        />
        
        <div className="absolute right-2">
          {isLoading ? (
            <div className="h-8 w-8 flex items-center justify-center">
              <Spinner className="h-4 w-4 text-muted-foreground" />
            </div>
          ) : (
            <Button
              onClick={() => {
                if (results.length > 0) {
                  handleSelectPerson(results[0].externalId);
                }
              }}
              disabled={results.length === 0 || query.trim().length < 2}
              className={
                isHeaderVariant
                  ? "h-6 w-6 p-0 mr-2 bg-black hover:bg-black/80 rounded-full shadow-lg transition-colors disabled:opacity-100 disabled:bg-black disabled:cursor-not-allowed"
                  : "h-6 w-6 p-0 mr-2 bg-accent-foreground hover:bg-accent-foreground/80 rounded-full shadow-lg transition-colors disabled:opacity-100 disabled:bg-accent-foreground disabled:cursor-not-allowed"
              }
            >
              <ArrowRight className={`h-3 w-3 ${isHeaderVariant ? 'text-accent-foreground' : 'text-white'}`} />
            </Button>
          )}
        </div>
      </div>

      {showResults && results.length > 0 && (
        <Card className="absolute z-50 w-full mt-2 max-h-96 overflow-y-auto">
          <div className="divide-y">
            {results.map((person) => (
              <button
                key={person.externalId}
                onClick={() => handleSelectPerson(person.externalId)}
                className="w-full text-left px-4 py-3 hover:bg-muted transition-colors"
              >
                {locale === 'ar' ? (
                  <>
                    <div className="font-large text-xl">{person.name}</div>
                    {person.nameEnglish && (
                      <div className="text-md text-muted-foreground">{person.nameEnglish}</div>
                    )}
                  </>
                ) : (
                  <>
                    {person.nameEnglish && (
                      <div className="font-large text-xl">{person.nameEnglish}</div>
                    )}
                    <div className={`text-xl ${person.nameEnglish ? 'text-muted-foreground' : ''}`}>
                      {person.name}
                    </div>
                  </>
                )}
                <div className="text-sm text-muted-foreground mt-1 flex items-center gap-3 force-ltr">
                  <span>ID: {person.externalId}</span>
                  {person.dateOfBirth && (
                    <span>Born: {formatDate(person.dateOfBirth)}</span>
                  )}
                  {person.dateOfDeath && (
                    <span>Died: {formatDate(person.dateOfDeath)}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {showResults && query.trim().length >= 2 && results.length === 0 && !isLoading && (
        <Card className="absolute z-50 w-full mt-2">
          <div className="px-4 py-3 text-sm text-muted-foreground text-center">
            {t('search.noResults')}
          </div>
        </Card>
      )}
    </div>
  );
}

