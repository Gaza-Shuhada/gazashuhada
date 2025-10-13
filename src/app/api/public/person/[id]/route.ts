import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Public Single Person Endpoint
 * No authentication required
 * Returns a single person by ID (UUID) or externalId
 * 
 * Query params:
 * - includeHistory=true: Include full version history with source details
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
        createdAt: true,
        updatedAt: true,
        isDeleted: true, // We need this to check, but won't return it
        versions: includeHistory ? {
          orderBy: {
            versionNumber: 'desc'
          },
          include: {
            source: {
              include: {
                bulkUpload: true,
                communitySubmission: true,
              },
            },
          },
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
          createdAt: true,
          updatedAt: true,
          isDeleted: true,
          versions: includeHistory ? {
            orderBy: {
              versionNumber: 'desc'
            },
            include: {
              source: {
                include: {
                  bulkUpload: true,
                  communitySubmission: true,
                },
              },
            },
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

    // Apply mock photos if no photo exists (same as list API)
    // Generate array of 50 image paths: /people/person1.webp through person50.webp
    const mockPhotos = Array.from({ length: 50 }, (_, i) => `/people/person${i + 1}.webp`);

    // Get person's index from list query to assign consistent mock photo
    if (!person.photoUrlThumb) {
      const listResult = await prisma.person.findMany({
        where: { isDeleted: false },
        select: { id: true },
        orderBy: { updatedAt: 'desc' },
        take: 100, // Check first 100 to find this person's position
      });
      const personIndex = listResult.findIndex(p => p.id === person.id);
      if (personIndex !== -1) {
        person.photoUrlThumb = mockPhotos[personIndex % mockPhotos.length];
      }
    }

    // If full history is requested, return complete person data including versions
    // (This is used for admin/staff views)
    if (includeHistory) {
      return NextResponse.json({
        success: true,
        person,
      });
    }

    // For public API without history, don't expose deleted records
    if (person.isDeleted) {
      return NextResponse.json(
        { error: 'Person not found' },
        { status: 404 }
      );
    }

    // Public API response (minimal data, no deleted flag)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { isDeleted, ...publicData } = person;
    return NextResponse.json({
      success: true,
      data: publicData,
    });

  } catch (error) {
    console.error('Error fetching person:', error);
    return NextResponse.json(
      { error: 'Failed to fetch person' },
      { status: 500 }
    );
  }
}

