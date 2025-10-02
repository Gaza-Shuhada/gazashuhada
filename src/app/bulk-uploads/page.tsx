'use client';

import { useState, useEffect } from 'react';

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
    <div className="min-h-screen bg-gray-50 pt-8 pb-8 px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Bulk Uploads</h1>

        {/* Success Message */}
        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative">
            {success}
            <button onClick={() => setSuccess(null)} className="absolute top-0 right-0 px-4 py-3">
              <span className="text-2xl">&times;</span>
            </button>
          </div>
        )}

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">New Bulk Upload</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload CSV File
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
              <p className="mt-2 text-sm text-gray-500">
                CSV must contain only: external_id, name, gender, date_of_birth
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Label <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g., Q4 2024 Update, January Corrections, etc."
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 placeholder-gray-400"
                maxLength={200}
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                Provide a description to identify this upload (required)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Released <span className="text-red-600">*</span>
              </label>
              <input
                type="date"
                value={dateReleased}
                onChange={(e) => setDateReleased(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                When was this source data published/released? (required)
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {selectedFile && !simulation && (
              <button
                onClick={handleSimulate}
                disabled={simulating}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {simulating ? 'Simulating...' : 'Simulate Upload'}
              </button>
            )}

            {simulation && (
              <div className="border border-gray-200 rounded-lg p-4 space-y-4">
                <h3 className="font-semibold text-lg">Simulation Results</h3>
                
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-4 rounded">
                    <div className="text-sm text-gray-600">Total Incoming</div>
                    <div className="text-2xl font-bold">{simulation.summary.totalIncoming}</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded">
                    <div className="text-sm text-green-600">Inserts</div>
                    <div className="text-2xl font-bold text-green-700">{simulation.summary.inserts}</div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded">
                    <div className="text-sm text-yellow-600">Updates</div>
                    <div className="text-2xl font-bold text-yellow-700">{simulation.summary.updates}</div>
                  </div>
                  <div className="bg-red-50 p-4 rounded">
                    <div className="text-sm text-red-600">Deletes</div>
                    <div className="text-2xl font-bold text-red-700">{simulation.summary.deletes}</div>
                  </div>
                </div>

                {/* Deletions - Show ALL */}
                {simulation.deletions.length > 0 && (
                  <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                    <h4 className="font-medium mb-2 text-red-800">⚠️ Records to be Deleted ({simulation.deletions.length})</h4>
                    <p className="text-sm text-red-700 mb-3">These records exist in the database but are NOT in the CSV file:</p>
                    <div className="overflow-x-auto max-h-96">
                      <table className="min-w-full divide-y divide-red-200 bg-white">
                        <thead className="bg-red-100">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-red-700 uppercase">External ID</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-red-700 uppercase">Name</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-red-700 uppercase">Gender</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-red-700 uppercase">Date of Birth</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-red-100">
                          {simulation.deletions.map((diff, idx) => (
                            <tr key={idx} className="hover:bg-red-50">
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
                  <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                    <h4 className="font-medium mb-2 text-yellow-800">📝 Records to be Updated ({simulation.updates.length})</h4>
                    <p className="text-sm text-yellow-700 mb-3">These records will be modified:</p>
                    <div className="overflow-x-auto max-h-96">
                      <table className="min-w-full divide-y divide-yellow-200 bg-white">
                        <thead className="bg-yellow-100">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-yellow-700 uppercase">External ID</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-yellow-700 uppercase">Current</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-yellow-700 uppercase">→ New</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-yellow-100">
                          {simulation.updates.map((diff, idx) => (
                            <tr key={idx} className="hover:bg-yellow-50">
                              <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">{diff.externalId}</td>
                              <td className="px-4 py-2 text-sm">
                                {diff.current && (
                                  <div className="text-xs">
                                    <div className={diff.current.name !== diff.incoming.name ? 'line-through text-red-600' : ''}>{diff.current.name}</div>
                                    <div className="text-gray-500">
                                      <span className={diff.current.gender !== diff.incoming.gender ? 'line-through text-red-600' : ''}>{diff.current.gender}</span>
                                      {' • '}
                                      <span className={formatDateOfBirth(diff.current.dateOfBirth) !== formatDateOfBirth(diff.incoming.dateOfBirth) ? 'line-through text-red-600' : ''}>
                                        {formatDateOfBirth(diff.current.dateOfBirth)}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-2 text-sm">
                                <div className="text-xs">
                                  <div className={diff.current && diff.current.name !== diff.incoming.name ? 'font-semibold text-green-600' : ''}>{diff.incoming.name}</div>
                                  <div className="text-gray-500">
                                    <span className={diff.current && diff.current.gender !== diff.incoming.gender ? 'font-semibold text-green-600' : ''}>{diff.incoming.gender}</span>
                                    {' • '}
                                    <span className={diff.current && formatDateOfBirth(diff.current.dateOfBirth) !== formatDateOfBirth(diff.incoming.dateOfBirth) ? 'font-semibold text-green-600' : ''}>
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
                  <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                    <h4 className="font-medium mb-2 text-green-800">✨ Sample New Records ({simulation.summary.inserts > 10 ? `showing 10 of ${simulation.summary.inserts}` : simulation.summary.inserts})</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-green-200 bg-white">
                        <thead className="bg-green-100">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-green-700 uppercase">External ID</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-green-700 uppercase">Name</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-green-700 uppercase">Gender</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-green-700 uppercase">Date of Birth</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-green-100">
                          {simulation.sampleInserts.map((diff, idx) => (
                            <tr key={idx} className="hover:bg-green-50">
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
                    className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400"
                  >
                    {applying ? 'Applying...' : 'Apply Upload'}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={applying}
                    className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 disabled:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Past Uploads Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Past Uploads</h2>
          
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : uploads.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No uploads yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Filename
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Label
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date Released
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Uploaded At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Changes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Inserts
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Updates
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deletes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {uploads.map((upload) => (
                    <tr key={upload.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {upload.filename}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                          {upload.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDateOfBirth(upload.dateReleased)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(upload.uploadedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {upload.stats.total}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                        {upload.stats.inserts}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">
                        {upload.stats.updates}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                        {upload.stats.deletes}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {upload.canRollback ? (
                          <button
                            onClick={() => handleRollback(upload.id, upload.filename)}
                            disabled={rollingBack === upload.id}
                            className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-xs font-medium"
                          >
                            {rollingBack === upload.id ? 'Rolling back...' : 'Rollback'}
                          </button>
                        ) : (
                          <span
                            className="inline-block px-3 py-1 rounded-md bg-gray-200 text-gray-500 text-xs font-medium cursor-not-allowed"
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

export default function BulkUploadsPage() {
  return <BulkUploadsContent />;
}
