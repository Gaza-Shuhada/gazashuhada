import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireStaff } from '@/lib/auth-utils';
import { currentUser } from '@clerk/nextjs/server';
import { createAuditLogWithUser } from '@/lib/audit-log';

type ProposedNewRecordPayload = {
  externalId: string;
  name: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dateOfBirth: string;
  dateOfDeath?: string;
  locationOfDeathLat?: number;
  locationOfDeathLng?: number;
  obituary?: string;
  photoUrlThumb?: string;
  photoUrlOriginal?: string;
};

type ProposedEditPayload = Partial<{
  dateOfDeath: string;
  locationOfDeathLat: number;
  locationOfDeathLng: number;
  obituary: string;
  photoUrlThumb: string;
  photoUrlOriginal: string;
}>;

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireStaff();
    const { id } = await context.params;

    const body = await request.json();
    const { note } = body;

    // Fetch the submission
    const submission = await prisma.communitySubmission.findUnique({
      where: { id },
      include: {
        person: {
          include: {
            versions: {
              orderBy: { versionNumber: 'desc' },
              take: 1,
            },
          },
        },
        baseVersion: true,
      },
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    if (submission.status !== 'PENDING') {
      return NextResponse.json({ error: 'Submission is not pending' }, { status: 400 });
    }

    const clerkUser = await currentUser();

    // Handle NEW_RECORD approval
    if (submission.type === 'NEW_RECORD') {
      const payload = submission.proposedPayload as ProposedNewRecordPayload;

      // Validate required fields
      if (!payload.externalId || !payload.name || !payload.gender || !payload.dateOfBirth) {
        return NextResponse.json({ error: 'Invalid payload: missing required fields' }, { status: 400 });
      }

      // Check if person with this external ID already exists
      const existingPerson = await prisma.person.findUnique({
        where: { externalId: payload.externalId },
      });

      if (existingPerson) {
        return NextResponse.json({ 
          error: 'Person with this External ID already exists. Mark as SUPERSEDED instead.' 
        }, { status: 400 });
      }

      await prisma.$transaction(async (tx) => {
        // Create change source
        const changeSource = await tx.changeSource.create({
          data: {
            type: 'COMMUNITY_SUBMISSION',
            description: `Community-submitted new record: ${payload.name} (${payload.externalId})`,
          },
        });

        // Create person
        const person = await tx.person.create({
          data: {
            externalId: payload.externalId,
            name: payload.name,
            gender: payload.gender as 'MALE' | 'FEMALE' | 'OTHER',
            dateOfBirth: new Date(payload.dateOfBirth),
            dateOfDeath: payload.dateOfDeath ? new Date(payload.dateOfDeath) : null,
            locationOfDeathLat: typeof payload.locationOfDeathLat === 'number' ? payload.locationOfDeathLat : null,
            locationOfDeathLng: typeof payload.locationOfDeathLng === 'number' ? payload.locationOfDeathLng : null,
            obituary: payload.obituary || null,
            photoUrlThumb: payload.photoUrlThumb || null,
            photoUrlOriginal: payload.photoUrlOriginal || null,
            confirmedByMoh: false, // Community submissions are not MoH confirmed
            isDeleted: false,
          },
        });

        // Create first version
        const version = await tx.personVersion.create({
          data: {
            personId: person.id,
            externalId: person.externalId,
            name: person.name,
            gender: person.gender as 'MALE' | 'FEMALE' | 'OTHER',
            dateOfBirth: person.dateOfBirth,
            dateOfDeath: person.dateOfDeath,
            locationOfDeathLat: person.locationOfDeathLat,
            locationOfDeathLng: person.locationOfDeathLng,
            obituary: person.obituary,
            photoUrlThumb: person.photoUrlThumb,
            photoUrlOriginal: person.photoUrlOriginal,
            confirmedByMoh: false,
            versionNumber: 1,
            sourceId: changeSource.id,
            changeType: 'INSERT',
            isDeleted: false,
          },
        });

        // Update submission
        await tx.communitySubmission.update({
          where: { id: submission.id },
          data: {
            status: 'APPROVED',
            approvedBy: user.userId,
            approvedAt: new Date(),
            decisionNote: note || null,
            approvedChangeSourceId: changeSource.id,
            appliedVersionId: version.id,
          },
        });

        // Create audit log
        await createAuditLogWithUser(
          clerkUser!.id,
          clerkUser!.emailAddresses[0]?.emailAddress || null,
          {
            action: 'COMMUNITY_SUBMISSION_APPROVED',
            resourceType: 'COMMUNITY_SUBMISSION',
            resourceId: submission.id,
            description: `Approved NEW_RECORD submission for ${payload.name}`,
            metadata: {
              submissionId: submission.id,
              personId: person.id,
              externalId: payload.externalId,
              submittedBy: submission.submittedBy,
              note: note || null,
            },
          }
        );
      });

      return NextResponse.json({ success: true, message: 'New record approved and created' });
    }

    // Handle EDIT approval
    if (submission.type === 'EDIT') {
      if (!submission.person) {
        return NextResponse.json({ error: 'Person not found for edit submission' }, { status: 404 });
      }

      const person = submission.person;
      const payload = submission.proposedPayload as ProposedEditPayload;
      const latestVersion = person.versions[0];

      if (!latestVersion) {
        return NextResponse.json({ error: 'No version history found' }, { status: 500 });
      }

      // Check if base version is stale
      if (submission.baseVersion && submission.baseVersion.versionNumber < latestVersion.versionNumber) {
        return NextResponse.json({ 
          error: 'Base version is stale. Record has been updated since submission. Mark as SUPERSEDED instead.' 
        }, { status: 400 });
      }

      await prisma.$transaction(async (tx) => {
        // Create change source
        const changeSource = await tx.changeSource.create({
          data: {
            type: 'COMMUNITY_SUBMISSION',
            description: `Community-submitted edit to ${person.name} (${person.externalId})`,
          },
        });

        // Update person record
        const updateData: Record<string, string | Date | number | null> = {};
        if ('dateOfDeath' in payload) updateData.dateOfDeath = payload.dateOfDeath ? new Date(payload.dateOfDeath) : null;
        if ('locationOfDeathLat' in payload) updateData.locationOfDeathLat = typeof payload.locationOfDeathLat === 'number' ? payload.locationOfDeathLat : null;
        if ('locationOfDeathLng' in payload) updateData.locationOfDeathLng = typeof payload.locationOfDeathLng === 'number' ? payload.locationOfDeathLng : null;
        if ('obituary' in payload) updateData.obituary = payload.obituary || null;
        if ('photoUrlThumb' in payload) updateData.photoUrlThumb = payload.photoUrlThumb || null;
        if ('photoUrlOriginal' in payload) updateData.photoUrlOriginal = payload.photoUrlOriginal || null;

        const updatedPerson = await tx.person.update({
          where: { id: person.id },
          data: updateData,
        });

        // Create new version
        const version = await tx.personVersion.create({
          data: {
            personId: person.id,
            externalId: person.externalId,
            name: person.name,
            gender: person.gender,
            dateOfBirth: person.dateOfBirth,
            dateOfDeath: updatedPerson.dateOfDeath,
            locationOfDeathLat: updatedPerson.locationOfDeathLat,
            locationOfDeathLng: updatedPerson.locationOfDeathLng,
            obituary: updatedPerson.obituary,
            photoUrlThumb: updatedPerson.photoUrlThumb,
            photoUrlOriginal: updatedPerson.photoUrlOriginal,
            confirmedByMoh: person.confirmedByMoh, // Keep existing confirmation status
            versionNumber: latestVersion.versionNumber + 1,
            sourceId: changeSource.id,
            changeType: 'UPDATE',
            isDeleted: false,
          },
        });

        // Update submission
        await tx.communitySubmission.update({
          where: { id: submission.id },
          data: {
            status: 'APPROVED',
            approvedBy: user.userId,
            approvedAt: new Date(),
            decisionNote: note || null,
            approvedChangeSourceId: changeSource.id,
            appliedVersionId: version.id,
          },
        });

        // Create audit log
        await createAuditLogWithUser(
          clerkUser!.id,
          clerkUser!.emailAddresses[0]?.emailAddress || null,
          {
            action: 'COMMUNITY_SUBMISSION_APPROVED',
            resourceType: 'COMMUNITY_SUBMISSION',
            resourceId: submission.id,
            description: `Approved EDIT submission for ${person.name}`,
            metadata: {
              submissionId: submission.id,
              personId: person.id,
              externalId: person.externalId,
              changedFields: Object.keys(payload),
              submittedBy: submission.submittedBy,
              note: note || null,
            },
          }
        );
      });

      return NextResponse.json({ success: true, message: 'Edit approved and applied' });
    }

    return NextResponse.json({ error: 'Invalid submission type' }, { status: 400 });

  } catch (error) {
    console.error('Approve submission error:', error);
    if (error instanceof Error && error.message.includes('required')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

