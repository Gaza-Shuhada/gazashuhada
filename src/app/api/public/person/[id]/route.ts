import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Public Single Person Endpoint
 * No authentication required
 * Returns a single person by ID (UUID) or externalId
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const includeHistory = searchParams.get('includeHistory') === 'true';

    // Try to find by UUID first, then by externalId
    let person = await prisma.person.findUnique({
      where: { id },
      select: {
        id: true,
        externalId: true,
        name: true,
        nameEnglish: true,
        gender: true,
        dateOfBirth: true,
        dateOfDeath: true,
        locationOfDeathLat: true,
        locationOfDeathLng: true,
        photoUrlThumb: true, // Only thumbnail
        confirmedByMoh: true,
        createdAt: true,
        updatedAt: true,
        isDeleted: true, // We need this to check, but won't return it
        versions: includeHistory ? {
          orderBy: {
            versionNumber: 'asc'
          },
          select: {
            versionNumber: true,
            changeType: true,
            createdAt: true,
            source: {
              select: {
                type: true,
                description: true
              }
            }
          }
        } : false
      }
    });

    // If not found by UUID, try externalId
    if (!person) {
      person = await prisma.person.findUnique({
        where: { externalId: id },
        select: {
          id: true,
          externalId: true,
          name: true,
          nameEnglish: true,
          gender: true,
          dateOfBirth: true,
          dateOfDeath: true,
          locationOfDeathLat: true,
          locationOfDeathLng: true,
          photoUrlThumb: true,
          confirmedByMoh: true,
          createdAt: true,
          updatedAt: true,
          isDeleted: true,
          versions: includeHistory ? {
            orderBy: {
              versionNumber: 'asc'
            },
            select: {
              versionNumber: true,
              changeType: true,
              createdAt: true,
              source: {
                select: {
                  type: true,
                  description: true
                }
              }
            }
          } : false
        }
      });
    }

    if (!person) {
      return NextResponse.json(
        { error: 'Person not found' },
        { status: 404 }
      );
    }

    // Don't expose deleted records to public
    if (person.isDeleted) {
      return NextResponse.json(
        { error: 'Person not found' },
        { status: 404 }
      );
    }

    // Remove isDeleted from response
    const { versions, ...personData } = person;

    const response = {
      success: true,
      data: {
        ...personData,
        ...(includeHistory && versions ? { history: versions } : {})
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching person:', error);
    return NextResponse.json(
      { error: 'Failed to fetch person' },
      { status: 500 }
    );
  }
}

