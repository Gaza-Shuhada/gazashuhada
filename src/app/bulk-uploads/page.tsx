import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import BulkUploadsClient from './BulkUploadsClient';

interface BulkUpload {
  id: string;
  filename: string;
  label: string;
  dateReleased: string;
  uploadedAt: string;
  canRollback: boolean;
  stats: {
    total: number;
    inserts: number;
    updates: number;
    deletes: number;
  };
}

interface DiffItem {
  externalId: string;
  changeType: 'INSERT' | 'UPDATE' | 'DELETE';
  current?: {
    name: string;
    gender: string;
    dateOfBirth: Date;
  };
  incoming: {
    name: string;
    gender: string;
    dateOfBirth: Date;
  };
}

interface SimulationResult {
  summary: {
    totalIncoming: number;
    inserts: number;
    updates: number;
    deletes: number;
  };
  deletions: DiffItem[];
  updates: DiffItem[];
  sampleInserts: DiffItem[];
}

function BulkUploadsContent() {
  const [uploads, setUploads] = useState<BulkUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [label, setLabel] = useState<string>('');
  const [dateReleased, setDateReleased] = useState<string>('');
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [applying, setApplying] = useState(false);
  const [rollingBack, setRollingBack] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchUploads();
  }, []);

  const fetchUploads = async () => {
    try {
      const response = await fetch('/api/admin/bulk-upload/list');
      const data = await response.json();
      if (data.success) {
        setUploads(data.uploads);
      }
    } catch (err) {
      console.error('Failed to fetch uploads:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setSimulation(null);
      setError(null);
    }
  };

  const handleSimulate = async () => {
    if (!selectedFile) return;
    
    if (!label.trim()) {
      setError('Please provide a label for this upload');
      return;
    }

    if (!dateReleased.trim()) {
      setError('Please provide the date when this data was released');
      return;
    }

    setSimulating(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/admin/bulk-upload/simulate', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Simulation failed');
        setSimulation(null);
      } else {
        setSimulation(data.simulation);
      }
    } catch (err) {
      setError('Failed to simulate upload');
      console.error(err);
    } finally {
      setSimulating(false);
    }
  };

  const handleApply = async () => {
    if (!selectedFile) return;
    
    if (!label.trim()) {
      setError('Please provide a label for this upload');
      return;
    }

    if (!dateReleased.trim()) {
      setError('Please provide the date when this data was released');
      return;
    }

    setApplying(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('label', label.trim());
      formData.append('dateReleased', dateReleased);

      const response = await fetch('/api/admin/bulk-upload/apply', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Apply failed');
      } else {
        // Success - reset form and refresh list
        setSelectedFile(null);
        setLabel('');
        setDateReleased('');
        setSimulation(null);
        fetchUploads();
        alert('Bulk upload applied successfully!');
      }
    } catch (err) {
      setError('Failed to apply upload');
      console.error(err);
    } finally {
      setApplying(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setLabel('');
    setDateReleased('');
    setSimulation(null);
    setError(null);
  };

  const handleRollback = async (uploadId: string, filename: string) => {
    if (!confirm(`Are you sure you want to rollback the upload "${filename}"?\n\nThis will permanently delete all versions created by this upload and remove it from the history.`)) {
      return;
    }

    try {
      setRollingBack(uploadId);
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/admin/bulk-upload/${uploadId}/rollback`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`Successfully rolled back and removed upload "${filename}". Removed ${data.stats.inserts} inserts, ${data.stats.updates} updates, and ${data.stats.deletes} deletions.`);
        // Refresh the uploads list
        await fetchUploads();
      } else {
        setError(data.error || 'Failed to rollback upload');
      }
    } catch (err) {
      setError('An error occurred while rolling back the upload');
      console.error('Rollback error:', err);
    } finally {
      setRollingBack(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDateOfBirth = (date: Date | string) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-background pt-8 pb-8 px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Bulk Uploads</h1>
          <p className="text-muted-foreground mt-2">Upload and manage Ministry of Health CSV files</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-4 bg-accent border text-accent-foreground px-4 py-3 rounded relative">
            {success}
            <button onClick={() => setSuccess(null)} className="absolute top-0 right-0 px-4 py-3">
              <span className="text-2xl">&times;</span>
            </button>
          </div>
        )}

        {/* Upload Section */}
        <div className="bg-card rounded-lg border p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">New Bulk Upload</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Upload CSV File
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="block w-full text-sm text-muted-foreground
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-primary/5 file:text-primary
                  hover:file:bg-primary/10"
              />
              <p className="mt-2 text-sm text-muted-foreground">
                CSV must contain only: external_id, name, gender, date_of_birth
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Label <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g., Q4 2024 Update, January Corrections, etc."
                className="block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-ring focus:border-primary sm:text-sm text-foreground placeholder-muted-foreground"
                maxLength={200}
                required
              />
              <p className="mt-1 text-sm text-muted-foreground">
                Provide a description to identify this upload (required)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Date Released <span className="text-destructive">*</span>
              </label>
              <input
                type="date"
                value={dateReleased}
                onChange={(e) => setDateReleased(e.target.value)}
                className="block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-ring focus:border-primary sm:text-sm text-foreground"
                required
              />
              <p className="mt-1 text-sm text-muted-foreground">
                When was this source data published/released? (required)
              </p>
            </div>

            {error && (
              <div className="bg-destructive/5 border border-destructive/20 text-destructive px-4 py-3 rounded">
                {error}
              </div>
            )}

            {selectedFile && !simulation && (
              <button
                onClick={handleSimulate}
                disabled={simulating}
                className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary disabled:opacity-50"
              >
                {simulating ? 'Simulating...' : 'Simulate Upload'}
              </button>
            )}

            {simulation && (
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-semibold text-lg">Simulation Results</h3>
                
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-muted p-4 rounded">
                    <div className="text-sm text-muted-foreground">Total Incoming</div>
                    <div className="text-2xl font-bold">{simulation.summary.totalIncoming}</div>
                  </div>
                  <div className="bg-accent p-4 rounded">
                    <div className="text-sm text-accent-foreground">Inserts</div>
                    <div className="text-2xl font-bold text-accent-foreground">{simulation.summary.inserts}</div>
                  </div>
                  <div className="bg-secondary/20 p-4 rounded">
                    <div className="text-sm text-secondary-foreground">Updates</div>
                    <div className="text-2xl font-bold text-secondary-foreground">{simulation.summary.updates}</div>
                  </div>
                  <div className="bg-destructive/5 p-4 rounded">
                    <div className="text-sm text-destructive">Deletes</div>
                    <div className="text-2xl font-bold text-destructive">{simulation.summary.deletes}</div>
                  </div>
                </div>

                {/* Deletions - Show ALL */}
                {simulation.deletions.length > 0 && (
                  <div className="border border-destructive/20 rounded-lg p-4 bg-destructive/5">
                    <h4 className="font-medium mb-2 text-destructive">⚠️ Records to be Deleted ({simulation.deletions.length})</h4>
                    <p className="text-sm text-destructive mb-3">These records exist in the database but are NOT in the CSV file:</p>
                    <div className="overflow-x-auto max-h-96">
                      <table className="min-w-full divide-y divide-border bg-background">
                        <thead className="bg-destructive/10">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-destructive uppercase">External ID</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-destructive uppercase">Name</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-destructive uppercase">Gender</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-destructive uppercase">Date of Birth</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {simulation.deletions.map((diff, idx) => (
                            <tr key={idx} className="hover:bg-destructive/5">
                              <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">{diff.externalId}</td>
                              <td className="px-4 py-2 text-sm">{diff.current?.name}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm">{diff.current?.gender}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm">{diff.current && formatDateOfBirth(diff.current.dateOfBirth)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Updates - Show ALL */}
                {simulation.updates.length > 0 && (
                  <div className="border rounded-lg p-4 bg-secondary/20">
                    <h4 className="font-medium mb-2 text-secondary-foreground">📝 Records to be Updated ({simulation.updates.length})</h4>
                    <p className="text-sm text-secondary-foreground mb-3">These records will be modified:</p>
                    <div className="overflow-x-auto max-h-96">
                      <table className="min-w-full divide-y divide-border bg-background">
                        <thead className="bg-secondary/50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-secondary-foreground uppercase">External ID</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-secondary-foreground uppercase">Current</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-secondary-foreground uppercase">→ New</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {simulation.updates.map((diff, idx) => (
                            <tr key={idx} className="hover:bg-secondary/20">
                              <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">{diff.externalId}</td>
                              <td className="px-4 py-2 text-sm">
                                {diff.current && (
                                  <div className="text-xs">
                                    <div className={diff.current.name !== diff.incoming.name ? 'line-through text-destructive' : ''}>{diff.current.name}</div>
                                    <div className="text-muted-foreground">
                                      <span className={diff.current.gender !== diff.incoming.gender ? 'line-through text-destructive' : ''}>{diff.current.gender}</span>
                                      {' • '}
                                      <span className={formatDateOfBirth(diff.current.dateOfBirth) !== formatDateOfBirth(diff.incoming.dateOfBirth) ? 'line-through text-destructive' : ''}>
                                        {formatDateOfBirth(diff.current.dateOfBirth)}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-2 text-sm">
                                <div className="text-xs">
                                  <div className={diff.current && diff.current.name !== diff.incoming.name ? 'font-semibold text-accent-foreground' : ''}>{diff.incoming.name}</div>
                                  <div className="text-muted-foreground">
                                    <span className={diff.current && diff.current.gender !== diff.incoming.gender ? 'font-semibold text-accent-foreground' : ''}>{diff.incoming.gender}</span>
                                    {' • '}
                                    <span className={diff.current && formatDateOfBirth(diff.current.dateOfBirth) !== formatDateOfBirth(diff.incoming.dateOfBirth) ? 'font-semibold text-accent-foreground' : ''}>
                                      {formatDateOfBirth(diff.incoming.dateOfBirth)}
                                    </span>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Sample Inserts */}
                {simulation.sampleInserts.length > 0 && (
                  <div className="border rounded-lg p-4 bg-accent">
                    <h4 className="font-medium mb-2 text-accent-foreground">✨ Sample New Records ({simulation.summary.inserts > 10 ? `showing 10 of ${simulation.summary.inserts}` : simulation.summary.inserts})</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-border bg-background">
                        <thead className="bg-accent">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-accent-foreground uppercase">External ID</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-accent-foreground uppercase">Name</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-accent-foreground uppercase">Gender</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-accent-foreground uppercase">Date of Birth</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {simulation.sampleInserts.map((diff, idx) => (
                            <tr key={idx} className="hover:bg-accent">
                              <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">{diff.externalId}</td>
                              <td className="px-4 py-2 text-sm">{diff.incoming.name}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm">{diff.incoming.gender}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm">{formatDateOfBirth(diff.incoming.dateOfBirth)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    onClick={handleApply}
                    disabled={applying}
                    className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50"
                  >
                    {applying ? 'Applying...' : 'Apply Upload'}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={applying}
                    className="bg-secondary text-secondary-foreground px-6 py-2 rounded-md hover:bg-secondary/80 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Past Uploads Section */}
        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Past Uploads</h2>
          
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : uploads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No uploads yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Filename
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Label
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Date Released
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Uploaded At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Total Changes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Inserts
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Updates
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Deletes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-background divide-y divide-border">
                  {uploads.map((upload) => (
                    <tr key={upload.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                        {upload.filename}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary">
                          {upload.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {formatDateOfBirth(upload.dateReleased)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {formatDate(upload.uploadedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        {upload.stats.total}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-accent-foreground">
                        {upload.stats.inserts}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-foreground">
                        {upload.stats.updates}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-destructive">
                        {upload.stats.deletes}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {upload.canRollback ? (
                          <button
                            onClick={() => handleRollback(upload.id, upload.filename)}
                            disabled={rollingBack === upload.id}
                            className="bg-destructive text-white px-3 py-1 rounded-md hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium"
                          >
                            {rollingBack === upload.id ? 'Rolling back...' : 'Rollback'}
                          </button>
                        ) : (
                          <span
                            className="inline-block px-3 py-1 rounded-md bg-muted text-muted-foreground text-xs font-medium cursor-not-allowed"
                            title="Cannot rollback: subsequent uploads have modified these records. Rollback recent uploads first (LIFO)."
                          >
                            Rollback
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default async function BulkUploadsPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  const user = await currentUser();
  const role = user?.publicMetadata?.role as string;
  if (role !== 'admin') redirect('/?error=admin_required');
  return <BulkUploadsClient />;
}
