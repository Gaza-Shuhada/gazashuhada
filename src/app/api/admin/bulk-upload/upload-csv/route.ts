import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { requireAdmin } from '@/lib/auth-utils';

/**
 * Route Configuration for CSV Upload to Blob Storage
 * 
 * This endpoint handles large CSV file uploads by storing them in Vercel Blob,
 * bypassing the 4.5MB request body limit for subsequent processing.
 */

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    await requireAdmin();
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'File must be a CSV' }, { status: 400 });
    }
    
    console.log(`[Upload CSV] Uploading ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB) to Vercel Blob`);
    
    // Upload to Vercel Blob with temporary path
    const blob = await put(`bulk-uploads/temp/${Date.now()}-${file.name}`, file, {
      access: 'public',
      addRandomSuffix: true,
    });
    
    console.log(`[Upload CSV] File uploaded to: ${blob.url}`);
    
    return NextResponse.json({ 
      blobUrl: blob.url,
      filename: file.name,
      size: file.size,
    });
    
  } catch (error) {
    console.error('[Upload CSV] Error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

