'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface Person {
  id: string;
  externalId: string;
  name: string;
  gender: string;
  dateOfBirth: string;
  dateOfDeath?: string;
  locationOfDeathLat?: number | null;
  locationOfDeathLng?: number | null;
  photoUrlThumb?: string | null;
  isDeleted: boolean;
  currentVersion: number;
  createdAt: string;
  updatedAt: string;
}

interface PersonsData {
  persons: Person[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export function PersonsTable() {
  const [data, setData] = useState<PersonsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset to page 1 when search changes
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchPersons = useCallback(async (page: number = 1, search: string = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      
      if (search.trim()) {
        params.append('search', search.trim());
      }
      
      const response = await fetch(`/api/moderator/persons?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch persons');
      }

      setData(result.data);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchPersons(1, '');
  }, [fetchPersons]);

  // Fetch when debounced search changes
  useEffect(() => {
    fetchPersons(1, debouncedSearch);
  }, [debouncedSearch, fetchPersons]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (initialLoad && loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Database Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Database Records</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Database Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No records found. Upload some data to get started.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Database Records</CardTitle>
          <CardDescription>
            Total: {data.pagination.total} records
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search Input */}
        <div className="mb-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search by name, external ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {searchQuery && (
            <p className="text-sm text-muted-foreground mt-2">
              {loading ? 'Searching...' : `Found ${data?.pagination.total || 0} result${data?.pagination.total === 1 ? '' : 's'}`}
            </p>
          )}
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>External ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Date of Birth</TableHead>
                <TableHead>Date of Death</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Photo</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Deleted</TableHead>
                <TableHead>Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-32 text-center">
                    <Spinner className="mx-auto" />
                  </TableCell>
                </TableRow>
              ) : data.persons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-32 text-center text-muted-foreground">
                    No records found {searchQuery ? 'matching your search' : ''}.
                  </TableCell>
                </TableRow>
              ) : (
                data.persons.map((person) => (
                <TableRow key={person.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium">
                    <Link href={`/person/${person.externalId}`} className="block">
                      {person.externalId}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/person/${person.externalId}`} className="block">
                      {person.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/person/${person.externalId}`} className="block">
                      <Badge 
                        variant={
                          person.gender === 'MALE' ? 'default' :
                          person.gender === 'FEMALE' ? 'secondary' :
                          'outline'
                        }
                      >
                        {person.gender}
                      </Badge>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/person/${person.externalId}`} className="block">
                      {formatDate(person.dateOfBirth)}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/person/${person.externalId}`} className="block">
                      {person.dateOfDeath ? (
                        <span className="text-destructive">{formatDate(person.dateOfDeath)}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/person/${person.externalId}`} className="block">
                      {person.locationOfDeathLat && person.locationOfDeathLng ? (
                        <span className="text-sm">
                          {person.locationOfDeathLat.toFixed(4)}, {person.locationOfDeathLng.toFixed(4)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </Link>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {person.photoUrlThumb ? (
                      <a 
                        href={person.photoUrlThumb} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <Image 
                          src={person.photoUrlThumb} 
                          alt={`Photo of ${person.name}`}
                          width={48}
                          height={48}
                          className="w-12 h-12 object-cover rounded border-2 hover:border-primary transition-colors cursor-pointer"
                          unoptimized
                        />
                      </a>
                    ) : (
                      <Link href={`/person/${person.externalId}`} className="block">
                        <span className="text-muted-foreground">—</span>
                      </Link>
                    )}
                  </TableCell>
                  <TableCell>
                    <Link href={`/person/${person.externalId}`} className="block">
                      <Badge variant="secondary">
                        v{person.currentVersion}
                      </Badge>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/person/${person.externalId}`} className="block">
                      <Badge variant={person.isDeleted ? 'destructive' : 'default'}>
                        {person.isDeleted ? 'Yes' : 'No'}
                      </Badge>
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <Link href={`/person/${person.externalId}`} className="block">
                      {formatDateTime(person.updatedAt)}
                    </Link>
                  </TableCell>
                </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {data.pagination.pages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-muted-foreground">
              Showing page {data.pagination.page} of {data.pagination.pages}
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchPersons(currentPage - 1, debouncedSearch)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchPersons(currentPage + 1, debouncedSearch)}
                disabled={currentPage === data.pagination.pages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
