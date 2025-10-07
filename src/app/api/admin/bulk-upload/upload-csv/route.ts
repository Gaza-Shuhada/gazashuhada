import { NextRequest, NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { requireAdmin } from '@/lib/auth-utils';

/**
 * Route Configuration for CSV Upload to Blob Storage
 * 
 * This endpoint handles large CSV file uploads using Vercel's handleUpload API,
 * which bypasses the 4.5MB request body limit by streaming directly to Blob storage.
 */

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Check authentication and admin role
    await requireAdmin();
    
    const filename = request.nextUrl.searchParams.get('filename');
    
    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }
    
    if (!filename.endsWith('.csv')) {
      return NextResponse.json({ error: 'File must be a CSV' }, { status: 400 });
    }
    
    console.log(`[Upload CSV] Starting upload for: ${filename}`);
    
    // Use Vercel's handleUpload which streams the file directly to Blob storage
    // This bypasses the body size limit entirely
    const jsonResponse = await handleUpload({
      request,
      body: request.body as unknown as HandleUploadBody,
      onBeforeGenerateToken: async () => {
        // Security check - ensure user is admin (already checked above, but double-check)
        await requireAdmin();
        
        return {
          allowedContentTypes: ['text/csv', 'application/vnd.ms-excel'],
          tokenPayload: JSON.stringify({}),
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log(`[Upload CSV] File uploaded successfully: ${blob.url}`);
      },
    });
    
    const { blob } = jsonResponse;
    
    if (!blob || !blob.url) {
      throw new Error('Upload failed - no blob URL returned');
    }
    
    console.log(`[Upload CSV] Upload complete: ${blob.url} (${(blob.size / 1024 / 1024).toFixed(2)} MB)`);
    
    return NextResponse.json({ 
      blobUrl: blob.url,
      filename: blob.pathname,
      size: blob.size,
    });
    
  } catch (error) {
    console.error('[Upload CSV] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload file' },
      { status: 500 }
    );
  }
}

