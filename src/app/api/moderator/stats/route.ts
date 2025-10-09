import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireModerator } from '@/lib/auth-utils';

export async function GET() {
  try {
    // Check if user is authenticated and has moderator or admin role
    await requireModerator();

    // Get statistics
    const [
      totalRecords,
      recordsWithPhoto,
      totalBulkUploads,
      pendingSubmissions,
      communityEditedRecords
    ] = await Promise.all([
      // Total records (not deleted)
      prisma.person.count({
        where: { isDeleted: false }
      }),
      
      // Records with photos
      prisma.person.count({
        where: { 
          isDeleted: false,
          photoUrlThumb: { not: null }
        }
      }),
      
      // Total bulk uploads
      prisma.bulkUpload.count(),

      // Pending community submissions
      prisma.communitySubmission.count({
        where: { 
          status: 'PENDING'
        }
      }),

      // Records with community edits (has approved community submissions)
      prisma.person.count({
        where: {
          isDeleted: false,
          submissions: {
            some: {
              status: 'APPROVED'
            }
          }
        }
      })
    ]);

    return NextResponse.json({
      totalRecords,
      recordsWithPhoto,
      totalBulkUploads,
      pendingSubmissions,
      communityEditedRecords
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
