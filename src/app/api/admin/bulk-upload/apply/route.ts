import { NextRequest, NextResponse } from 'next/server';
import { parseCSV } from '@/lib/csv-utils';
import { applyBulkUpload } from '@/lib/bulk-upload-service';
import { requireAdmin } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    await requireAdmin();
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
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
    const result = await applyBulkUpload(rows, file.name, rawFile);
    
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
