import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
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
              },
            },
          },
        },
      },
      orderBy: {
        uploadedAt: 'desc',
      },
    });
    
    // Calculate stats for each upload
    const uploadsWithStats = bulkUploads.map(upload => {
      const versions = upload.changeSource.versions;
      const inserts = versions.filter(v => !v.changeType).length; // New persons
      const updates = versions.filter(v => v.changeType === 'UPDATE').length;
      const deletes = versions.filter(v => v.changeType === 'DELETE').length;
      
      return {
        id: upload.id,
        filename: upload.filename,
        uploadedAt: upload.uploadedAt,
        stats: {
          total: versions.length,
          inserts,
          updates,
          deletes,
        },
      };
    });
    
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
