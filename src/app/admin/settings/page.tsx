'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Trash2, AlertTriangle } from 'lucide-react';

export default function AdminSettingsPage() {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    stats?: {
      persons: number;
      versions: number;
      uploads: number;
      sources: number;
      submissions: number;
    };
  } | null>(null);

  const handleClearDatabase = async () => {
    setIsClearing(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/admin/clear-database', {
        method: 'POST',
      });
      
      const text = await response.text();
      const data = text ? JSON.parse(text) : {};
      
      if (response.ok) {
        setResult({
          success: true,
          message: 'Database cleared successfully!',
          stats: data.stats,
        });
      } else {
        setResult({
          success: false,
          message: data.error || 'Failed to clear database',
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'An error occurred while clearing the database',
      });
    } finally {
      setIsClearing(false);
      setShowConfirmDialog(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-8 pb-8 px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Admin Settings</h1>
          <p className="text-muted-foreground mt-2">Manage system settings and database operations</p>
        </div>

        {result && (
          <Alert className={`mb-6 ${result.success ? 'bg-accent' : 'bg-destructive/5 border-destructive/20'}`}>
            <AlertDescription className={result.success ? 'text-accent-foreground' : 'text-destructive'}>
              {result.message}
              {result.stats && (
                <div className="mt-2 text-sm">
                  <p>Deleted:</p>
                  <ul className="list-disc list-inside ml-2">
                    <li>{result.stats.persons.toLocaleString()} Person records</li>
                    <li>{result.stats.versions.toLocaleString()} PersonVersion records</li>
                    <li>{result.stats.uploads.toLocaleString()} BulkUpload records</li>
                    <li>{result.stats.sources.toLocaleString()} ChangeSource records</li>
                    <li>{result.stats.submissions.toLocaleString()} CommunitySubmission records</li>
                  </ul>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        <Card className="border-destructive/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
            </div>
            <CardDescription>
              Irreversible actions that affect the entire database
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">Clear Entire Database</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Permanently delete all data from the database including:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside ml-2">
                  <li>All Person records</li>
                  <li>All PersonVersion history</li>
                  <li>All BulkUpload records (CSV files in Blob storage will remain)</li>
                  <li>All ChangeSource records</li>
                  <li>All CommunitySubmission records</li>
                </ul>
                <div className="mt-3 flex items-center gap-2 text-sm font-medium text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <span>This action cannot be undone!</span>
                </div>
              </div>
              <Button
                variant="destructive"
                size="default"
                onClick={() => setShowConfirmDialog(true)}
                disabled={isClearing}
                className="ml-4"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {isClearing ? 'Clearing...' : 'Clear Database'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Are you absolutely sure?
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3">
                  <p className="font-semibold">
                    This will permanently delete ALL data from the database.
                  </p>
                  <p>
                    This action cannot be undone. This will:
                  </p>
                  <ul className="list-disc list-inside ml-2 space-y-1">
                    <li>Delete all Person records and their version history</li>
                    <li>Delete all BulkUpload metadata</li>
                    <li>Delete all ChangeSource records</li>
                    <li>Delete all CommunitySubmission records</li>
                  </ul>
                  <p className="text-destructive font-medium">
                    Note: CSV files in Blob storage will NOT be deleted and can be re-uploaded.
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isClearing}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleClearDatabase}
                disabled={isClearing}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isClearing ? 'Clearing...' : 'Yes, clear everything'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

