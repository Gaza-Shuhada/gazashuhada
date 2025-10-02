'use client';

import { useState, useEffect } from 'react';

interface BulkUpload {
  id: string;
  filename: string;
  uploadedAt: string;
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
  sampleDiffs: DiffItem[];
}

function BulkUploadsContent() {
  const [uploads, setUploads] = useState<BulkUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    setApplying(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

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
    setSimulation(null);
    setError(null);
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

                {simulation.sampleDiffs.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Sample Changes (first 10 of each type)</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">External ID</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Current</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Incoming</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {simulation.sampleDiffs.map((diff, idx) => (
                            <tr key={idx}>
                              <td className="px-4 py-2 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs rounded ${
                                  diff.changeType === 'INSERT' ? 'bg-green-100 text-green-800' :
                                  diff.changeType === 'UPDATE' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {diff.changeType}
                                </span>
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm">{diff.externalId}</td>
                              <td className="px-4 py-2 text-sm">
                                {diff.current ? (
                                  <div className="text-xs">
                                    <div>{diff.current.name}</div>
                                    <div className="text-gray-500">{diff.current.gender} • {formatDateOfBirth(diff.current.dateOfBirth)}</div>
                                  </div>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </td>
                              <td className="px-4 py-2 text-sm">
                                <div className="text-xs">
                                  <div>{diff.incoming.name}</div>
                                  <div className="text-gray-500">{diff.incoming.gender} • {formatDateOfBirth(diff.incoming.dateOfBirth)}</div>
                                </div>
                              </td>
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
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {uploads.map((upload) => (
                    <tr key={upload.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {upload.filename}
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
