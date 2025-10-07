import { NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { requireAdmin } from '@/lib/auth-utils';

/**
 * Route Configuration for CSV Client Upload Handler
 * 
 * This endpoint implements Vercel's handleUpload protocol for client-side uploads.
 * The client uses @vercel/blob/client upload() which calls this endpoint to:
 * 1. Generate a client token (first request)
 * 2. Notify when upload completes (second request)
 * 
 * This bypasses the 4.5MB limit because the file data never touches this function.
 */

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<Response> {
  try {
    const jsonResponse = await handleUpload({
      request,
      body: request.body as unknown as HandleUploadBody,
      onBeforeGenerateToken: async (pathname: string) => {
        // Verify admin access before generating upload token
        await requireAdmin();
        
        // Validate that it's a CSV file
        if (!pathname.endsWith('.csv')) {
          throw new Error('Only CSV files are allowed');
        }
        
        console.log('[Upload CSV] Generating token for:', pathname);
        
        return {
          allowedContentTypes: ['text/csv', 'application/vnd.ms-excel', 'text/plain'],
          tokenPayload: JSON.stringify({
            userId: 'admin', // You can add user context here
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('[Upload CSV] Upload completed:', blob.url);
        console.log('[Upload CSV] Token payload:', tokenPayload);
      },
    });

    return Response.json(jsonResponse);
  } catch (error) {
    console.error('[Upload CSV] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}

