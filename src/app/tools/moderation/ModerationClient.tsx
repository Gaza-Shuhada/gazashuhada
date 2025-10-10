'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface Person {
  id: string;
  externalId: string;
  name: string;
  gender: string;
  dateOfBirth: string;
  dateOfDeath: string | null;
  locationOfDeathLat: number | null;
  locationOfDeathLng: number | null;
}

interface BaseVersion {
  versionNumber: number;
  dateOfDeath: string | null;
  locationOfDeathLat: number | null;
  locationOfDeathLng: number | null;
}

interface Submission {
  id: string;
  type: 'EDIT';
  status: string;
  proposedPayload: Record<string, string | number | boolean | null>;
  reason: string | null;
  submittedBy: string;
  createdAt: string;
  person: Person | null;
  baseVersion: BaseVersion | null;
}

export default function ModerationClient() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [modalState, setModalState] = useState<{
    type: 'approve' | 'reject';
    submission: Submission | null;
    note: string;
  } | null>(null);

  useEffect(() => {
    void fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/moderator/moderation/list');
      if (response.ok) {
        const text = await response.text();
        if (!text) return;
        const data = JSON.parse(text);
        setSubmissions(data.submissions);
      } else {
        toast.error('Failed to load submissions');
      }
    } catch {
      toast.error('Error loading submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!modalState || modalState.type !== 'approve' || !modalState.submission) return;

    try {
      setActionLoading(modalState.submission.id);
      const response = await fetch(`/api/moderator/moderation/${modalState.submission.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: modalState.note || undefined }),
      });

      const text = await response.text();
      const data = text ? JSON.parse(text) : {};

      if (response.ok) {
        toast.success(data.message || 'Submission approved successfully');
        setModalState(null);
        fetchSubmissions().catch(err => console.error('Failed to refresh submissions:', err));
      } else {
        toast.error(data.error || 'Failed to approve submission');
      }
    } catch {
      toast.error('Error approving submission');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!modalState || modalState.type !== 'reject' || !modalState.submission) return;

    if (!modalState.note.trim()) {
      toast.error('Rejection note is required');
      return;
    }

    try {
      setActionLoading(modalState.submission.id);
      const response = await fetch(`/api/moderator/moderation/${modalState.submission.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: modalState.note }),
      });

      const text = await response.text();
      const data = text ? JSON.parse(text) : {};

      if (response.ok) {
        toast.success(data.message || 'Submission rejected successfully');
        setModalState(null);
        fetchSubmissions().catch(err => console.error('Failed to refresh submissions:', err));
      } else {
        toast.error(data.error || 'Failed to reject submission');
      }
    } catch {
      toast.error('Error rejecting submission');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Pending Moderation</h1>
          <p className="text-muted-foreground mt-2">Review and approve community edit proposals</p>
        </div>
        <Button
          onClick={fetchSubmissions}
          disabled={loading}
          variant="default"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {loading ? (
        <div className="bg-card rounded-lg border p-8 text-center">
          <div className="text-muted-foreground">Loading submissions...</div>
        </div>
      ) : submissions.length === 0 ? (
        <div className="bg-card rounded-lg border p-12 text-center">
          <div className="text-muted-foreground">
            <p className="text-lg font-medium mb-2">No pending submissions</p>
            <p className="text-sm">All submissions have been reviewed!</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {submissions.map((submission) => (
            <div key={submission.id} className="bg-card rounded-lg border overflow-hidden">
              <div className="bg-muted/50 px-6 py-4 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="px-3 py-1 text-sm font-medium rounded-full bg-primary/10 text-primary">
                      Edit Proposal
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Submitted {new Date(submission.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Proposed Edit to Existing Record</h3>

                  {submission.person && (
                    <div className="mb-4 p-4 bg-muted/50 rounded-lg border">
                      <p className="text-sm font-medium text-muted-foreground mb-2">Current Record:</p>
                      <p className="text-foreground font-semibold">
                        {submission.person.name} ({submission.person.externalId})
                      </p>
                    </div>
                  )}

                  <div className="space-y-3">
                    <p className="text-sm font-medium text-foreground">Proposed Changes:</p>

                    {Object.entries(submission.proposedPayload).map(([key, value]) => {
                      if (key === 'photoUrlThumb' && value) {
                        return (
                          <div key={key} className="text-sm">
                            <span className="font-medium text-muted-foreground mb-2 block">New Photo (Thumbnail):</span>
                            <a
                              href={String(value)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block"
                            >
                              <Image
                                src={String(value)}
                                alt="Proposed photo"
                                width={128}
                                height={128}
                                className="w-32 h-32 object-cover rounded-lg border-2 border hover:border-primary transition-colors cursor-pointer"
                                unoptimized
                              />
                            </a>
                          </div>
                        );
                      }
                      if (key === 'photoUrlOriginal' && value) {
                        return (
                          <div key={key} className="text-sm">
                            <span className="font-medium text-muted-foreground min-w-[150px] block">Photo Url Original:</span>
                            <a
                              href={String(value)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary underline break-all"
                            >
                              {String(value)}
                            </a>
                          </div>
                        );
                      }

                      const currentValue = submission.person ? submission.person[key as keyof Person] : null;
                      const displayValue = value && typeof value === 'string' && key.includes('Date')
                        ? new Date(value).toLocaleDateString()
                        : String(value || 'N/A');
                      const displayCurrent = currentValue && typeof currentValue === 'string' && key.includes('Date')
                        ? new Date(currentValue).toLocaleDateString()
                        : String(currentValue || 'N/A');

                      return (
                        <div key={key} className="flex items-center space-x-2 text-sm">
                          <span className="font-medium text-muted-foreground min-w-[150px]">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                          </span>
                          <span className="text-destructive line-through">{displayCurrent}</span>
                          <span className="text-muted-foreground">→</span>
                          <span className="text-accent-foreground font-medium">{displayValue}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {submission.reason && (
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg border">
                    <p className="text-sm font-medium text-foreground mb-1">Submitter&apos;s Note:</p>
                    <p className="text-sm text-primary">{submission.reason}</p>
                  </div>
                )}
              </div>

              <div className="bg-muted/50 px-6 py-4 border-t flex justify-end space-x-3">
                <Button
                  onClick={() => setModalState({ type: 'reject', submission, note: '' })}
                  disabled={actionLoading === submission.id}
                  variant="destructive"
                >
                  Reject
                </Button>
                <Button
                  onClick={() => setModalState({ type: 'approve', submission, note: '' })}
                  disabled={actionLoading === submission.id}
                >
                  {actionLoading === submission.id ? 'Processing...' : 'Approve'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalState && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border max-w-lg w-full p-6">
            <h3 className="text-lg font-bold text-foreground mb-4">
              {modalState.type === 'approve' ? 'Approve Submission' : 'Reject Submission'}
            </h3>
            
            <p className="text-sm text-muted-foreground mb-4">
              {modalState.type === 'approve'
                ? 'Are you sure you want to approve this edit? This will update the existing record.'
                : 'Are you sure you want to reject this submission? Please provide a reason for the submitter.'}
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-1">
                Note {modalState.type === 'reject' ? '(Required)' : '(Optional)'}
              </label>
              <textarea
                rows={3}
                value={modalState.note}
                onChange={(e) => setModalState({ ...modalState, note: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
                placeholder={modalState.type === 'approve' ? 'Optional note for audit log...' : 'Explain why this was rejected...'}
              />
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                onClick={() => setModalState(null)}
                variant="secondary"
              >
                Cancel
              </Button>
              <Button
                onClick={modalState.type === 'approve' ? handleApprove : handleReject}
                disabled={actionLoading !== null}
                variant={modalState.type === 'approve' ? 'default' : 'destructive'}
              >
                {actionLoading ? 'Processing...' : modalState.type === 'approve' ? 'Approve' : 'Reject'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
