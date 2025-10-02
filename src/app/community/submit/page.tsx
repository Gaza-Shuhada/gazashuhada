'use client';

import { useUser } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Submission {
  id: string;
  type: 'NEW_RECORD' | 'EDIT';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUPERSEDED';
  createdAt: string;
  proposedPayload: Record<string, string | number | boolean | null>;
  reason?: string;
  decisionNote?: string;
  approvedAt?: string;
  personId?: string;
}

export default function CommunitySubmitPage() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'new' | 'edit' | 'history'>('new');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states for NEW_RECORD
  const [newRecordForm, setNewRecordForm] = useState({
    externalId: '',
    name: '',
    gender: 'MALE',
    dateOfBirth: '',
    dateOfDeath: '',
    locationOfDeath: '',
    obituary: '',
    reason: '',
  });

  // Form states for EDIT
  const [editForm, setEditForm] = useState({
    externalId: '',
    dateOfDeath: '',
    locationOfDeath: '',
    obituary: '',
    reason: '',
  });

  // Redirect if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in');
    }
    // All roles (admin, moderator, community) can access this page
  }, [isLoaded, isSignedIn, router]);

  // Load user's submission history
  useEffect(() => {
    if (isSignedIn) {
      fetchSubmissions();
    }
  }, [isSignedIn]);

  const fetchSubmissions = async () => {
    try {
      const response = await fetch('/api/community/my-submissions');
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data.submissions);
      }
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
    }
  };

  const handleNewRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const payload = {
        externalId: newRecordForm.externalId,
        name: newRecordForm.name,
        gender: newRecordForm.gender,
        dateOfBirth: newRecordForm.dateOfBirth,
        ...(newRecordForm.dateOfDeath && { dateOfDeath: newRecordForm.dateOfDeath }),
        ...(newRecordForm.locationOfDeath && { locationOfDeath: newRecordForm.locationOfDeath }),
        ...(newRecordForm.obituary && { obituary: newRecordForm.obituary }),
      };

      const response = await fetch('/api/community/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'NEW_RECORD',
          proposedPayload: payload,
          reason: newRecordForm.reason || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'New record submitted successfully! It will be reviewed by moderators.' });
        setNewRecordForm({
          externalId: '',
          name: '',
          gender: 'MALE',
          dateOfBirth: '',
          dateOfDeath: '',
          locationOfDeath: '',
          obituary: '',
          reason: '',
        });
        fetchSubmissions();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to submit record' });
      }
    } catch {
      setMessage({ type: 'error', text: 'An error occurred while submitting' });
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const payload: Record<string, string> = {};
      if (editForm.dateOfDeath) payload.dateOfDeath = editForm.dateOfDeath;
      if (editForm.locationOfDeath) payload.locationOfDeath = editForm.locationOfDeath;
      if (editForm.obituary) payload.obituary = editForm.obituary;

      const response = await fetch('/api/community/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'EDIT',
          externalId: editForm.externalId,
          proposedPayload: payload,
          reason: editForm.reason || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Edit proposal submitted successfully! It will be reviewed by moderators.' });
        setEditForm({
          externalId: '',
          dateOfDeath: '',
          locationOfDeath: '',
          obituary: '',
          reason: '',
        });
        fetchSubmissions();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to submit edit' });
      }
    } catch {
      setMessage({ type: 'error', text: 'An error occurred while submitting' });
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-8 pb-8 px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Community Submissions</h1>
        <p className="text-gray-600 mb-8">Propose new records or suggest edits to existing death-related information</p>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('new')}
                className={`px-6 py-3 font-medium text-sm border-b-2 ${
                  activeTab === 'new'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Propose New Record
              </button>
              <button
                onClick={() => setActiveTab('edit')}
                className={`px-6 py-3 font-medium text-sm border-b-2 ${
                  activeTab === 'edit'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Suggest Edit
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-6 py-3 font-medium text-sm border-b-2 ${
                  activeTab === 'history'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My Submissions ({submissions.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* NEW RECORD FORM */}
            {activeTab === 'new' && (
              <form onSubmit={handleNewRecordSubmit} className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Propose a New Person Record</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    All new records start as unconfirmed. If the Ministry of Health includes this person in a future bulk upload,
                    the record will be marked as officially confirmed.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      External ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newRecordForm.externalId}
                      onChange={(e) => setNewRecordForm({ ...newRecordForm, externalId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      placeholder="e.g., P12345"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newRecordForm.name}
                      onChange={(e) => setNewRecordForm({ ...newRecordForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      placeholder="Full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gender <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={newRecordForm.gender}
                      onChange={(e) => setNewRecordForm({ ...newRecordForm, gender: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={newRecordForm.dateOfBirth}
                      onChange={(e) => setNewRecordForm({ ...newRecordForm, dateOfBirth: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Death <span className="text-gray-500">(Optional)</span>
                    </label>
                    <input
                      type="date"
                      value={newRecordForm.dateOfDeath}
                      onChange={(e) => setNewRecordForm({ ...newRecordForm, dateOfDeath: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location of Death <span className="text-gray-500">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={newRecordForm.locationOfDeath}
                      onChange={(e) => setNewRecordForm({ ...newRecordForm, locationOfDeath: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      placeholder="City, region"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Obituary <span className="text-gray-500">(Optional)</span>
                  </label>
                  <textarea
                    rows={4}
                    value={newRecordForm.obituary}
                    onChange={(e) => setNewRecordForm({ ...newRecordForm, obituary: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Additional information or obituary text"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for Submission <span className="text-gray-500">(Optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={newRecordForm.reason}
                    onChange={(e) => setNewRecordForm({ ...newRecordForm, reason: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Why are you submitting this record? Any sources or context?"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Submitting...' : 'Submit New Record'}
                </button>
              </form>
            )}

            {/* EDIT FORM */}
            {activeTab === 'edit' && (
              <form onSubmit={handleEditSubmit} className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Suggest Edit to Existing Record</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    You can only propose changes to death-related information. Name, gender, and date of birth cannot be edited.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    External ID of Record to Edit <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.externalId}
                    onChange={(e) => setEditForm({ ...editForm, externalId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., P12345"
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter the External ID of the person record you want to edit</p>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-gray-700 mb-4">Proposed Changes (at least one required):</p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date of Death
                      </label>
                      <input
                        type="date"
                        value={editForm.dateOfDeath}
                        onChange={(e) => setEditForm({ ...editForm, dateOfDeath: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location of Death
                      </label>
                      <input
                        type="text"
                        value={editForm.locationOfDeath}
                        onChange={(e) => setEditForm({ ...editForm, locationOfDeath: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                        placeholder="City, region"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Obituary
                      </label>
                      <textarea
                        rows={4}
                        value={editForm.obituary}
                        onChange={(e) => setEditForm({ ...editForm, obituary: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                        placeholder="Additional information or obituary text"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for Edit <span className="text-gray-500">(Optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={editForm.reason}
                    onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Why are you proposing this edit? Any sources or context?"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || (!editForm.dateOfDeath && !editForm.locationOfDeath && !editForm.obituary)}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Submitting...' : 'Submit Edit Proposal'}
                </button>
              </form>
            )}

            {/* SUBMISSION HISTORY */}
            {activeTab === 'history' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Submission History</h3>
                
                {submissions.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p>You haven&apos;t made any submissions yet.</p>
                    <p className="text-sm mt-2">Use the tabs above to propose a new record or suggest an edit.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {submissions.map((submission) => (
                      <div key={submission.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <span className={`px-2 py-1 text-xs font-medium rounded ${
                              submission.type === 'NEW_RECORD' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {submission.type === 'NEW_RECORD' ? 'New Record' : 'Edit'}
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded ${
                              submission.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                              submission.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                              submission.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {submission.status}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(submission.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="text-sm text-gray-700 mb-2">
                          {submission.type === 'NEW_RECORD' ? (
                            <div>
                              <p className="font-medium">{submission.proposedPayload.name}</p>
                              <p className="text-gray-500">ID: {submission.proposedPayload.externalId}</p>
                            </div>
                          ) : (
                            <div>
                              <p className="font-medium">Edit to record: {submission.personId || 'N/A'}</p>
                              <p className="text-gray-500">
                                Fields: {Object.keys(submission.proposedPayload).join(', ')}
                              </p>
                            </div>
                          )}
                        </div>

                        {submission.reason && (
                          <p className="text-sm text-gray-600 mb-2">
                            <span className="font-medium">Your note:</span> {submission.reason}
                          </p>
                        )}

                        {submission.status === 'APPROVED' && submission.approvedAt && (
                          <p className="text-sm text-green-600">
                            ✓ Approved on {new Date(submission.approvedAt).toLocaleDateString()}
                          </p>
                        )}

                        {submission.status === 'REJECTED' && submission.decisionNote && (
                          <p className="text-sm text-red-600">
                            <span className="font-medium">Moderator note:</span> {submission.decisionNote}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

