'use client';

import { useEffect, useState } from 'react';

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

export default function ModerationPage() {
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
    fetchSubmissions();
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
        fetchSubmissions();
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
        fetchSubmissions();
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
      <div className="min-h-screen bg-gray-50 pt-8 pb-8 px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Pending Moderation</h1>
          <div className="text-center py-12">
            <div className="text-gray-600">Loading submissions...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 pt-8 pb-8 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Pending Moderation</h1>
            <button
              onClick={fetchSubmissions}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Refresh
            </button>
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {message.text}
            </div>
          )}

          {submissions.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="text-gray-500">
                <p className="text-lg font-medium mb-2">No pending submissions</p>
                <p className="text-sm">All submissions have been reviewed!</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {submissions.map((submission) => (
                <div key={submission.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                  {/* Header */}
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                          submission.type === 'NEW_RECORD' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {submission.type === 'NEW_RECORD' ? 'New Record Proposal' : 'Edit Proposal'}
                        </span>
                        <span className="text-sm text-gray-500">
                          Submitted {new Date(submission.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="px-6 py-4">
                    {submission.type === 'NEW_RECORD' ? (
                      // NEW RECORD DISPLAY
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Proposed New Person Record</h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <span className="text-sm font-medium text-gray-500">External ID:</span>
                            <p className="text-gray-900 font-medium">{String(submission.proposedPayload.externalId)}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500">Name:</span>
                            <p className="text-gray-900 font-medium">{String(submission.proposedPayload.name)}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500">Gender:</span>
                            <p className="text-gray-900">{String(submission.proposedPayload.gender)}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500">Date of Birth:</span>
                            <p className="text-gray-900">{submission.proposedPayload.dateOfBirth ? new Date(String(submission.proposedPayload.dateOfBirth)).toLocaleDateString() : 'N/A'}</p>
                          </div>
                          {submission.proposedPayload.dateOfDeath && (
                            <div>
                              <span className="text-sm font-medium text-gray-500">Date of Death:</span>
                              <p className="text-gray-900">{new Date(String(submission.proposedPayload.dateOfDeath)).toLocaleDateString()}</p>
                            </div>
                          )}
                          {(submission.proposedPayload.locationOfDeathLat && submission.proposedPayload.locationOfDeathLng) && (
                            <div>
                              <span className="text-sm font-medium text-gray-500">Location of Death (Lat, Lng):</span>
                              <p className="text-gray-900">{Number(submission.proposedPayload.locationOfDeathLat).toFixed(4)}, {Number(submission.proposedPayload.locationOfDeathLng).toFixed(4)}</p>
                            </div>
                          )}
                        </div>
                        {submission.proposedPayload.obituary && (
                          <div className="mb-4">
                            <span className="text-sm font-medium text-gray-500">Obituary:</span>
                            <p className="text-gray-900 mt-1">{String(submission.proposedPayload.obituary)}</p>
                          </div>
                        )}
                        {submission.proposedPayload.photoUrl && (
                          <div className="mb-4">
                            <span className="text-sm font-medium text-gray-500">Photo:</span>
                            <a 
                              href={String(submission.proposedPayload.photoUrl)} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="block mt-2"
                            >
                              <img 
                                src={String(submission.proposedPayload.photoUrl)} 
                                alt="Submitted photo" 
                                className="w-32 h-32 object-cover rounded-lg border-2 border-gray-300 hover:border-blue-500 transition-colors cursor-pointer"
                              />
                            </a>
                          </div>
                        )}
                      </div>
                    ) : (
                      // EDIT DISPLAY
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Proposed Edit to Existing Record</h3>
                        
                        {/* Current Record Info */}
                        {submission.person && (
                          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm font-medium text-gray-500 mb-2">Current Record:</p>
                            <p className="text-gray-900 font-semibold">
                              {submission.person.name} ({submission.person.externalId})
                            </p>
                            <p className="text-sm text-gray-600">
                              {submission.person.confirmedByMoh ? '✓ MoH Confirmed' : '○ Community Submitted'}
                            </p>
                          </div>
                        )}

                        {/* Proposed Changes */}
                        <div className="space-y-3">
                          <p className="text-sm font-medium text-gray-700">Proposed Changes:</p>
                          
                          {Object.entries(submission.proposedPayload).map(([key, value]) => {
                            // Handle photo URL separately
                            if (key === 'photoUrl' && value) {
                              return (
                                <div key={key} className="text-sm">
                                  <span className="font-medium text-gray-600 mb-2 block">New Photo:</span>
                                  <a 
                                    href={String(value)} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="block"
                                  >
                                    <img 
                                      src={String(value)} 
                                      alt="Proposed photo" 
                                      className="w-32 h-32 object-cover rounded-lg border-2 border-gray-300 hover:border-blue-500 transition-colors cursor-pointer"
                                    />
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
                                <span className="font-medium text-gray-600 min-w-[150px]">
                                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                                </span>
                                <span className="text-red-600 line-through">{displayCurrent}</span>
                                <span className="text-gray-400">→</span>
                                <span className="text-green-600 font-medium">{displayValue}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Submitter's Reason */}
                    {submission.reason && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <p className="text-sm font-medium text-blue-900 mb-1">Submitter&apos;s Note:</p>
                        <p className="text-sm text-blue-800">{submission.reason}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                    <button
                      onClick={() => setModalState({ type: 'reject', submission, note: '' })}
                      disabled={actionLoading === submission.id}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => setModalState({ type: 'approve', submission, note: '' })}
                      disabled={actionLoading === submission.id}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      {actionLoading === submission.id ? 'Processing...' : 'Approve'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modalState && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {modalState.type === 'approve' ? 'Approve Submission' : 'Reject Submission'}
            </h3>
            
            <p className="text-sm text-gray-600 mb-4">
              {modalState.type === 'approve' 
                ? 'Are you sure you want to approve this submission? This will create a new record or update an existing one.'
                : 'Are you sure you want to reject this submission? Please provide a reason for the submitter.'}
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Note {modalState.type === 'reject' ? '(Required)' : '(Optional)'}
              </label>
              <textarea
                rows={3}
                value={modalState.note}
                onChange={(e) => setModalState({ ...modalState, note: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                placeholder={modalState.type === 'approve' ? 'Optional note for audit log...' : 'Explain why this was rejected...'}
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setModalState(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={modalState.type === 'approve' ? handleApprove : handleReject}
                disabled={actionLoading !== null}
                className={`px-4 py-2 text-white rounded-lg transition-colors ${
                  modalState.type === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                } disabled:bg-gray-400 disabled:cursor-not-allowed`}
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
