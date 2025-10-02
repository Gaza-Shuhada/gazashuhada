'use client';

import { useState, useEffect } from 'react';
import { Prisma } from '@prisma/client';

interface AuditLog {
  id: string;
  userId: string;
  userEmail: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  description: string;
  metadata: Prisma.JsonValue | null;
  ipAddress: string | null;
  createdAt: string;
}

function AuditLogsContent() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/audit-logs');
      const data = await response.json();
      
      if (data.success) {
        setLogs(data.logs);
      } else {
        setError(data.error || 'Failed to fetch audit logs');
      }
    } catch (err) {
      setError('An error occurred while fetching audit logs');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('APPLIED') || action.includes('APPROVED') || action.includes('CREATED')) {
      return 'bg-green-100 text-green-800';
    }
    if (action.includes('REJECTED') || action.includes('FAILED') || action.includes('DELETED')) {
      return 'bg-red-100 text-red-800';
    }
    if (action.includes('CHANGED') || action.includes('EDITED')) {
      return 'bg-yellow-100 text-yellow-800';
    }
    return 'bg-blue-100 text-blue-800';
  };

  const getResourceTypeBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      'BULK_UPLOAD': 'bg-purple-100 text-purple-800',
      'COMMUNITY_SUBMISSION': 'bg-blue-100 text-blue-800',
      'PERSON': 'bg-gray-100 text-gray-800',
      'USER': 'bg-indigo-100 text-indigo-800',
      'SYSTEM': 'bg-slate-100 text-slate-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-sm text-gray-500 mt-1">Recent activity log (last 50 actions)</p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-gray-500">Loading audit logs...</div>
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-gray-500">No audit logs found</div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resource
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP Address
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {log.userEmail || 'Unknown'}
                        </div>
                        <div className="text-xs text-gray-500">{log.userId.substring(0, 12)}...</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getActionBadgeColor(log.action)}`}>
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className={`px-2 py-1 text-xs font-medium rounded inline-block ${getResourceTypeBadgeColor(log.resourceType)}`}>
                          {log.resourceType}
                        </span>
                        {log.resourceId && (
                          <span className="text-xs text-gray-500">
                            ID: {log.resourceId.substring(0, 8)}...
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-md">
                        {log.description}
                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <details className="mt-1 text-xs text-gray-500">
                            <summary className="cursor-pointer hover:text-gray-700">
                              View metadata
                            </summary>
                            <pre className="mt-1 p-2 bg-gray-50 rounded overflow-x-auto">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.ipAddress || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AuditLogsPage() {
  return (
    <div className="min-h-screen bg-gray-50 pt-8 pb-8 px-8">
      <div className="max-w-7xl mx-auto">
        <AuditLogsContent />
      </div>
    </div>
  );
}

