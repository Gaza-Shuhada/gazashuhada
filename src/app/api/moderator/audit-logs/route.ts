import { NextRequest, NextResponse } from 'next/server';
import { requireModerator } from '@/lib/auth-utils';
import { getRecentAuditLogs } from '@/lib/audit-log';

export async function GET(request: NextRequest) {
  try {
    // Check authentication and staff role (admin or moderator)
    await requireModerator();
    
    // Get limit from query params (default 50)
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    
    // Fetch recent audit logs
    const logs = await getRecentAuditLogs(limit);
    
    return NextResponse.json({
      success: true,
      logs,
    });
  } catch (error) {
    console.error('Audit logs fetch error:', error);
    
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}

