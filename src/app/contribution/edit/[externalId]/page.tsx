'use client';

import { useUser } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

// Dynamically import LocationPicker to avoid SSR issues with Leaflet
const LocationPicker = dynamic(() => import('@/components/LocationPicker'), {
  ssr: false,
  loading: () => <div className="h-96 w-full bg-muted rounded-md flex items-center justify-center">
    <p className="text-muted-foreground">Loading map...</p>
  </div>
});

export default function ContributeEditPage() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const params = useParams();
  const externalId = params.externalId as string;

  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Form states for EDIT
  const [editForm, setEditForm] = useState({
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
  }, [isLoaded, isSignedIn, router]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setEditPhotoPreview(reader.result as string);
      setEditPhotoFile(file);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setEditPhotoFile(null);
    setEditPhotoPreview(null);
    setEditForm({ ...editForm, photoUrlThumb: '', photoUrlOriginal: '' });
  };

  const uploadPhoto = async (file: File): Promise<{ thumbUrl: string; originalUrl: string }> => {
    const formData = new FormData();
    formData.append('photo', file);

    const response = await fetch('/api/community/upload-photo', {
      method: 'POST',
      body: formData,
    });

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

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const submitToast = toast.loading('Submitting edit proposal...', {
      description: 'Please wait while we process your submission',
    });

    try {
      // Upload photo if provided
      let photoUrlThumb = editForm.photoUrlThumb;
      let photoUrlOriginal = editForm.photoUrlOriginal;
      if (editPhotoFile) {
        setUploadingPhoto(true);
        const uploaded = await uploadPhoto(editPhotoFile);
        photoUrlThumb = uploaded.thumbUrl;
        photoUrlOriginal = uploaded.originalUrl;
        setUploadingPhoto(false);
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

      const response = await fetch('/api/community/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'EDIT',
          externalId: externalId,
          proposedPayload: payload,
          reason: editForm.reason || undefined,
        }),
      });

      let data;
      try {
        const text = await response.text();
        if (!text) {
          throw new Error('Server returned empty response. Check server logs for details.');
        }
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('Response parse error:', parseError);
        throw new Error('Invalid response from server. Please try again or check server logs.');
      }

      if (response.ok) {
        toast.success('Edit proposal submitted!', {
          id: submitToast,
          description: 'Your proposal will be reviewed by moderators.',
          duration: Infinity,
        });

        // Redirect back to person page after a brief delay
        setTimeout(() => {
          router.push(`/person/${externalId}`);
        }, 1500);
      } else {
        toast.error(data.error || 'Failed to submit edit', {
          id: submitToast,
          description: 'Please try again or contact support if the issue persists.',
          duration: Infinity,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while submitting';
      toast.error('Submission failed', {
        id: submitToast,
        description: errorMessage,
        duration: Infinity,
      });
    } finally {
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
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => router.push(`/person/${externalId}`)} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Person
          </Button>
          <h1 className="text-3xl font-bold">Contribute Information</h1>
          <p className="text-muted-foreground mt-2">
            Suggest edits to record: <span className="font-mono font-semibold">{externalId}</span>
          </p>
        </div>

        <div className="bg-card border rounded-lg p-6">
          <form onSubmit={handleEditSubmit} className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Propose Changes</h3>
              <p className="text-sm text-muted-foreground mb-6">
                You can propose changes to death-related information. Name, gender, and date of birth cannot be edited.
                Location coordinates should be provided as latitude/longitude pairs (both required if updating location).
              </p>
            </div>

            <div className="space-y-4">
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

              <div>
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
                      onClick={handleRemovePhoto}
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
                      onChange={handlePhotoChange}
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
        </div>
      </div>
    </div>
  );
}

