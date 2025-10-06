import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

/**
 * Public Persons List Endpoint
 * No authentication required
 * Returns only active, non-sensitive person records
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters for pagination, search, and filtering
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100); // Max 100 per page
    const skip = (page - 1) * limit;
    const search = searchParams.get('search'); // Optional name search
    const filter = searchParams.get('filter'); // Optional filter
    const confirmedOnly = searchParams.get('confirmedOnly') !== 'false'; // Default to true

    // Build base where clause - never show deleted records publicly
    const whereClause: Prisma.PersonWhereInput = {
      isDeleted: false,
    };

    // Apply confirmed filter (default: only show MoH confirmed)
    if (confirmedOnly) {
      whereClause.confirmedByMoh = true;
    }

    // Add search filter if provided
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nameEnglish: { contains: search, mode: 'insensitive' } },
        { externalId: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Apply additional filters (public-safe only)
    switch (filter) {
      case 'with_photo':
        whereClause.photoUrlThumb = { not: null };
        break;
      
      case 'with_location':
        whereClause.AND = [
          { locationOfDeathLat: { not: null } },
          { locationOfDeathLng: { not: null } }
        ];
        break;
      
      case 'recent':
        // Updated in last 30 days
        whereClause.updatedAt = {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        };
        break;

      case 'community_reported':
        // Community submissions (not confirmed by MoH)
        whereClause.confirmedByMoh = false;
        break;
    }

    // Fetch persons with pagination
    const [persons, total] = await Promise.all([
      prisma.person.findMany({
        where: whereClause,
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
          photoUrlThumb: true, // Only thumbnail, not original
          confirmedByMoh: true,
          createdAt: true,
          updatedAt: true,
          // Do NOT expose: obituary, photoUrlOriginal, isDeleted
        },
        orderBy: {
          updatedAt: 'desc'
        },
        skip,
        take: limit,
      }),
      prisma.person.count({ where: whereClause })
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
        },
        filters: {
          search: search || null,
          filter: filter || null,
          confirmedOnly
        }
      }
    });

  } catch (error) {
    console.error('Error fetching public persons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch persons' },
      { status: 500 }
    );
  }
}

