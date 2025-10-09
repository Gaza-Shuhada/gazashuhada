'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';

interface Person {
  externalId: string;
  name: string;
  nameEnglish: string | null;
  dateOfBirth: string | null;
  dateOfDeath: string | null;
}

export function PersonSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);

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
          `/api/public/persons?search=${encodeURIComponent(query)}&limit=10&confirmedOnly=false`
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
    router.push(`/person/${externalId}`);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="relative w-full" ref={searchRef}>
      <div className="relative">
        <Input
          type="text"
          placeholder="Search by name or ID"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setShowResults(true);
          }}
          className="w-full h-12 text-base pr-10"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Spinner className="h-5 w-5" />
          </div>
        )}
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
                <div className="font-medium">{person.name}</div>
                {person.nameEnglish && (
                  <div className="text-sm text-muted-foreground">{person.nameEnglish}</div>
                )}
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
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
            No results found
          </div>
        </Card>
      )}
    </div>
  );
}

