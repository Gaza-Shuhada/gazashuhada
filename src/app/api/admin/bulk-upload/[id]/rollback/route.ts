import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-utils';
import { rollbackBulkUpload } from '@/lib/bulk-upload-service-ultra-optimized';
import { createAuditLog, AuditAction, ResourceType } from '@/lib/audit-log';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication and admin role
    await requireAdmin();
    
    const { id: uploadId } = await params;
    
    // Get bulk upload details for logging
    const bulkUpload = await prisma.bulkUpload.findUnique({
      where: { id: uploadId },
      include: {
        changeSource: {
          include: {
            versions: true,
          },
        },
      },
    });
    
    if (!bulkUpload) {
      return NextResponse.json(
        { error: 'Bulk upload not found' },
        { status: 404 }
      );
    }
    
    // Perform rollback
    const result = await rollbackBulkUpload(uploadId);
    
    // Create audit log
    await createAuditLog({
      action: AuditAction.BULK_UPLOAD_ROLLED_BACK,
      resourceType: ResourceType.BULK_UPLOAD,
      resourceId: uploadId,
      description: `Rolled back bulk upload: ${bulkUpload.filename} (${bulkUpload.changeSource.versions.length} changes reverted)`,
      metadata: {
        filename: bulkUpload.filename,
        originalUploadId: uploadId,
        rollbackChangeSourceId: result.changeSourceId,
        stats: result.stats,
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    });
    
    return NextResponse.json({
      success: true,
      message: 'Bulk upload rolled back successfully',
      stats: result.stats,
    });
  } catch (error) {
    console.error('Rollback error:', error);
    
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }
    
    if (error instanceof Error && error.message.includes('Cannot rollback')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 } // 409 Conflict
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to rollback bulk upload' },
      { status: 500 }
    );
  }
}

