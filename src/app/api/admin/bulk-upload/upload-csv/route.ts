import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-utils';

/**
 * Client Upload Handler for Large CSV Files
 * 
 * This implements Vercel's client upload pattern to bypass the 4.5MB limit.
 * Files are uploaded directly from the browser to Vercel Blob.
 * 
 * Based on: https://vercel.com/guides/how-to-bypass-vercel-body-size-limit-serverless-functions
 */

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;
  
  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname: string) => {
        // Authenticate before generating upload token
        await requireAdmin();
        
        // Validate CSV file
        if (!pathname.endsWith('.csv')) {
          throw new Error('Only CSV files are allowed');
        }
        
        console.log('[Upload CSV] Generating token for:', pathname);
        
        return {
          allowedContentTypes: ['text/csv', 'application/vnd.ms-excel', 'text/plain'],
          tokenPayload: JSON.stringify({
            uploadedAt: new Date().toISOString(),
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Get notified when upload completes
        console.log('[Upload CSV] Upload completed:', blob.url);
        console.log('[Upload CSV] Token payload:', tokenPayload);
      },
    });
    
    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error('[Upload CSV] Error:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}

