import { NextRequest, NextResponse } from 'next/server';
import { parseCSV } from '@/lib/csv-utils';
import { simulateBulkUpload } from '@/lib/bulk-upload-service-ultra-optimized';
import { requireAdmin } from '@/lib/auth-utils';
import crypto from 'crypto';
import zlib from 'zlib';

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
  console.log('[SERVER] 🚀 Simulate request received');
  
  try {
    // Check authentication and admin role
    console.log('[SERVER] 🔐 Authenticating user');
    const { userId, role } = await requireAdmin();
    console.log('[SERVER] ✅ User authenticated - ID:', userId, 'Role:', role);
    
    const body = await request.json();
    console.log('[SERVER] 📦 Request body keys:', Object.keys(body));
    const { blobUrl } = body;
    
    if (!blobUrl) {
      console.error('[SERVER] ❌ No blobUrl provided in request body');
      return NextResponse.json({ error: 'No blobUrl provided' }, { status: 400 });
    }
    
    console.log('[SERVER] 🔗 Blob URL:', blobUrl);
    console.log('[SERVER] ⬇️ Downloading CSV from Vercel Blob...');
    
    // Download CSV from Vercel Blob
    const downloadStart = Date.now();
    const response = await fetch(blobUrl);
    console.log('[SERVER] 📨 Blob fetch response status:', response.status);
    
    if (!response.ok) {
      console.error('[SERVER] ❌ Failed to download from blob:', response.statusText);
      throw new Error(`Failed to download file from blob storage: ${response.statusText}`);
    }
    
    const csvContent = await response.text();
    const downloadTime = Date.now() - downloadStart;
    const fileSize = Buffer.byteLength(csvContent, 'utf-8');
    
    // Calculate SHA-256 hash for integrity verification
    const sha256 = crypto.createHash('sha256').update(csvContent).digest('hex');
    
    // Generate preview (first ~20 lines, gzipped)
    const lines = csvContent.split('\n').slice(0, 21); // Header + 20 data lines
    const preview = lines.join('\n');
    const previewGzipped = zlib.gzipSync(Buffer.from(preview, 'utf-8')).toString('base64');
    
    console.log('[SERVER] ✅ Download complete!');
    console.log('[SERVER] 📊 File stats:', {
      sizeBytes: fileSize,
      sizeMB: (fileSize / 1024 / 1024).toFixed(2),
      downloadTimeMs: downloadTime,
      downloadTimeSec: (downloadTime / 1000).toFixed(2),
      sha256: sha256.substring(0, 16) + '...',
      previewSize: previewGzipped.length,
    });
    
    // Parse and validate CSV
    console.log('[SERVER] 📄 Parsing CSV content...');
    let rows;
    try {
      const parseStart = Date.now();
      rows = parseCSV(csvContent);
      const parseTime = Date.now() - parseStart;
      console.log('[SERVER] ✅ CSV parsed successfully!');
      console.log('[SERVER] 📊 Parse stats:', {
        rowCount: rows.length,
        parseTimeMs: parseTime,
        parseTimeSec: (parseTime / 1000).toFixed(2),
      });
    } catch (error) {
      console.error('[SERVER] ❌ CSV parse error:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Invalid CSV format' },
        { status: 400 }
      );
    }
    
    // Simulate the upload
    console.log('[SERVER] 🔄 Starting simulation...');
    const simulateStart = Date.now();
    const simulation = await simulateBulkUpload(rows);
    const simulateTime = Date.now() - simulateStart;
    
    console.log('[SERVER] ✅ Simulation complete!');
    console.log('[SERVER] 📊 Simulation results:', {
      totalIncoming: simulation.summary.totalIncoming,
      inserts: simulation.summary.inserts,
      updates: simulation.summary.updates,
      deletes: simulation.summary.deletes,
      simulateTimeMs: simulateTime,
      simulateTimeSec: (simulateTime / 1000).toFixed(2),
    });
    
    return NextResponse.json({
      success: true,
      simulation,
      blobMetadata: {
        size: fileSize,
        sha256,
        contentType: 'text/csv',
        previewLines: previewGzipped,
      },
    });
  } catch (error) {
    console.error('[SERVER] ❌ Simulate error:', error);
    console.error('[SERVER] 📋 Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      type: typeof error,
      stringified: JSON.stringify(error, Object.getOwnPropertyNames(error)),
    });
    
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to simulate bulk upload',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
