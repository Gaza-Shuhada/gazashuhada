import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/public/persons/export
 * Export all persons matching current filters as CSV with ALL fields
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const filter = searchParams.get('filter');
    const maxAge = searchParams.get('maxAge');

    // Build where clause
    const whereClause: Prisma.PersonWhereInput = {
      isDeleted: false,
    };

    // Search filter
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nameEnglish: { contains: search, mode: 'insensitive' } },
        { externalId: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Photo filter
    if (filter === 'with_photo') {
      whereClause.photoUrlThumb = { not: null };
    }

    // Age filter
    if (maxAge) {
      const maxAgeNum = parseInt(maxAge, 10);
      if (!isNaN(maxAgeNum) && maxAgeNum < 100) {
        const cutoffDate = new Date();
        cutoffDate.setFullYear(cutoffDate.getFullYear() - maxAgeNum);
        whereClause.dateOfBirth = {
          gte: cutoffDate,
        };
      }
    }

    // Fetch ALL matching persons (no pagination for export)
    const persons = await prisma.person.findMany({
      where: whereClause,
      orderBy: { updatedAt: 'desc' },
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
        photoUrlOriginal: true,
        photoUrlThumb: true,
        isDeleted: true,
        currentVersion: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Convert to CSV
    const csvRows: string[] = [];
    
    // Header row with ALL fields (excluding internal fields like isDeleted)
    const headers = [
      'id',
      'externalId',
      'name',
      'nameEnglish',
      'gender',
      'dateOfBirth',
      'dateOfDeath',
      'locationOfDeathLat',
      'locationOfDeathLng',
      'photoUrlOriginal',
      'photoUrlThumb',
      'currentVersion',
      'createdAt',
      'updatedAt',
    ];
    csvRows.push(headers.join(','));

    // Data rows
    for (const person of persons) {
      const row = [
        escapeCsvValue(person.id),
        escapeCsvValue(person.externalId),
        escapeCsvValue(person.name),
        escapeCsvValue(person.nameEnglish || ''),
        escapeCsvValue(person.gender),
        escapeCsvValue(person.dateOfBirth?.toISOString() || ''),
        escapeCsvValue(person.dateOfDeath?.toISOString() || ''),
        escapeCsvValue(person.locationOfDeathLat?.toString() || ''),
        escapeCsvValue(person.locationOfDeathLng?.toString() || ''),
        escapeCsvValue(person.photoUrlOriginal || ''),
        escapeCsvValue(person.photoUrlThumb || ''),
        escapeCsvValue(person.currentVersion.toString()),
        escapeCsvValue(person.createdAt.toISOString()),
        escapeCsvValue(person.updatedAt.toISOString()),
      ];
      csvRows.push(row.join(','));
    }

    const csvContent = csvRows.join('\n');

    // Return as downloadable CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="gaza-deaths-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('❌ Error exporting persons:', error);
    return NextResponse.json(
      { error: 'Failed to export persons' },
      { status: 500 }
    );
  }
}

/**
 * Escape CSV values (handle commas, quotes, newlines)
 */
function escapeCsvValue(value: string): string {
  if (!value) return '""';
  
  // If value contains comma, quote, or newline, wrap in quotes and escape existing quotes
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  
  return `"${value}"`;
}

