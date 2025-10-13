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
    // Use hash of externalId to get consistent mock photo index
    const mockPhotos = [
      '/people/anas.webp',
      '/people/faten.webp',
      '/people/hind.webp',
      '/people/ismael.webp',
      '/people/khaled.webp',
      '/people/lana.webp',
      '/people/omar.webp',
      '/people/sara.webp',
      '/people/suleiman.webp',
      '/people/yaqeen.webp',
      '/people/Screenshot 2025-10-09 at 11.10.17.webp',
      '/people/Screenshot 2025-10-09 at 11.10.24.webp',
      '/people/Screenshot 2025-10-09 at 11.10.30.webp',
      '/people/Screenshot 2025-10-09 at 11.10.34.webp',
      '/people/Screenshot 2025-10-09 at 11.10.38.webp',
      '/people/Screenshot 2025-10-09 at 11.10.42.webp',
      '/people/Screenshot 2025-10-09 at 11.10.48.webp',
      '/people/Screenshot 2025-10-09 at 11.10.52.webp',
      '/people/Screenshot 2025-10-09 at 11.10.56.webp',
      '/people/Screenshot 2025-10-09 at 11.11.02.webp',
      '/people/Screenshot 2025-10-09 at 11.11.05.webp',
      '/people/Screenshot 2025-10-09 at 11.11.09.webp',
      '/people/Screenshot 2025-10-09 at 11.11.13.webp',
      '/people/Screenshot 2025-10-09 at 11.11.16.webp',
      '/people/Screenshot 2025-10-09 at 11.11.20.webp',
      '/people/Screenshot 2025-10-09 at 11.11.25.webp',
      '/people/Screenshot 2025-10-09 at 11.11.29.webp',
      '/people/Screenshot 2025-10-09 at 11.11.33.webp',
      '/people/Screenshot 2025-10-09 at 11.11.37.webp',
      '/people/Screenshot 2025-10-09 at 11.11.40.webp',
      '/people/Screenshot 2025-10-09 at 11.11.44.webp',
      '/people/Screenshot 2025-10-09 at 11.11.48.webp',
      '/people/Screenshot 2025-10-09 at 11.11.52.webp',
      '/people/Screenshot 2025-10-09 at 11.11.56.webp',
      '/people/Screenshot 2025-10-09 at 11.12.00.webp',
      '/people/Screenshot 2025-10-09 at 11.12.03.webp',
      '/people/Screenshot 2025-10-09 at 11.12.06.webp',
      '/people/Screenshot 2025-10-09 at 11.12.11.webp',
      '/people/Screenshot 2025-10-09 at 11.12.15.webp',
      '/people/Screenshot 2025-10-09 at 11.12.19.webp',
      '/people/Screenshot 2025-10-09 at 11.12.26.webp',
      '/people/Screenshot 2025-10-09 at 11.12.29.webp',
      '/people/Screenshot 2025-10-09 at 11.12.33.webp',
      '/people/Screenshot 2025-10-09 at 11.12.36.webp',
      '/people/Screenshot 2025-10-09 at 11.12.39.webp',
      '/people/Screenshot 2025-10-09 at 11.12.44.webp',
      '/people/Screenshot 2025-10-09 at 11.12.48.webp',
      '/people/Screenshot 2025-10-09 at 11.12.52.webp',
      '/people/Screenshot 2025-10-09 at 11.21.07.webp',
    ];

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

