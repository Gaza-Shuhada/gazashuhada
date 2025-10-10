import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, proposedPayload, reason, externalId } = body;

    // Only EDIT type is allowed
    if (!type || type !== 'EDIT') {
      return NextResponse.json({ error: 'Invalid submission type. Only EDIT is allowed.' }, { status: 400 });
    }

    // Validate proposed payload
    if (!proposedPayload || typeof proposedPayload !== 'object') {
      return NextResponse.json({ error: 'Invalid proposed payload' }, { status: 400 });
    }

    // Validate that externalId is provided
    if (!externalId) {
      return NextResponse.json({ error: 'External ID is required for edits' }, { status: 400 });
    }

    // Find the person by externalId
    const person = await prisma.person.findUnique({
      where: { externalId: externalId },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
        },
      },
    });

    if (!person) {
      return NextResponse.json({ 
        error: 'Person not found with that External ID.' 
      }, { status: 404 });
    }

    // Block edits to deleted records
    if (person.isDeleted) {
      return NextResponse.json({ 
        error: 'This record has been deleted and cannot be edited.' 
      }, { status: 400 });
    }

    // Validate that only allowed fields are being edited
    const allowedFields = ['dateOfDeath', 'locationOfDeathLat', 'locationOfDeathLng', 'photoUrlThumb', 'photoUrlOriginal'];
    const proposedFields = Object.keys(proposedPayload);
    const invalidFields = proposedFields.filter(field => !allowedFields.includes(field));

    if (invalidFields.length > 0) {
      return NextResponse.json({ 
        error: `Invalid fields for edit: ${invalidFields.join(', ')}. Only death-related fields can be edited.` 
      }, { status: 400 });
    }

    if (proposedFields.length === 0) {
      return NextResponse.json({ error: 'At least one field must be provided for edit' }, { status: 400 });
    }

    // Validate location coordinates (both must be provided or both must be absent)
    const hasLat = proposedPayload.locationOfDeathLat !== undefined && proposedPayload.locationOfDeathLat !== null;
    const hasLng = proposedPayload.locationOfDeathLng !== undefined && proposedPayload.locationOfDeathLng !== null;
    
    if (hasLat !== hasLng) {
      return NextResponse.json({ 
        error: 'Both latitude and longitude must be provided together for location of death' 
      }, { status: 400 });
    }

    if (hasLat && hasLng) {
      const lat = Number(proposedPayload.locationOfDeathLat);
      const lng = Number(proposedPayload.locationOfDeathLng);
      
      if (isNaN(lat) || isNaN(lng)) {
        return NextResponse.json({ error: 'Location coordinates must be valid numbers' }, { status: 400 });
      }
      
      if (lat < -90 || lat > 90) {
        return NextResponse.json({ error: 'Latitude must be between -90 and 90' }, { status: 400 });
      }
      
      if (lng < -180 || lng > 180) {
        return NextResponse.json({ error: 'Longitude must be between -180 and 180' }, { status: 400 });
      }
    }

    const latestVersion = person.versions[0];

    // Create EDIT submission
    const submission = await prisma.communitySubmission.create({
      data: {
        type: 'EDIT',
        baseVersionId: latestVersion.id,
        personId: person.id,
        proposedPayload: proposedPayload,
        reason: reason || null,
        submittedBy: userId,
        status: 'PENDING',
      },
    });

    return NextResponse.json({
      success: true,
      submission: {
        id: submission.id,
        type: submission.type,
        status: submission.status,
        createdAt: submission.createdAt,
      },
    });

  } catch (error) {
    console.error('[Community Submit] Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
