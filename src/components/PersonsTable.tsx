'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';

interface Person {
  id: string;
  externalId: string;
  name: string;
  gender: string;
  dateOfBirth: string;
  dateOfDeath?: string;
  locationOfDeathLat?: number | null;
  locationOfDeathLng?: number | null;
  photoUrl?: string | null;
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
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchPersons = async (page: number = 1) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/persons?page=${page}&limit=10`);
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
    }
  };

  useEffect(() => {
    fetchPersons();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
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

  if (!data || data.persons.length === 0) {
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
              {data.persons.map((person) => (
                <TableRow key={person.id}>
                  <TableCell className="font-medium">{person.externalId}</TableCell>
                  <TableCell>{person.name}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        person.gender === 'MALE' ? 'default' :
                        person.gender === 'FEMALE' ? 'secondary' :
                        'outline'
                      }
                    >
                      {person.gender}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(person.dateOfBirth)}</TableCell>
                  <TableCell>
                    {person.dateOfDeath ? (
                      <span className="text-destructive">{formatDate(person.dateOfDeath)}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {person.locationOfDeathLat && person.locationOfDeathLng ? (
                      <span className="text-sm">
                        {person.locationOfDeathLat.toFixed(4)}, {person.locationOfDeathLng.toFixed(4)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {person.photoUrl ? (
                      <a 
                        href={person.photoUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <Image 
                          src={person.photoUrl} 
                          alt={`Photo of ${person.name}`}
                          width={48}
                          height={48}
                          className="w-12 h-12 object-cover rounded border-2 hover:border-primary transition-colors cursor-pointer"
                          unoptimized
                        />
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      v{person.currentVersion}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={person.isDeleted ? 'destructive' : 'default'}>
                      {person.isDeleted ? 'Yes' : 'No'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDateTime(person.updatedAt)}
                  </TableCell>
                </TableRow>
              ))}
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
                onClick={() => fetchPersons(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchPersons(currentPage + 1)}
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
