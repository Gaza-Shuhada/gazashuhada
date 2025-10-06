import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';
import { createAuditLog, AuditAction, ResourceType } from '@/lib/audit-log';

export async function POST() {
  try {
    // Check authentication and admin role
    await requireAdmin();

    // Clear all data in the correct order (respecting foreign keys)
    // MUST delete children before parents to avoid FK constraint violations
    
    // Step 1: Delete records that reference Person
    const communitySubmissions = await prisma.communitySubmission.deleteMany();
    const personVersions = await prisma.personVersion.deleteMany();
    
    // Step 2: Delete Person records (now that children are gone)
    const persons = await prisma.person.deleteMany();
    
    // Step 3: Delete independent tables (no FK dependencies)
    const [bulkUploads, changeSources] = await Promise.all([
      prisma.bulkUpload.deleteMany(),
      prisma.changeSource.deleteMany(),
    ]);

    // Create audit log for this action
    await createAuditLog({
      action: AuditAction.BULK_UPLOAD_ROLLED_BACK, // Closest action type
      resourceType: ResourceType.BULK_UPLOAD,
      resourceId: 'database-clear',
      description: `Database cleared: ${persons.count} persons, ${personVersions.count} versions, ${bulkUploads.count} uploads, ${changeSources.count} sources, ${communitySubmissions.count} submissions`,
      metadata: {
        persons: persons.count,
        versions: personVersions.count,
        uploads: bulkUploads.count,
        sources: changeSources.count,
        submissions: communitySubmissions.count,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Database cleared successfully',
      stats: {
        persons: persons.count,
        versions: personVersions.count,
        uploads: bulkUploads.count,
        sources: changeSources.count,
        submissions: communitySubmissions.count,
      },
    });
  } catch (error) {
    console.error('Clear database error:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to clear database' },
      { status: 500 }
    );
  }
}

