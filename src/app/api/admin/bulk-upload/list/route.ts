import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-utils';

export async function GET() {
  try {
    // Check authentication and admin role
    await requireAdmin();
    
    // Fetch all bulk uploads with their change sources
    const bulkUploads = await prisma.bulkUpload.findMany({
      include: {
        changeSource: {
          include: {
            versions: {
              select: {
                id: true,
                versionNumber: true,
                changeType: true,
                isDeleted: true,
              },
            },
          },
        },
      },
      orderBy: {
        uploadedAt: 'desc',
      },
    });
    
    // Calculate stats for each upload and check if it can be rolled back
    const uploadsWithStats = await Promise.all(bulkUploads.map(async (upload) => {
      const versions = upload.changeSource.versions;
      
      // Calculate stats by counting changeType per version
      const inserts = versions.filter(v => v.changeType === 'INSERT').length;
      const updates = versions.filter(v => v.changeType === 'UPDATE').length;
      const deletes = versions.filter(v => v.changeType === 'DELETE').length;
      
      // Check if this upload can be rolled back (LIFO check)
      let canRollback = true;
      
      if (versions.length > 0) {
        // Get all affected person IDs
        const affectedPersonIds = await prisma.personVersion.findMany({
          where: { sourceId: upload.changeSource.id },
          select: { personId: true, versionNumber: true },
        });
        
        const personIds = [...new Set(affectedPersonIds.map(v => v.personId))];
        const maxVersionNumbers = new Map<string, number>();
        
        affectedPersonIds.forEach(v => {
          const current = maxVersionNumbers.get(v.personId) || 0;
          if (v.versionNumber > current) {
            maxVersionNumbers.set(v.personId, v.versionNumber);
          }
        });
        
        // Check if any person has a higher version from a different source
        const conflictingVersions = await prisma.personVersion.findMany({
          where: {
            personId: { in: personIds },
            sourceId: { not: upload.changeSource.id },
          },
          select: {
            personId: true,
            versionNumber: true,
          },
        });
        
        const conflicts = conflictingVersions.filter(cv => {
          const uploadMaxVersion = maxVersionNumbers.get(cv.personId);
          return uploadMaxVersion && cv.versionNumber > uploadMaxVersion;
        });
        
        canRollback = conflicts.length === 0;
      }
      
      return {
        id: upload.id,
        filename: upload.filename,
        label: upload.label,
        dateReleased: upload.dateReleased,
        uploadedAt: upload.uploadedAt,
        canRollback,
        stats: {
          total: versions.length,
          inserts,
          updates,
          deletes,
        },
      };
    }));
    
    return NextResponse.json({
      success: true,
      uploads: uploadsWithStats,
    });
  } catch (error) {
    console.error('List error:', error);
    
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch bulk uploads' },
      { status: 500 }
    );
  }
}
