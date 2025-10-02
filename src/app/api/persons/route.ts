import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters for pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Fetch persons with pagination
    const [persons, total] = await Promise.all([
      prisma.person.findMany({
        where: {
          isDeleted: false
        },
        select: {
          id: true,
          externalId: true,
          name: true,
          gender: true,
          dateOfBirth: true,
          dateOfDeath: true,
          locationOfDeath: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          updatedAt: 'desc'
        },
        skip,
        take: limit,
      }),
      prisma.person.count({
        where: {
          isDeleted: false
        }
      })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        persons,
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
    return NextResponse.json(
      { error: 'Failed to fetch persons' },
      { status: 500 }
    );
  }
}
