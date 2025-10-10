import { NextRequest, NextResponse } from 'next/server';
import { applyBulkUpload } from '@/lib/bulk-upload-service-ultra-optimized';
import { requireAdmin } from '@/lib/auth-utils';
import { createAuditLog, AuditAction, ResourceType } from '@/lib/audit-log';

/**
 * Route Configuration for Bulk Upload Application
 * 
 * These exports configure Next.js App Router behavior for handling large CSV files.
 * See docs/ENGINEERING.md for complete configuration documentation.
 */

/**
 * Runtime: nodejs
 * Reason: Required for processing large files, database transactions, and Vercel Blob uploads.
 * Alternative would be 'edge' but that has memory/time constraints unsuitable for bulk processing.
 */
export const runtime = 'nodejs';

/**
 * Max Duration: 300 seconds (5 minutes)
 * Reason: Applying 30K+ records involves:
 *   - Parsing CSV (5-10s)
 *   - Fetching existing data in batches (20-30s)
 *   - Uploading to Vercel Blob (10-20s)
 *   - Bulk inserts/updates/deletes in batches (60-120s)
 *   - Creating audit logs (5-10s)
 * Total: ~2-3 minutes for large files, 5min gives comfortable buffer.
 * Default timeout is 10s on Vercel Hobby, 60s on Pro (increase if needed).
 */
export const maxDuration = 300;

/**
 * Dynamic Rendering: force-dynamic
 * Reason: Each upload is unique (different files, writes to database, creates new records).
 * Prevents Next.js from caching or prerendering this route.
 */
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  console.log('[SERVER] 🚀 Apply request received');
  
  try {
    // Check authentication and admin role
    console.log('[SERVER] 🔐 Authenticating user');
    const { userId, role } = await requireAdmin();
    console.log('[SERVER] ✅ User authenticated - ID:', userId, 'Role:', role);
    
    const body = await request.json();
    console.log('[SERVER] 📦 Request body keys:', Object.keys(body));
    const { blobUrl, label: comment, dateReleased, filename, blobMetadata, simulationData } = body;
    
    console.log('[SERVER] 📋 Request metadata:', {
      hasBlob: !!blobUrl,
      hasBlobMetadata: !!blobMetadata,
      comment: comment?.trim() || null,
      dateReleased,
      filename,
    });
    
    if (!blobUrl) {
      console.error('[SERVER] ❌ No blobUrl provided');
      return NextResponse.json({ error: 'No blobUrl provided' }, { status: 400 });
    }
    
    if (!blobMetadata) {
      console.error('[SERVER] ❌ No blobMetadata provided');
      return NextResponse.json({ error: 'No blobMetadata provided' }, { status: 400 });
    }
    
    if (!filename) {
      console.error('[SERVER] ❌ No filename provided');
      return NextResponse.json({ error: 'No filename provided' }, { status: 400 });
    }
    
    if (!dateReleased || !dateReleased.trim()) {
      console.error('[SERVER] ❌ No dateReleased provided');
      return NextResponse.json({ error: 'Date released is required' }, { status: 400 });
    }
    
    // Validate date format
    const dateReleasedObj = new Date(dateReleased);
    if (isNaN(dateReleasedObj.getTime())) {
      console.error('[SERVER] ❌ Invalid date format:', dateReleased);
      return NextResponse.json({ error: 'Invalid date format for date released' }, { status: 400 });
    }
    console.log('[SERVER] ✅ Date validation passed:', dateReleasedObj.toISOString());
    
    // OPTIMIZATION: Check if there are any changes to apply
    const hasChanges = !simulationData || 
      simulationData.summary.inserts > 0 || 
      simulationData.summary.updates > 0 || 
      simulationData.summary.deletes > 0;
    
    if (!hasChanges) {
      console.log('[SERVER] ⚡ No changes detected - skipping apply entirely');
    }
    
    // Apply the upload
    console.log('[SERVER] 🔄 Starting bulk upload application...');
    console.log('[SERVER] 📋 Upload metadata:', {
      filename,
      comment: comment?.trim() || null,
      dateReleased: dateReleasedObj.toISOString(),
      inserts: simulationData?.summary.inserts || 0,
      updates: simulationData?.summary.updates || 0,
      deletes: simulationData?.summary.deletes || 0,
      blobUrl,
      blobSize: blobMetadata.size,
    });
    const applyStart = Date.now();
    const result = await applyBulkUpload(
      simulationData,
      filename, 
      blobUrl,
      blobMetadata,
      comment?.trim() || null, 
      dateReleasedObj
    );
    const applyTime = Date.now() - applyStart;
    
    console.log('[SERVER] ✅ Bulk upload applied successfully!');
    console.log('[SERVER] 📊 Apply results:', {
      uploadId: result.uploadId,
      changeSourceId: result.changeSourceId,
      applyTimeMs: applyTime,
      applyTimeSec: (applyTime / 1000).toFixed(2),
      applyTimeMin: (applyTime / 1000 / 60).toFixed(2),
    });
    
    // Create audit log
    const totalRecords = simulationData?.summary.totalIncoming || 0;
    await createAuditLog({
      action: AuditAction.BULK_UPLOAD_APPLIED,
      resourceType: ResourceType.BULK_UPLOAD,
      resourceId: result.uploadId,
      description: `Applied bulk upload: ${filename} (${totalRecords} records)`,
      metadata: {
        filename,
        totalRecords,
        inserts: simulationData?.summary.inserts || 0,
        updates: simulationData?.summary.updates || 0,
        deletes: simulationData?.summary.deletes || 0,
        uploadId: result.uploadId,
        changeSourceId: result.changeSourceId,
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    });
    
    return NextResponse.json({
      success: true,
      uploadId: result.uploadId,
      changeSourceId: result.changeSourceId,
    });
  } catch (error) {
    console.error('Apply error:', error);
    
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to apply bulk upload' },
      { status: 500 }
    );
  }
}
