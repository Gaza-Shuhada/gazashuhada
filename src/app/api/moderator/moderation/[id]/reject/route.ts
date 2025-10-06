import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireModerator } from '@/lib/auth-utils';
import { currentUser } from '@clerk/nextjs/server';
import { createAuditLogWithUser } from '@/lib/audit-log';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireModerator();
    const { id } = await params;

    const body = await request.json();
    const { note } = body;

    if (!note || note.trim() === '') {
      return NextResponse.json({ error: 'Rejection note is required' }, { status: 400 });
    }

    // Fetch the submission
    const submission = await prisma.communitySubmission.findUnique({
      where: { id },
      include: {
        person: true,
      },
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    if (submission.status !== 'PENDING') {
      return NextResponse.json({ error: 'Submission is not pending' }, { status: 400 });
    }

    const clerkUser = await currentUser();

    // Update submission status
    await prisma.communitySubmission.update({
      where: { id: submission.id },
      data: {
        status: 'REJECTED',
        approvedBy: user.userId,
        approvedAt: new Date(),
        decisionNote: note,
      },
    });

    // Create audit log
    const payload = submission.proposedPayload as Record<string, string>;
    const description = submission.type === 'NEW_RECORD'
      ? `Rejected NEW_RECORD submission for ${payload.name || 'unknown'}`
      : `Rejected EDIT submission for ${submission.person?.name || 'unknown'}`;

    await createAuditLogWithUser(
      clerkUser!.id,
      clerkUser!.emailAddresses[0]?.emailAddress || null,
      {
        action: 'COMMUNITY_SUBMISSION_REJECTED',
        resourceType: 'COMMUNITY_SUBMISSION',
        resourceId: submission.id,
        description: description,
        metadata: {
          submissionId: submission.id,
          submissionType: submission.type,
          personId: submission.personId,
          submittedBy: submission.submittedBy,
          note: note,
        },
      }
    );

    return NextResponse.json({ success: true, message: 'Submission rejected' });

  } catch (error) {
    console.error('Reject submission error:', error);
    if (error instanceof Error && error.message.includes('required')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

