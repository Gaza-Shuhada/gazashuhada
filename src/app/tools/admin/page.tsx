'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Button, buttonVariants } from '@/components/ui/button';
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
import Link from 'next/link';

export default function AdminSettingsPage() {
  const { user, isLoaded } = useUser();
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
    } catch {
      setResult({
        success: false,
        message: 'An error occurred while clearing the database',
      });
    } finally {
      setIsClearing(false);
      setShowConfirmDialog(false);
    }
  };

  // Show loading while checking auth
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user is signed in
  if (!user) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-center">
          <div className="mb-6">
            <svg className="mx-auto h-16 w-16 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-4">Authentication Required</h1>
          <p className="text-muted-foreground mb-6">You must be signed in to access settings.</p>
          <Link href="/sign-in" className={buttonVariants({ variant: "default" })}>
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  // Check if user has admin role
  const userRole = user.publicMetadata?.role as string;
  if (userRole !== 'admin') {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-center">
          <div className="mb-6">
            <svg className="mx-auto h-16 w-16 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-2">You need admin privileges to access settings.</p>
          <p className="text-sm text-muted-foreground mb-6">
            Current role: <span className="font-medium">{userRole || 'None'}</span>
          </p>
          <Link href="/" className={buttonVariants({ variant: "default" })}>
            Go Home
          </Link>
        </div>
      </div>
    );
  }

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

