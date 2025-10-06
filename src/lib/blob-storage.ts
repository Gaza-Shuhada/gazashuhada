/**
 * Blob Storage Utilities
 * 
 * Handles file uploads to Vercel Blob storage with integrity checking
 * and metadata generation.
 */

import { put } from '@vercel/blob';
import { createHash } from 'crypto';
import { gzipSync, gunzipSync } from 'zlib';

export interface BlobUploadResult {
  url: string;
  size: number;
  sha256: string;
  contentType: string;
  previewLines: string | null;
}

/**
 * Upload a file to Vercel Blob storage
 * 
 * @param file - File buffer to upload
 * @param filename - Name of the file
 * @param options - Upload options
 * @returns Blob metadata
 */
export async function uploadToBlob(
  file: Buffer,
  filename: string,
  options?: {
    contentType?: string;
    generatePreview?: boolean;
    previewLineCount?: number;
  }
): Promise<BlobUploadResult> {
  const contentType = options?.contentType || 'text/csv';
  const generatePreview = options?.generatePreview ?? true;
  const previewLineCount = options?.previewLineCount || 20;

  // Calculate SHA-256 hash for integrity verification
  const sha256 = createHash('sha256').update(file).digest('hex');

  // Generate preview (first N lines, gzipped)
  let previewLines: string | null = null;
  if (generatePreview) {
    try {
      const fileText = file.toString('utf-8');
      const lines = fileText.split('\n').slice(0, previewLineCount);
      const previewText = lines.join('\n');
      const compressed = gzipSync(previewText);
      
      // Only store if compressed preview is reasonable size (<10KB)
      if (compressed.length < 10 * 1024) {
        previewLines = compressed.toString('base64');
      }
    } catch (error) {
      console.warn('Failed to generate preview:', error);
      // Continue without preview - it's optional
    }
  }

  // Upload to Vercel Blob
  // Use a path structure: bulk-uploads/{date}/{filename}
  const uploadPath = `bulk-uploads/${new Date().toISOString().split('T')[0]}/${filename}`;
  
  const blob = await put(uploadPath, file, {
    access: 'public', // Make accessible via URL
    contentType,
    addRandomSuffix: true, // Prevent filename collisions
  });

  return {
    url: blob.url,
    size: file.length,
    sha256,
    contentType,
    previewLines,
  };
}

/**
 * Download a file from Vercel Blob storage
 * 
 * @param url - Blob URL
 * @returns File buffer
 */
export async function downloadFromBlob(url: string): Promise<Buffer> {
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to download from Blob: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Verify file integrity using SHA-256 hash
 * 
 * @param file - File buffer
 * @param expectedSha256 - Expected SHA-256 hash
 * @returns True if hash matches
 */
export function verifyFileIntegrity(file: Buffer, expectedSha256: string): boolean {
  const actualSha256 = createHash('sha256').update(file).digest('hex');
  return actualSha256 === expectedSha256;
}

/**
 * Decompress and extract preview lines
 * 
 * @param compressedPreview - Base64-encoded gzipped preview
 * @returns Decompressed preview text
 */
export function extractPreview(compressedPreview: string): string {
  const compressed = Buffer.from(compressedPreview, 'base64');
  const decompressed = gunzipSync(compressed);
  return decompressed.toString('utf-8');
}

