import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-utils';

/**
 * Route Configuration for CSV Upload Token Generation
 * 
 * This endpoint generates a client upload token that allows the browser
 * to upload files DIRECTLY to Vercel Blob storage, completely bypassing
 * the 4.5MB serverless function body size limit.
 * 
 * The client will use @vercel/blob/client to upload directly.
 */

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Check authentication and admin role
    await requireAdmin();
    
    const body = await request.json();
    const { filename } = body;
    
    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }
    
    if (!filename.endsWith('.csv')) {
      return NextResponse.json({ error: 'File must be a CSV' }, { status: 400 });
    }
    
    console.log(`[Upload CSV] Generating client upload token for: ${filename}`);
    
    // Generate a client upload token
    // The client will use this to upload directly to Blob storage
    const pathname = `bulk-uploads/temp/${Date.now()}-${filename}`;
    
    // Return the token and pathname
    // Client will use @vercel/blob/client upload() function
    return NextResponse.json({ 
      pathname,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    
  } catch (error) {
    console.error('[Upload CSV] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate upload token' },
      { status: 500 }
    );
  }
}

