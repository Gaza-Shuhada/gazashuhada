import { NextRequest, NextResponse } from 'next/server';
import { parseCSV } from '@/lib/csv-utils';
import { simulateBulkUpload } from '@/lib/bulk-upload-service-ultra-optimized';
import { requireAdmin } from '@/lib/auth-utils';

/**
 * Route Configuration for Bulk Upload Simulation
 * 
 * These exports configure Next.js App Router behavior for handling large CSV files.
 * See docs/ENGINEERING.md for complete configuration documentation.
 */

/**
 * Runtime: nodejs
 * Reason: Required for processing large files and database operations.
 * Alternative would be 'edge' but that has memory/time constraints unsuitable for bulk processing.
 */
export const runtime = 'nodejs';

/**
 * Max Duration: 60 seconds
 * Reason: Simulation reads ~30K+ records from CSV and queries database to compare.
 * Default timeout is 10s on Vercel Hobby, 60s on Pro (increase if needed).
 */
export const maxDuration = 60;

/**
 * Dynamic Rendering: force-dynamic
 * Reason: Each simulation is unique (different files, different DB state at time of request).
 * Prevents Next.js from caching or prerendering this route.
 */
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const { userId, role } = await requireAdmin();
    console.log('[Bulk Upload Simulate] User:', userId, 'Role:', role);
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    const csvContent = await file.text();
    
    // Parse and validate CSV
    let rows;
    try {
      rows = parseCSV(csvContent);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Invalid CSV format' },
        { status: 400 }
      );
    }
    
    // Simulate the upload
    const simulation = await simulateBulkUpload(rows);
    
    return NextResponse.json({
      success: true,
      simulation,
    });
  } catch (error) {
    console.error('[Bulk Upload Simulate] Error:', error);
    console.error('[Bulk Upload Simulate] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to simulate bulk upload',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
