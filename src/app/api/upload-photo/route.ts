import { auth } from '@clerk/nextjs/server';
import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

const THUMB_SIZE = 512; // Thumbnail dimension (square)
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB max file size

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the form data
    const formData = await request.formData();
    const file = formData.get('photo') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type (accept common formats; convert to WebP)
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' 
      }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 10MB.' 
      }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Prepare original upload (keep original format)
    const image = sharp(buffer);
    const metadata = await image.metadata();
    if (!metadata.width || !metadata.height) {
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

    // Upload to Vercel Blob
    // Upload original
    const originalBlob = await put(originalFilename, buffer, {
      access: 'public',
      contentType: file.type || 'application/octet-stream',
    });

    // Create thumbnail (exact 512x512, cropped to cover)
    const thumbBuffer = await sharp(buffer)
      .resize(THUMB_SIZE, THUMB_SIZE, { fit: 'cover', position: 'centre' })
      .webp({ quality: 85 })
      .toBuffer();
    const thumbBlob = await put(thumbFilename, thumbBuffer, {
      access: 'public',
      contentType: 'image/webp',
    });

    return NextResponse.json({
      success: true,
      originalUrl: originalBlob.url,
      originalSize: file.size,
      originalContentType: file.type,
      thumbUrl: thumbBlob.url,
      thumbSize: thumbBuffer.length,
      thumbDimensions: { width: THUMB_SIZE, height: THUMB_SIZE },
    });

  } catch (error) {
    console.error('Photo upload error:', error);
    return NextResponse.json({ 
      error: 'Failed to upload photo. Please try again.' 
    }, { status: 500 });
  }
}

