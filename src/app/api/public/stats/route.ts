import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Public Stats Endpoint
 * No authentication required
 * Returns only public-safe statistics
 */
export async function GET() {
  try {
    // Get public statistics (no sensitive data)
    const [
      totalPersons,
      totalDeceased
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
      })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalPersons,
        totalDeceased,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching public stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}

