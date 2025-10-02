import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-utils';

export async function GET() {
  try {
    // Check if user is authenticated
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get statistics
    const [
      totalPersons,
      totalDeceased,
      totalAlive,
      recentUploads
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
      })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalPersons,
        totalDeceased,
        totalAlive,
        recentUploads
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
