'use client';

import { useState, useEffect } from 'react';

interface Person {
  id: string;
  externalId: string;
  name: string;
  gender: string;
  dateOfBirth: string;
  dateOfDeath?: string;
  locationOfDeathLat?: number | null;
  locationOfDeathLng?: number | null;
  photoUrl?: string | null;
  isDeleted: boolean;
  currentVersion: number;
  createdAt: string;
  updatedAt: string;
}

interface PersonsData {
  persons: Person[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export function PersonsTable() {
  const [data, setData] = useState<PersonsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchPersons = async (page: number = 1) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/persons?page=${page}&limit=10`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch persons');
      }

      setData(result.data);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersons();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Database Records</h3>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Database Records</h3>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (!data || data.persons.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Database Records</h3>
        <div className="text-center py-8 text-gray-500">
          No records found. Upload some data to get started.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Database Records</h3>
        <div className="text-sm text-gray-600">
          Total: {data.pagination.total} records
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                External ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Gender
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date of Birth
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date of Death
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Photo
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Version
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Deleted
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Updated
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.persons.map((person) => (
              <tr key={person.id} className="hover:bg-gray-50">
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {person.externalId}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {person.name}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    person.gender === 'MALE' ? 'bg-blue-100 text-blue-800' :
                    person.gender === 'FEMALE' ? 'bg-pink-100 text-pink-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {person.gender}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(person.dateOfBirth)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {person.dateOfDeath ? (
                    <span className="text-red-600">{formatDate(person.dateOfDeath)}</span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {person.locationOfDeathLat && person.locationOfDeathLng ? (
                    <span>{person.locationOfDeathLat.toFixed(4)}, {person.locationOfDeathLng.toFixed(4)}</span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {person.photoUrl ? (
                    <a 
                      href={person.photoUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <img 
                        src={person.photoUrl} 
                        alt={`Photo of ${person.name}`}
                        className="w-12 h-12 object-cover rounded border-2 border-gray-300 hover:border-blue-500 transition-colors cursor-pointer"
                      />
                    </a>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                    v{person.currentVersion}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">
                  {person.isDeleted ? (
                    <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                      Yes
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                      No
                    </span>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDateTime(person.updatedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data.pagination.pages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-700">
            Showing page {data.pagination.page} of {data.pagination.pages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => fetchPersons(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() => fetchPersons(currentPage + 1)}
              disabled={currentPage === data.pagination.pages}
              className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
