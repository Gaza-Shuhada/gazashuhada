import { NextRequest, NextResponse } from 'next/server';
import { parseCSV } from '@/lib/csv-utils';
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
  try {
    // Check authentication and admin role
    await requireAdmin();
    
    const body = await request.json();
    const { blobUrl, label, dateReleased, filename } = body;
    
    if (!blobUrl) {
      return NextResponse.json({ error: 'No blobUrl provided' }, { status: 400 });
    }
    
    if (!filename) {
      return NextResponse.json({ error: 'No filename provided' }, { status: 400 });
    }
    
    if (!label || !label.trim()) {
      return NextResponse.json({ error: 'Label is required' }, { status: 400 });
    }
    
    if (!dateReleased || !dateReleased.trim()) {
      return NextResponse.json({ error: 'Date released is required' }, { status: 400 });
    }
    
    // Validate date format
    const dateReleasedObj = new Date(dateReleased);
    if (isNaN(dateReleasedObj.getTime())) {
      return NextResponse.json({ error: 'Invalid date format for date released' }, { status: 400 });
    }
    
    console.log(`[Bulk Upload Apply] Downloading CSV from: ${blobUrl}`);
    
    // Download CSV from Vercel Blob
    const response = await fetch(blobUrl);
    if (!response.ok) {
      throw new Error(`Failed to download file from blob storage: ${response.statusText}`);
    }
    
    const csvContent = await response.text();
    const rawFile = Buffer.from(csvContent, 'utf-8');
    
    console.log(`[Bulk Upload Apply] Downloaded ${(rawFile.length / 1024 / 1024).toFixed(2)} MB`);
    
    // Parse and validate CSV
    let rows;
    try {
      rows = parseCSV(csvContent);
      console.log(`[Bulk Upload Apply] Parsed ${rows.length} rows from CSV`);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Invalid CSV format' },
        { status: 400 }
      );
    }
    
    // Apply the upload
    const result = await applyBulkUpload(rows, filename, rawFile, label.trim(), dateReleasedObj);
    
    // Create audit log
    await createAuditLog({
      action: AuditAction.BULK_UPLOAD_APPLIED,
      resourceType: ResourceType.BULK_UPLOAD,
      resourceId: result.uploadId,
      description: `Applied bulk upload: ${filename} (${rows.length} records)`,
      metadata: {
        filename,
        totalRecords: rows.length,
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
