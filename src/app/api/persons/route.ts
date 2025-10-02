import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireStaff } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated and has staff role (admin or moderator)
    await requireStaff();

    // Get query parameters for pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Fetch persons with pagination (including deleted records)
    const [persons, total] = await Promise.all([
      prisma.person.findMany({
        select: {
          id: true,
          externalId: true,
          name: true,
          gender: true,
          dateOfBirth: true,
          dateOfDeath: true,
          locationOfDeath: true,
          isDeleted: true,
          createdAt: true,
          updatedAt: true,
          versions: {
            orderBy: {
              versionNumber: 'desc'
            },
            take: 1,
            select: {
              versionNumber: true,
            }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        },
        skip,
        take: limit,
      }),
      prisma.person.count()
    ]);
    
    // Transform to include version number directly
    const personsWithVersion = persons.map(person => ({
      ...person,
      currentVersion: person.versions[0]?.versionNumber || 0,
      versions: undefined, // Remove the versions array from response
    }));

    return NextResponse.json({
      success: true,
      data: {
        persons: personsWithVersion,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching persons:', error);
    
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch persons' },
      { status: 500 }
    );
  }
}
