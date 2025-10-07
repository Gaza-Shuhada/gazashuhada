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
  console.log('[SERVER] 🚀 CSV upload request received');
  
  const body = (await request.json()) as HandleUploadBody;
  console.log('[SERVER] 📦 Request body type:', typeof body);
  
  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname: string) => {
        console.log('[SERVER] 🔐 Authenticating user for token generation');
        // Authenticate before generating upload token
        const { userId } = await requireAdmin();
        console.log('[SERVER] ✅ User authenticated:', userId);
        
        // Validate CSV file
        console.log('[SERVER] 📄 Original pathname:', pathname);
        if (!pathname.endsWith('.csv')) {
          console.error('[SERVER] ❌ Invalid file type:', pathname);
          throw new Error('Only CSV files are allowed');
        }
        
        // Generate unique filename in folder structure
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const originalName = pathname.split('/').pop() || 'upload.csv';
        const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const uniqueFilename = `bulk-uploads/${timestamp}-${randomString}-${sanitizedName}`;
        
        console.log('[SERVER] 📝 Generated unique filename:', uniqueFilename);
        console.log('[SERVER] 📋 File info:', {
          originalName,
          sanitizedName,
          timestamp,
          randomString,
        });
        
        const tokenConfig = {
          allowedContentTypes: ['text/csv', 'application/vnd.ms-excel', 'text/plain'],
          tokenPayload: JSON.stringify({
            uploadedAt: new Date().toISOString(),
            uploadedBy: userId,
            originalName: originalName,
          }),
          // Override pathname with unique filename
          addRandomSuffix: false,
          pathname: uniqueFilename,
        };
        
        console.log('[SERVER] 🎫 Token config:', tokenConfig);
        return tokenConfig;
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Get notified when upload completes
        console.log('[SERVER] ✅ Upload completed successfully!');
        console.log('[SERVER] 🔗 Blob URL:', blob.url);
        console.log('[SERVER] 📦 Blob details:', {
          url: blob.url,
          pathname: blob.pathname,
          contentType: blob.contentType,
          contentDisposition: blob.contentDisposition,
        });
        console.log('[SERVER] 🎫 Token payload:', tokenPayload);
      },
    });
    
    console.log('[SERVER] ✅ Returning response to client');
    console.log('[SERVER] 📦 Response type:', jsonResponse.type);
    
    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error('[SERVER] ❌ Upload error:', error);
    console.error('[SERVER] 📋 Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });
    
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}

