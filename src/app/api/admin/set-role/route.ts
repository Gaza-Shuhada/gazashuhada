import { createClerkClient } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
  try {
    // Only existing admins can set roles
    await requireAdmin();

    const { userId, role } = await request.json();

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'userId and role are required' },
        { status: 400 }
      );
    }

    if (!['admin', 'moderator', 'user'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be admin, moderator, or user' },
        { status: 400 }
      );
    }

    // Update user's public metadata
    const clerkClient = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: {
        role: role
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: `User role updated to ${role}` 
    });

  } catch (error) {
    console.error('Error setting user role:', error);
    return NextResponse.json(
      { error: 'Failed to set user role' },
      { status: 500 }
    );
  }
}
