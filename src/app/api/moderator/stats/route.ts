import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireModerator } from '@/lib/auth-utils';

export async function GET() {
  try {
    // Check if user is authenticated and has moderator or admin role
    await requireModerator();

    // Get statistics
    const [
      totalPersons,
      totalDeceased,
      totalAlive,
      recentUploads,
      recordsReportedByCommunity,
      recordsDeletedByMoH,
      recordsUpdatedByCommunity,
      recordsUpdatedByMoH
    ] = await Promise.all([
      // Total persons (not deleted)
      prisma.person.count({
        where: { isDeleted: false }
      }),
      
      // Total deceased (have date of death)
      prisma.person.count({
        where: { 
          isDeleted: false,
          dateOfDeath: { not: null }
        }
      }),
      
      // Total alive (no date of death)
      prisma.person.count({
        where: { 
          isDeleted: false,
          dateOfDeath: null
        }
      }),
      
      // Recent uploads (last 7 days)
      prisma.person.count({
        where: {
          isDeleted: false,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),

      // Records reported by community (not confirmed by MoH)
      prisma.person.count({
        where: {
          confirmedByMoh: false,
          isDeleted: false
        }
      }),

      // Records deleted by MoH (soft deleted)
      prisma.person.count({
        where: {
          isDeleted: true
        }
      }),

      // Count persons that have at least one UPDATE version from COMMUNITY_SUBMISSION
      (async () => {
        const communityUpdateVersions = await prisma.personVersion.findMany({
          where: {
            changeType: 'UPDATE',
            source: {
              type: 'COMMUNITY_SUBMISSION'
            }
          },
          select: {
            personId: true
          },
          distinct: ['personId']
        });
        return communityUpdateVersions.length;
      })(),

      // Count persons that have at least one UPDATE version from BULK_UPLOAD
      (async () => {
        const mohUpdateVersions = await prisma.personVersion.findMany({
          where: {
            changeType: 'UPDATE',
            source: {
              type: 'BULK_UPLOAD'
            }
          },
          select: {
            personId: true
          },
          distinct: ['personId']
        });
        return mohUpdateVersions.length;
      })()
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalPersons,
        totalDeceased,
        totalAlive,
        recentUploads,
        recordsReportedByCommunity,
        recordsDeletedByMoH,
        recordsUpdatedByCommunity,
        recordsUpdatedByMoH
      }
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
