'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface Person {
  id: string;
  externalId: string;
  name: string;
  gender: string;
  dateOfBirth: string;
  dateOfDeath: string | null;
  locationOfDeathLat: number | null;
  locationOfDeathLng: number | null;
  obituary: string | null;
  confirmedByMoh: boolean;
}

interface BaseVersion {
  versionNumber: number;
  dateOfDeath: string | null;
  locationOfDeathLat: number | null;
  locationOfDeathLng: number | null;
  obituary: string | null;
}

interface Submission {
  id: string;
  type: 'NEW_RECORD' | 'EDIT';
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
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
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
      const response = await fetch('/api/admin/moderation/list');
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data.submissions);
      } else {
        setMessage({ type: 'error', text: 'Failed to load submissions' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Error loading submissions' });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!modalState || modalState.type !== 'approve' || !modalState.submission) return;

    try {
      setActionLoading(modalState.submission.id);
      const response = await fetch(`/api/admin/moderation/${modalState.submission.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: modalState.note || undefined }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message });
        setModalState(null);
        void fetchSubmissions();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to approve submission' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Error approving submission' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!modalState || modalState.type !== 'reject' || !modalState.submission) return;

    if (!modalState.note.trim()) {
      setMessage({ type: 'error', text: 'Rejection note is required' });
      return;
    }

    try {
      setActionLoading(modalState.submission.id);
      const response = await fetch(`/api/admin/moderation/${modalState.submission.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: modalState.note }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message });
        setModalState(null);
        void fetchSubmissions();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to reject submission' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Error rejecting submission' });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground">Loading submissions...</div>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-end items-center mb-8">
        <button
          onClick={fetchSubmissions}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Refresh
        </button>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-accent text-accent-foreground' : 'bg-destructive/5 text-destructive'}`}>
          {message.text}
        </div>
      )}

      {submissions.length === 0 ? (
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
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                      submission.type === 'NEW_RECORD' ? 'bg-accent text-accent-foreground' : 'bg-primary/10 text-primary'
                    }`}>
                      {submission.type === 'NEW_RECORD' ? 'New Record Proposal' : 'Edit Proposal'}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Submitted {new Date(submission.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4">
                {submission.type === 'NEW_RECORD' ? (
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">Proposed New Person Record</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">External ID:</span>
                        <p className="text-foreground font-medium">{String(submission.proposedPayload.externalId)}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Name:</span>
                        <p className="text-foreground font-medium">{String(submission.proposedPayload.name)}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Gender:</span>
                        <p className="text-foreground">{String(submission.proposedPayload.gender)}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Date of Birth:</span>
                        <p className="text-foreground">{submission.proposedPayload.dateOfBirth ? new Date(String(submission.proposedPayload.dateOfBirth)).toLocaleDateString() : 'N/A'}</p>
                      </div>
                      {submission.proposedPayload.dateOfDeath && (
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Date of Death:</span>
                          <p className="text-foreground">{new Date(String(submission.proposedPayload.dateOfDeath)).toLocaleDateString()}</p>
                        </div>
                      )}
                      {(submission.proposedPayload.locationOfDeathLat && submission.proposedPayload.locationOfDeathLng) && (
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Location of Death (Lat, Lng):</span>
                          <p className="text-foreground">{Number(submission.proposedPayload.locationOfDeathLat).toFixed(4)}, {Number(submission.proposedPayload.locationOfDeathLng).toFixed(4)}</p>
                        </div>
                      )}
                    </div>
                    {submission.proposedPayload.obituary && (
                      <div className="mb-4">
                        <span className="text-sm font-medium text-muted-foreground">Obituary:</span>
                        <p className="text-foreground mt-1">{String(submission.proposedPayload.obituary)}</p>
                      </div>
                    )}
                    {submission.proposedPayload.photoUrlThumb && (
                      <div className="mb-4">
                        <span className="text-sm font-medium text-muted-foreground">Photo:</span>
                        <a
                          href={String(submission.proposedPayload.photoUrlThumb)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block mt-2"
                        >
                          <Image
                            src={String(submission.proposedPayload.photoUrlThumb)}
                            alt="Submitted photo"
                            width={128}
                            height={128}
                            className="w-32 h-32 object-cover rounded-lg border-2 border hover:border-primary transition-colors cursor-pointer"
                            unoptimized
                          />
                        </a>
                        {submission.proposedPayload.photoUrlOriginal && (
                          <div className="mt-2 text-sm">
                            <a
                              href={String(submission.proposedPayload.photoUrlOriginal)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary underline"
                            >
                              Open original image in new tab
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">Proposed Edit to Existing Record</h3>

                    {submission.person && (
                      <div className="mb-4 p-4 bg-muted/50 rounded-lg border">
                        <p className="text-sm font-medium text-muted-foreground mb-2">Current Record:</p>
                        <p className="text-foreground font-semibold">
                          {submission.person.name} ({submission.person.externalId})
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {submission.person.confirmedByMoh ? '✓ MoH Confirmed' : '○ Community Submitted'}
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
                )}

                {submission.reason && (
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg border">
                    <p className="text-sm font-medium text-foreground mb-1">Submitter&apos;s Note:</p>
                    <p className="text-sm text-primary">{submission.reason}</p>
                  </div>
                )}
              </div>

              <div className="bg-muted/50 px-6 py-4 border-t flex justify-end space-x-3">
                <button
                  onClick={() => setModalState({ type: 'reject', submission, note: '' })}
                  disabled={actionLoading === submission.id}
                  className="px-4 py-2 bg-destructive text-white rounded-lg hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Reject
                </button>
                <button
                  onClick={() => setModalState({ type: 'approve', submission, note: '' })}
                  disabled={actionLoading === submission.id}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {actionLoading === submission.id ? 'Processing...' : 'Approve'}
                </button>
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
                ? 'Are you sure you want to approve this submission? This will create a new record or update an existing one.'
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
              <button
                onClick={() => setModalState(null)}
                className="px-4 py-2 text-foreground bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={modalState.type === 'approve' ? handleApprove : handleReject}
                disabled={actionLoading !== null}
                className={`px-4 py-2 text-white rounded-lg transition-colors ${
                  modalState.type === 'approve'
                    ? 'bg-primary hover:bg-primary/90'
                    : 'bg-destructive hover:bg-destructive/90'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {actionLoading ? 'Processing...' : modalState.type === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


