import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { requireAdmin } from '@/lib/auth-utils';

/**
 * Route Configuration for CSV Upload to Blob Storage
 * 
 * This endpoint handles large CSV file uploads by streaming directly to Vercel Blob.
 * Uses ReadableStream to avoid buffering the entire file in memory.
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
    
    // Get the request body as a stream
    const body = request.body;
    
    if (!body) {
      return NextResponse.json({ error: 'No file data provided' }, { status: 400 });
    }
    
    // Upload to Vercel Blob with streaming
    // The put() function accepts a ReadableStream directly
    const blob = await put(`bulk-uploads/temp/${Date.now()}-${filename}`, body, {
      access: 'public',
      addRandomSuffix: true,
      contentType: 'text/csv',
    });
    
    console.log(`[Upload CSV] Upload complete: ${blob.url}`);
    
    return NextResponse.json({ 
      blobUrl: blob.url,
      filename: blob.pathname,
    });
    
  } catch (error) {
    console.error('[Upload CSV] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload file' },
      { status: 500 }
    );
  }
}

