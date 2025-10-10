'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Calendar, MapPin, Clock, Database, Edit } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Dynamically import LocationPicker to avoid SSR issues with Leaflet
const LocationPicker = dynamic(() => import('@/components/LocationPicker'), {
  ssr: false,
  loading: () => <div className="h-96 w-full bg-muted rounded-md flex items-center justify-center">
    <p className="text-muted-foreground">Loading map...</p>
  </div>
});

interface PersonVersion {
  id: string;
  versionNumber: number;
  changeType: string;
  externalId: string;
  name: string;
  nameEnglish: string | null;
  gender: string;
  dateOfBirth: string | null;
  dateOfDeath: string | null;
  locationOfDeathLat: number | null;
  locationOfDeathLng: number | null;
  photoUrlThumb: string | null;
  photoUrlOriginal: string | null;
  isDeleted: boolean;
  createdAt: string;
  source: {
    id: string;
    type: string;
    description: string;
    bulkUpload: {
      id: string;
      filename: string;
      comment: string | null;
      dateReleased: string;
    } | null;
    communitySubmission: {
      id: string;
      submittedBy: string;
      reason: string | null;
    } | null;
  };
}

interface Person {
  id: string;
  externalId: string;
  name: string;
  nameEnglish: string | null;
  gender: string;
  dateOfBirth: string | null;
  dateOfDeath: string | null;
  locationOfDeathLat: number | null;
  locationOfDeathLng: number | null;
  photoUrlThumb: string | null;
  photoUrlOriginal: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  versions: PersonVersion[];
}

export default function PersonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const externalId = params.externalId as string;

  const [person, setPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPerson = async () => {
      try {
        const response = await fetch(`/api/public/person/${externalId}?includeHistory=true`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Failed to fetch person');
          return;
        }

        setPerson(data.person);
      } catch (err) {
        setError('An error occurred while fetching person details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPerson();
  }, [externalId]);

  const formatDate = (date: string | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getChangeTypeBadge = (changeType: string) => {
    switch (changeType) {
      case 'INSERT':
        return <Badge variant="default">Insert</Badge>;
      case 'UPDATE':
        return <Badge variant="secondary">Update</Badge>;
      case 'DELETE':
        return <Badge variant="destructive">Delete</Badge>;
      default:
        return <Badge variant="outline">{changeType}</Badge>;
    }
  };

  const getSourceBadge = (source: PersonVersion['source']) => {
    if (source.type === 'BULK_UPLOAD') {
      return <Badge variant="default">MoH Bulk Upload</Badge>;
    } else if (source.type === 'COMMUNITY_SUBMISSION') {
      return <Badge variant="secondary">Community Submission</Badge>;
    }
    return <Badge variant="outline">{source.type}</Badge>;
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-screen">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  if (error || !person) {
    return (
      <div className="container mx-auto py-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Alert variant="destructive">
          <AlertDescription>
            {error || 'Person not found'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Database
          </Button>
          <Button variant="default" asChild>
            <Link href={`/contribution/edit/${externalId}`}>
              <Edit className="w-4 h-4 mr-2" />
              Contribute information
            </Link>
          </Button>
        </div>
        <div className="flex gap-2">
          {person.isDeleted && (
            <Badge variant="destructive">Deleted</Badge>
          )}
        </div>
      </div>

      {/* Main Person Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-3xl">{person.name}</CardTitle>
              {person.nameEnglish && (
                <CardDescription className="text-lg mt-1">
                  {person.nameEnglish}
                </CardDescription>
              )}
            </div>
            {person.photoUrlThumb && (
              <a
                href={person.photoUrlOriginal || person.photoUrlThumb}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  src={person.photoUrlThumb}
                  alt={`Photo of ${person.name}`}
                  width={120}
                  height={120}
                  className="w-30 h-30 object-cover rounded-lg border-2 hover:border-primary transition-colors cursor-pointer"
                  unoptimized
                />
              </a>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* External ID */}
            <div className="flex items-start gap-3">
              <Database className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">External ID</p>
                <p className="text-lg font-mono">{person.externalId}</p>
              </div>
            </div>

            {/* Gender */}
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Gender</p>
                <Badge
                  variant={
                    person.gender === 'MALE' ? 'default' :
                    person.gender === 'FEMALE' ? 'secondary' :
                    'outline'
                  }
                  className="mt-1"
                >
                  {person.gender}
                </Badge>
              </div>
            </div>

            {/* Date of Birth */}
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
                <p className="text-lg">{formatDate(person.dateOfBirth)}</p>
              </div>
            </div>

            {/* Date of Death */}
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-destructive mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Date of Death</p>
                <p className="text-lg text-destructive">
                  {formatDate(person.dateOfDeath)}
                </p>
              </div>
            </div>

            {/* Location */}
            {person.locationOfDeathLat && person.locationOfDeathLng && (
              <div className="md:col-span-2">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                  <p className="text-sm font-medium text-muted-foreground">Location of Death</p>
                </div>
                <LocationPicker
                  initialLat={person.locationOfDeathLat}
                  initialLng={person.locationOfDeathLng}
                  readOnly={true}
                />
              </div>
            )}

            {/* Timestamps */}
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created</p>
                <p className="text-sm">{formatDateTime(person.createdAt)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                <p className="text-sm">{formatDateTime(person.updatedAt)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Version History */}
      <Card>
        <CardHeader>
          <CardTitle>Version History</CardTitle>
          <CardDescription>
            Complete history of changes to this record ({person.versions.length} version{person.versions.length !== 1 ? 's' : ''})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Version</TableHead>
                  <TableHead>Change Type</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Deleted</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Date of Death</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {person.versions.map((version) => (
                  <TableRow key={version.id}>
                    <TableCell className="font-medium">
                      v{version.versionNumber}
                    </TableCell>
                    <TableCell>
                      {getChangeTypeBadge(version.changeType)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {getSourceBadge(version.source)}
                        <p className="text-xs text-muted-foreground">
                          {version.source.description}
                        </p>
                        {version.source.bulkUpload && (
                          <p className="text-xs text-muted-foreground">
                            {version.source.bulkUpload.comment} ({formatDate(version.source.bulkUpload.dateReleased)})
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={version.isDeleted ? 'destructive' : 'outline'}>
                        {version.isDeleted ? 'Yes' : 'No'}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {version.name}
                      {version.nameEnglish && (
                        <span className="text-muted-foreground text-sm block">
                          {version.nameEnglish}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {version.dateOfDeath ? (
                        <span className="text-destructive">
                          {formatDate(version.dateOfDeath)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDateTime(version.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

