'use client';

import { useUser } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';

// Dynamically import LocationPicker to avoid SSR issues with Leaflet
const LocationPicker = dynamic(() => import('@/components/LocationPicker'), {
  ssr: false,
  loading: () => <div className="h-96 w-full bg-muted rounded-md flex items-center justify-center">
    <p className="text-muted-foreground">Loading map...</p>
  </div>
});

interface Contribution {
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

export default function CommunityContributePage() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'new' | 'edit' | 'history'>('edit');
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(false);
  // OLD: Inline error/success messages (replaced with toast notifications)
  // const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states for NEW_RECORD
  const [newRecordForm, setNewRecordForm] = useState({
    externalId: '',
    name: '',
    nameEnglish: '',
    gender: 'MALE',
    dateOfBirth: '',
    dateOfDeath: '',
    locationOfDeathLat: '',
    locationOfDeathLng: '',
    obituary: '',
    photoUrlThumb: '',
    photoUrlOriginal: '',
    reason: '',
  });

  // Photo upload states
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Form states for EDIT
  const [editForm, setEditForm] = useState({
    externalId: '',
    dateOfDeath: '',
    locationOfDeathLat: '',
    locationOfDeathLng: '',
    obituary: '',
    photoUrlThumb: '',
    photoUrlOriginal: '',
    reason: '',
  });

  // Photo upload states for edit
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState<string | null>(null);

