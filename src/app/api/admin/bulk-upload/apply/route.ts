import { NextRequest, NextResponse } from 'next/server';
import { parseCSV } from '@/lib/csv-utils';
import { applyBulkUpload } from '@/lib/bulk-upload-service-ultra-optimized';
import { requireAdmin } from '@/lib/auth-utils';
import { createAuditLog, AuditAction, ResourceType } from '@/lib/audit-log';

// Increase body size limit for large CSV uploads
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for large file processing and database writes

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    await requireAdmin();
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const label = formData.get('label') as string | null;
    const dateReleased = formData.get('dateReleased') as string | null;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
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
    
    const csvContent = await file.text();
    const rawFile = Buffer.from(await file.arrayBuffer());
    
    // Parse and validate CSV
    let rows;
    try {
      rows = parseCSV(csvContent);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Invalid CSV format' },
        { status: 400 }
      );
    }
    
    // Apply the upload
    const result = await applyBulkUpload(rows, file.name, rawFile, label.trim(), dateReleasedObj);
    
    // Create audit log
    await createAuditLog({
      action: AuditAction.BULK_UPLOAD_APPLIED,
      resourceType: ResourceType.BULK_UPLOAD,
      resourceId: result.uploadId,
      description: `Applied bulk upload: ${file.name} (${rows.length} records)`,
      metadata: {
        filename: file.name,
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
