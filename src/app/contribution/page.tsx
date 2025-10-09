'use client';

import { useUser } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface Contribution {
  id: string;
  type: 'EDIT';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUPERSEDED';
  createdAt: string;
  proposedPayload: Record<string, string | number | boolean | null>;
  reason?: string;
  decisionNote?: string;
  approvedAt?: string;
  personId?: string;
}

export default function CommunityContributePage() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  
  const [contributions, setContributions] = useState<Contribution[]>([]);

  // Load user's contribution history
  useEffect(() => {
    if (isSignedIn) {
      fetchContributions();
    }
  }, [isSignedIn]);

  const fetchContributions = async () => {
    try {
      const response = await fetch('/api/community/my-submissions');
      if (response.ok) {
        const text = await response.text();
        if (text) {
          const data = JSON.parse(text);
          setContributions(data.submissions);
        }
      }
    } catch (error) {
      console.error('Failed to fetch contributions:', error);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-8 pb-8 px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Contribution History</h1>
          <p className="text-muted-foreground mt-2">View the status of your edit proposals</p>
        </div>

        {!isSignedIn && (
          <div className="bg-card border rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-2">Sign in to view contributions</h2>
            <p className="text-muted-foreground mb-4">
              You need to sign in to view your contribution history.
            </p>
            <div className="flex gap-3">
              <Button onClick={() => router.push('/sign-in')}>
                Sign In
              </Button>
              <Button onClick={() => router.push('/sign-up')} variant="outline">
                Sign Up
              </Button>
            </div>
          </div>
        )}

        {isSignedIn && (
          <div className="bg-card border rounded-lg p-6">
            <div>
              {contributions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>You haven&apos;t made any contributions yet.</p>
                  <p className="text-sm mt-2">Find a record in the database and click &quot;Contribute&quot; to suggest edits.</p>
                </div>
              ) : (
                  <div className="space-y-4">
                    {contributions.map((contribution) => (
                      <div key={contribution.id} className="border rounded-lg p-4 bg-card">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <span className="px-2 py-1 text-xs font-medium rounded bg-primary/10 text-primary">
                              Edit
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded ${
                              contribution.status === 'PENDING' ? 'bg-secondary/50 text-secondary-foreground' :
                              contribution.status === 'APPROVED' ? 'bg-accent text-accent-foreground' :
                              contribution.status === 'REJECTED' ? 'bg-destructive/10 text-destructive' :
                              'bg-accent text-accent-foreground'
                            }`}>
                              {contribution.status}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(contribution.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="text-sm text-foreground mb-2">
                          <p className="font-medium">Edit to record: {contribution.personId || 'N/A'}</p>
                          <p className="text-muted-foreground">
                            Fields: {Object.keys(contribution.proposedPayload).join(', ')}
                          </p>
                        </div>

                        {contribution.reason && (
                          <p className="text-sm text-muted-foreground mb-2">
                            <span className="font-medium">Your note:</span> {contribution.reason}
                          </p>
                        )}

                        {contribution.status === 'APPROVED' && contribution.approvedAt && (
                          <p className="text-sm text-accent-foreground">
                            ✓ Approved on {new Date(contribution.approvedAt).toLocaleDateString()}
                          </p>
                        )}

                        {contribution.status === 'REJECTED' && contribution.decisionNote && (
                          <p className="text-sm text-destructive">
                            <span className="font-medium">Moderator note:</span> {contribution.decisionNote}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