  // Redirect if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in');
    }
    // All roles (admin, moderator, community) can access this page
  }, [isLoaded, isSignedIn, router]);

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
      // Don't throw - we don't want to break the contribution flow
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type', {
        description: 'Only JPEG, PNG, WebP, and GIF are allowed.',
        duration: Infinity,
      });
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large', {
        description: 'Maximum size is 10MB.',
        duration: Infinity,
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      if (isEdit) {
        setEditPhotoPreview(reader.result as string);
        setEditPhotoFile(file);
      } else {
        setPhotoPreview(reader.result as string);
        setPhotoFile(file);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = (isEdit = false) => {
    if (isEdit) {
      setEditPhotoFile(null);
      setEditPhotoPreview(null);
      setEditForm({ ...editForm, photoUrlThumb: '', photoUrlOriginal: '' });
    } else {
      setPhotoFile(null);
      setPhotoPreview(null);
      setNewRecordForm({ ...newRecordForm, photoUrlThumb: '', photoUrlOriginal: '' });
    }
  };

  const uploadPhoto = async (file: File): Promise<{ thumbUrl: string; originalUrl: string }> => {
    const formData = new FormData();
    formData.append('photo', file);

    const response = await fetch('/api/community/upload-photo', {
      method: 'POST',
      body: formData,
    });

    // Handle empty or invalid JSON response
    let data;
    try {
      const text = await response.text();
      if (!text) {
        throw new Error('Server returned empty response. Check server logs for details.');
      }
      data = JSON.parse(text);
    } catch (parseError) {
      console.error('Photo upload response error:', parseError);
      throw new Error('Invalid response from photo upload service. Please check server logs.');
    }

    if (!response.ok) {
      throw new Error(data.error || 'Failed to upload photo');
    }

    return { thumbUrl: data.thumbUrl as string, originalUrl: data.originalUrl as string };
  };

  const handleNewRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const submitToast = toast.loading('Submitting new record...', {
      description: 'Please wait while we process your contribution',
    });

    try {
      // Upload photo if provided
      let photoUrlThumb = newRecordForm.photoUrlThumb;
      let photoUrlOriginal = newRecordForm.photoUrlOriginal;
      if (photoFile) {
        setUploadingPhoto(true);
        const uploaded = await uploadPhoto(photoFile);
        photoUrlThumb = uploaded.thumbUrl;
        photoUrlOriginal = uploaded.originalUrl;
        setUploadingPhoto(false);
      }

      const payload = {
        externalId: newRecordForm.externalId,
        name: newRecordForm.name,
        nameEnglish: newRecordForm.nameEnglish || null,
        gender: newRecordForm.gender,
        dateOfBirth: newRecordForm.dateOfBirth,
        ...(newRecordForm.dateOfDeath && { dateOfDeath: newRecordForm.dateOfDeath }),
        ...(newRecordForm.locationOfDeathLat && { locationOfDeathLat: parseFloat(newRecordForm.locationOfDeathLat) }),
        ...(newRecordForm.locationOfDeathLng && { locationOfDeathLng: parseFloat(newRecordForm.locationOfDeathLng) }),
        ...(newRecordForm.obituary && { obituary: newRecordForm.obituary }),
        ...(photoUrlThumb && { photoUrlThumb }),
        ...(photoUrlOriginal && { photoUrlOriginal }),
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

      // Handle empty or invalid JSON response
      let data;
      try {
        const text = await response.text();
        if (!text) {
          throw new Error('Server returned empty response. Check server logs for details.');
        }
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('Contribution response error:', parseError);
        throw new Error('Invalid response from server. Please try again or check server logs.');
      }

      if (response.ok) {
        toast.success('New record submitted!', {
          id: submitToast,
          description: 'Your contribution will be reviewed by moderators.',
          duration: Infinity,
        });
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Clear form
        setNewRecordForm({
          externalId: '',
          name: '',
          nameEnglish: '',
          gender: 'MALE',
          dateOfBirth: '',
          dateOfDeath: '',
          locationOfDeathLat: '',
          locationOfDeathLng: '',
          obituary: '',
          photoUrlThumb: '',
          photoUrlOriginal: '',
          reason: '',
        });
        setPhotoFile(null);
        setPhotoPreview(null);
        
        // Fetch contributions in background (don't block)
        fetchContributions().catch(err => console.error('Failed to refresh contributions:', err));
      } else {
        const errorMessage = data.error || 'Failed to submit record';
        // Check if it's a duplicate external ID error
        const isDuplicateError = errorMessage.includes('already exists');
        
        toast.error(isDuplicateError ? 'Duplicate External ID' : 'Contribution Failed', {
          id: submitToast,
          description: errorMessage,
          duration: Infinity,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while submitting';
      toast.error('Contribution failed', {
        id: submitToast,
        description: errorMessage,
        duration: Infinity,
      });
    } finally {
      setLoading(false);
      setUploadingPhoto(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent any parent form handlers
    
    console.log('[handleEditSubmit] Handler started!');
    setLoading(true);

    const submitToast = toast.loading('Submitting edit proposal...', {
      description: 'Please wait while we process your submission',
    });

    try {
      console.log('[handleEditSubmit] Starting edit submission...');
      // Upload photo if provided
      let photoUrlThumb = editForm.photoUrlThumb;
      let photoUrlOriginal = editForm.photoUrlOriginal;
      if (editPhotoFile) {
        console.log('[handleEditSubmit] Uploading photo...');
        setUploadingPhoto(true);
        const uploaded = await uploadPhoto(editPhotoFile);
        photoUrlThumb = uploaded.thumbUrl;
        photoUrlOriginal = uploaded.originalUrl;
        setUploadingPhoto(false);
        console.log('[handleEditSubmit] Photo uploaded successfully');
      }

      const payload: {
        dateOfDeath?: string;
        locationOfDeathLat?: number;
        locationOfDeathLng?: number;
        obituary?: string;
        photoUrlThumb?: string;
        photoUrlOriginal?: string;
      } = {};
      if (editForm.dateOfDeath) payload.dateOfDeath = editForm.dateOfDeath;
      if (editForm.locationOfDeathLat) payload.locationOfDeathLat = parseFloat(editForm.locationOfDeathLat);
      if (editForm.locationOfDeathLng) payload.locationOfDeathLng = parseFloat(editForm.locationOfDeathLng);
      if (editForm.obituary) payload.obituary = editForm.obituary;
      if (photoUrlThumb) payload.photoUrlThumb = photoUrlThumb;
      if (photoUrlOriginal) payload.photoUrlOriginal = photoUrlOriginal;

      console.log('[handleEditSubmit] Submitting edit payload:', payload);
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

      console.log('[handleEditSubmit] Response status:', response.status);
      
      // Handle empty or invalid JSON response
      let data;
      try {
        const text = await response.text();
        console.log('[handleEditSubmit] Response text length:', text.length);
        if (!text) {
          throw new Error('Server returned empty response. Check server logs for details.');
        }
        data = JSON.parse(text);
        console.log('[handleEditSubmit] Parsed response data:', data);
      } catch (parseError) {
        console.error('[handleEditSubmit] Response parse error:', parseError);
        throw new Error('Invalid response from server. Please try again or check server logs.');
      }

      if (response.ok) {
        console.log('[handleEditSubmit] Success! Clearing form...');
        
        toast.success('Edit proposal submitted!', {
          id: submitToast,
          description: 'Your proposal will be reviewed by moderators.',
          duration: Infinity,
        });
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Clear form
        setEditForm({
          externalId: '',
          dateOfDeath: '',
          locationOfDeathLat: '',
          locationOfDeathLng: '',
          obituary: '',
          photoUrlThumb: '',
          photoUrlOriginal: '',
          reason: '',
        });
        setEditPhotoFile(null);
        setEditPhotoPreview(null);
        
        // Fetch contributions in background (don't block)
        fetchContributions().catch(err => console.error('Failed to refresh contributions:', err));
        
        console.log('[handleEditSubmit] Success handler complete');
      } else {
        toast.error(data.error || 'Failed to submit edit', {
          id: submitToast,
          description: 'Please try again or contact support if the issue persists.',
          duration: Infinity,
        });
      }
    } catch (error) {
      console.error('[handleEditSubmit] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while submitting';
      toast.error('Submission failed', {
        id: submitToast,
        description: errorMessage,
        duration: Infinity,
      });
    } finally {
      console.log('[handleEditSubmit] Finally block - re-enabling button');
      setLoading(false);
      setUploadingPhoto(false);
    }
  };

  if (!isLoaded || !isSignedIn) {
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
          <h1 className="text-3xl font-bold">Community Contributions</h1>
          <p className="text-muted-foreground mt-2">Propose new records or suggest edits to existing death-related information</p>
        </div>

        {/* OLD: Inline message display (replaced with toast notifications)
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-accent text-accent-foreground' : 'bg-destructive/5 text-destructive'}`}>
            {message.text}
          </div>
        )}
        */}

        {/* Tabs */}
        <div className="bg-card border rounded-lg mb-6">
          <div className="border-b">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('edit')}
                className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'edit'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
                }`}
              >
                Suggest Edit
              </button>
              <button
                onClick={() => setActiveTab('new')}
                className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'new'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
                }`}
              >
                Propose New Record
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'history'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
                }`}
              >
                My Contributions ({contributions.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* NEW RECORD FORM */}
            {activeTab === 'new' && (
              <form onSubmit={handleNewRecordSubmit} className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Propose a New Person Record</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    All new records start as unconfirmed. If the Ministry of Health includes this person in a future bulk upload,
                    the record will be marked as officially confirmed. Location coordinates should be provided as latitude/longitude pairs.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      External ID <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newRecordForm.externalId}
                      onChange={(e) => setNewRecordForm({ ...newRecordForm, externalId: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
                      placeholder="e.g., P12345"
                      pattern="[A-Za-z0-9_-]+"
                      maxLength={50}
                      title="Letters, numbers, hyphens, and underscores only (max 50 characters)"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Letters, numbers, hyphens, and underscores only (e.g., P12345, MoH-2024-001)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Full Name (Arabic) <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newRecordForm.name}
                      onChange={(e) => setNewRecordForm({ ...newRecordForm, name: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
                      placeholder="Full name in Arabic"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Full Name (English) <span className="text-muted-foreground">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={newRecordForm.nameEnglish}
                      onChange={(e) => setNewRecordForm({ ...newRecordForm, nameEnglish: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
                      placeholder="English translation of name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Gender <span className="text-destructive">*</span>
                    </label>
                    <select
                      required
                      value={newRecordForm.gender}
                      onChange={(e) => setNewRecordForm({ ...newRecordForm, gender: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Date of Birth <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={newRecordForm.dateOfBirth}
                      onChange={(e) => setNewRecordForm({ ...newRecordForm, dateOfBirth: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Date of Death <span className="text-muted-foreground">(Optional)</span>
                    </label>
                    <input
                      type="date"
                      value={newRecordForm.dateOfDeath}
                      onChange={(e) => setNewRecordForm({ ...newRecordForm, dateOfDeath: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Location of Death <span className="text-muted-foreground">(Optional)</span>
                    </label>
                    <LocationPicker
                      initialLat={newRecordForm.locationOfDeathLat ? parseFloat(newRecordForm.locationOfDeathLat) : null}
                      initialLng={newRecordForm.locationOfDeathLng ? parseFloat(newRecordForm.locationOfDeathLng) : null}
                      onLocationChange={(lat, lng) => {
                        setNewRecordForm({
                          ...newRecordForm,
                          locationOfDeathLat: lat !== null ? lat.toString() : '',
                          locationOfDeathLng: lng !== null ? lng.toString() : '',
                        });
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Obituary <span className="text-muted-foreground">(Optional)</span>
                  </label>
                  <textarea
                    rows={4}
                    value={newRecordForm.obituary}
                    onChange={(e) => setNewRecordForm({ ...newRecordForm, obituary: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
                    placeholder="Additional information or obituary text"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Photo <span className="text-muted-foreground">(Optional)</span>
                  </label>
                  <div className="space-y-3">
                    {photoPreview ? (
                      <div className="relative inline-block">
                        <Image 
                          src={photoPreview} 
                          alt="Preview" 
                          width={192}
                          height={192}
                          className="w-48 h-48 object-cover rounded-lg border-2 border"
                          unoptimized
                        />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(false)}
                          className="absolute -top-2 -right-2 bg-destructive/50 text-white rounded-full p-1 hover:bg-destructive"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div>
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                          onChange={(e) => handlePhotoChange(e, false)}
                          className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary/5 file:text-primary hover:file:bg-primary/10"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          JPEG, PNG, WebP, or GIF. Max 10MB. Will be resized to 2048x2048px.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Reason for Submission <span className="text-muted-foreground">(Optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={newRecordForm.reason}
                    onChange={(e) => setNewRecordForm({ ...newRecordForm, reason: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
                    placeholder="Why are you submitting this record? Any sources or context?"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || uploadingPhoto}
                  className="w-full bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {uploadingPhoto ? 'Uploading photo...' : loading ? 'Submitting...' : 'Submit New Record'}
                </button>
              </form>
            )}

            {/* EDIT FORM */}
            {activeTab === 'edit' && (
              <form onSubmit={handleEditSubmit} className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Suggest Edit to Existing Record</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    You can only propose changes to death-related information. Name, gender, and date of birth cannot be edited. 
                    Location coordinates should be provided as latitude/longitude pairs (both required if updating location).
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    External ID of Record to Edit <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.externalId}
                    onChange={(e) => setEditForm({ ...editForm, externalId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
                    placeholder="e.g., P12345"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Enter the External ID of the person record you want to edit</p>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-foreground mb-4">Proposed Changes (at least one required):</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Date of Death
                      </label>
                      <input
                        type="date"
                        value={editForm.dateOfDeath}
                        onChange={(e) => setEditForm({ ...editForm, dateOfDeath: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Location of Death <span className="text-muted-foreground">(Optional)</span>
                      </label>
                      <LocationPicker
                        initialLat={editForm.locationOfDeathLat ? parseFloat(editForm.locationOfDeathLat) : null}
                        initialLng={editForm.locationOfDeathLng ? parseFloat(editForm.locationOfDeathLng) : null}
                        onLocationChange={(lat, lng) => {
                          setEditForm({
                            ...editForm,
                            locationOfDeathLat: lat !== null ? lat.toString() : '',
                            locationOfDeathLng: lng !== null ? lng.toString() : '',
                          });
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Obituary
                  </label>
                  <textarea
                    rows={4}
                    value={editForm.obituary}
                    onChange={(e) => setEditForm({ ...editForm, obituary: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
                    placeholder="Additional information or obituary text"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Photo
                  </label>
                  <div className="space-y-3">
                    {editPhotoPreview ? (
                      <div className="relative inline-block">
                        <Image 
                          src={editPhotoPreview} 
                          alt="Preview" 
                          width={192}
                          height={192}
                          className="w-48 h-48 object-cover rounded-lg border-2 border"
                          unoptimized
                        />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(true)}
                          className="absolute -top-2 -right-2 bg-destructive/50 text-white rounded-full p-1 hover:bg-destructive"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div>
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                          onChange={(e) => handlePhotoChange(e, true)}
                          className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary/5 file:text-primary hover:file:bg-primary/10"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          JPEG, PNG, WebP, or GIF. Max 10MB. Will replace existing photo if approved.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Reason for Edit <span className="text-muted-foreground">(Optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={editForm.reason}
                    onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
                    placeholder="Why are you proposing this edit? Any sources or context?"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || uploadingPhoto || (!editForm.dateOfDeath && !editForm.locationOfDeathLat && !editForm.locationOfDeathLng && !editForm.obituary && !editPhotoFile)}
                  className="w-full bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {uploadingPhoto ? 'Uploading photo...' : loading ? 'Submitting...' : 'Submit Edit Proposal'}
                </button>
              </form>
            )}

            {/* CONTRIBUTION HISTORY */}
            {activeTab === 'history' && (
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Your Contribution History</h3>
                
                {contributions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>You haven&apos;t made any contributions yet.</p>
                    <p className="text-sm mt-2">Use the tabs above to propose a new record or suggest an edit.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {contributions.map((contribution) => (
                      <div key={contribution.id} className="border rounded-lg p-4 bg-card">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <span className={`px-2 py-1 text-xs font-medium rounded ${
                              contribution.type === 'NEW_RECORD' ? 'bg-accent text-accent-foreground' : 'bg-primary/10 text-primary'
                            }`}>
                              {contribution.type === 'NEW_RECORD' ? 'New Record' : 'Edit'}
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
                          {contribution.type === 'NEW_RECORD' ? (
                            <div>
                              <p className="font-medium">{contribution.proposedPayload.name}</p>
                              <p className="text-muted-foreground">ID: {contribution.proposedPayload.externalId}</p>
                            </div>
                          ) : (
                            <div>
                              <p className="font-medium">Edit to record: {contribution.personId || 'N/A'}</p>
                              <p className="text-muted-foreground">
                                Fields: {Object.keys(contribution.proposedPayload).join(', ')}
                              </p>
                            </div>
                          )}
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

