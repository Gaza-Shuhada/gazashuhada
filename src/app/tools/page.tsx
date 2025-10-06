'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  Settings, 
  FileText, 
  Users, 
  Database,
  TrendingUp,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

interface Stats {
  totalRecords: number;
  recordsWithPhoto: number;
  totalBulkUploads: number;
  pendingSubmissions: number;
  communityContributions: number;
  mohUpdates: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/moderator/stats');
      const text = await response.text();
      const data = text ? JSON.parse(text) : {};
      
      if (response.ok) {
        setStats(data);
      } else {
        setError(data.error || 'Failed to fetch stats');
      }
    } catch {
      setError('An error occurred while fetching statistics');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-8 pb-8 px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            System overview and quick access to administrative functions
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
            <Link href="/tools/bulk-uploads">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Bulk Uploads</p>
                    <p className="text-2xl font-bold mt-2">
                      {loading ? '...' : stats?.totalBulkUploads || 0}
                    </p>
                  </div>
                  <Upload className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
            <Link href="/tools/moderation">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pending</p>
                    <p className="text-2xl font-bold mt-2">
                      {loading ? '...' : stats?.pendingSubmissions || 0}
                    </p>
                  </div>
                  <FileText className="h-8 w-8 text-amber-500" />
                </div>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
            <Link href="/records">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Records</p>
                    <p className="text-2xl font-bold mt-2">
                      {loading ? '...' : (stats?.totalRecords ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <Database className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
            <Link href="/tools/audit-logs">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">With Photos</p>
                    <p className="text-2xl font-bold mt-2">
                      {loading ? '...' : (stats?.recordsWithPhoto ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Link>
          </Card>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Data Sources
              </CardTitle>
              <CardDescription>
                Records by source type
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  <div className="h-6 bg-muted animate-pulse rounded"></div>
                  <div className="h-6 bg-muted animate-pulse rounded"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge>MoH Updates</Badge>
                      <span className="text-sm text-muted-foreground">Official bulk uploads</span>
                    </div>
                    <span className="font-semibold">
                      {(stats?.mohUpdates ?? 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Community</Badge>
                      <span className="text-sm text-muted-foreground">User contributions</span>
                    </div>
                    <span className="font-semibold">
                      {(stats?.communityContributions ?? 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                System Status
              </CardTitle>
              <CardDescription>
                Overall system health
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Database</span>
                  <Badge variant="default" className="bg-green-500">Operational</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Blob Storage</span>
                  <Badge variant="default" className="bg-green-500">Operational</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Authentication</span>
                  <Badge variant="default" className="bg-green-500">Operational</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Administrative Actions
            </CardTitle>
            <CardDescription>
              Manage system settings and perform administrative tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <Button asChild variant="outline" className="justify-start h-auto py-4">
                <Link href="/tools/bulk-uploads">
                  <div className="text-left">
                    <div className="font-semibold mb-1">Upload CSV Data</div>
                    <div className="text-sm text-muted-foreground">
                      Import bulk data from Ministry of Health updates
                    </div>
                  </div>
                </Link>
              </Button>

              <Button asChild variant="outline" className="justify-start h-auto py-4">
                <Link href="/tools/settings">
                  <div className="text-left">
                    <div className="font-semibold mb-1">System Settings</div>
                    <div className="text-sm text-muted-foreground">
                      Configure system settings and manage database
                    </div>
                  </div>
                </Link>
              </Button>

              <Button asChild variant="outline" className="justify-start h-auto py-4">
                <Link href="/tools/moderation">
                  <div className="text-left">
                    <div className="font-semibold mb-1">Review Submissions</div>
                    <div className="text-sm text-muted-foreground">
                      Approve or reject community submissions
                    </div>
                  </div>
                </Link>
              </Button>

              <Button asChild variant="outline" className="justify-start h-auto py-4">
                <Link href="/tools/audit-logs">
                  <div className="text-left">
                    <div className="font-semibold mb-1">Audit Logs</div>
                    <div className="text-sm text-muted-foreground">
                      View complete history of all system actions
                    </div>
                  </div>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

