import { auth } from '@clerk/nextjs/server';
import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

const THUMB_SIZE = 512; // Thumbnail dimension (square)
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB max file size

export async function POST(request: NextRequest) {
  try {
    console.log('[upload-photo] Request received');
    const { userId } = await auth();

    if (!userId) {
      console.log('[upload-photo] Unauthorized - no userId');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('[upload-photo] User authenticated:', userId);

    // Get the form data
    const formData = await request.formData();
    const file = formData.get('photo') as File;

    if (!file) {
      console.log('[upload-photo] No file provided in form data');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    console.log('[upload-photo] File received:', file.name, file.type, file.size, 'bytes');

    // Validate file type (accept common formats; convert to WebP)
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      console.log('[upload-photo] Invalid file type:', file.type);
      return NextResponse.json({ 
        error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' 
      }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      console.log('[upload-photo] File too large:', file.size);
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 10MB.' 
      }, { status: 400 });
    }

    // Convert file to buffer
    console.log('[upload-photo] Converting to buffer...');
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log('[upload-photo] Buffer created, size:', buffer.length);

    // Prepare original upload (keep original format)
    console.log('[upload-photo] Processing image with sharp...');
    const image = sharp(buffer);
    const metadata = await image.metadata();
    console.log('[upload-photo] Image metadata:', metadata.width, 'x', metadata.height, metadata.format);
    
    if (!metadata.width || !metadata.height) {
      console.log('[upload-photo] Invalid image - no dimensions');
      return NextResponse.json({ error: 'Invalid image file' }, { status: 400 });
    }

    // Derive extension for original file
    const typeToExt: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
    };
    const originalExt = typeToExt[file.type] ?? '.bin';

    // Generate a unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const baseName = `${timestamp}-${randomString}`;
    const originalFilename = `person-photos/originals/${baseName}${originalExt}`;
    const thumbFilename = `person-photos/thumbs/${baseName}.webp`;
    console.log('[upload-photo] Generated filenames:', originalFilename, thumbFilename);

    // Upload to Vercel Blob
    // Upload original
    console.log('[upload-photo] Uploading original to Blob...');
    const originalBlob = await put(originalFilename, buffer, {
      access: 'public',
      contentType: file.type || 'application/octet-stream',
    });
    console.log('[upload-photo] Original uploaded:', originalBlob.url);

    // Create thumbnail (exact 512x512, cropped to cover)
    console.log('[upload-photo] Creating thumbnail...');
    const thumbBuffer = await sharp(buffer)
      .resize(THUMB_SIZE, THUMB_SIZE, { fit: 'cover', position: 'centre' })
      .webp({ quality: 85 })
      .toBuffer();
    console.log('[upload-photo] Thumbnail created, size:', thumbBuffer.length);
    
    console.log('[upload-photo] Uploading thumbnail to Blob...');
    const thumbBlob = await put(thumbFilename, thumbBuffer, {
      access: 'public',
      contentType: 'image/webp',
    });
    console.log('[upload-photo] Thumbnail uploaded:', thumbBlob.url);

    const response = {
      success: true,
      originalUrl: originalBlob.url,
      originalSize: file.size,
      originalContentType: file.type,
      thumbUrl: thumbBlob.url,
      thumbSize: thumbBuffer.length,
      thumbDimensions: { width: THUMB_SIZE, height: THUMB_SIZE },
    };
    console.log('[upload-photo] Success! Returning response');
    return NextResponse.json(response);

  } catch (error) {
    console.error('[upload-photo] ERROR:', error);
    console.error('[upload-photo] Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to upload photo. Please try again.',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
    }, { status: 500 });
  }
}

