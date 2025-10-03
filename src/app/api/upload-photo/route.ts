import { auth } from '@clerk/nextjs/server';
import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

const MAX_SIZE = 2048; // Maximum dimension (width or height)
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

    // Validate file type
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

    // Get image metadata
    const image = sharp(buffer);
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      return NextResponse.json({ error: 'Invalid image file' }, { status: 400 });
    }

    // Resize image if needed
    let processedBuffer: Buffer = buffer;
    let needsResize = false;

    if (metadata.width > MAX_SIZE || metadata.height > MAX_SIZE) {
      needsResize = true;
      const resizedBuffer = await image
        .resize(MAX_SIZE, MAX_SIZE, {
          fit: 'inside', // Maintain aspect ratio
          withoutEnlargement: true,
        })
        .jpeg({ quality: 90, mozjpeg: true }) // Convert to optimized JPEG
        .toBuffer();
      processedBuffer = Buffer.from(resizedBuffer);
    } else if (file.type !== 'image/jpeg') {
      // Even if no resize needed, convert to JPEG for consistency and smaller size
      const convertedBuffer = await image
        .jpeg({ quality: 90, mozjpeg: true })
        .toBuffer();
      processedBuffer = Buffer.from(convertedBuffer);
    }

    // Generate a unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const filename = `person-photos/${timestamp}-${randomString}.jpg`;

    // Upload to Vercel Blob
    const blob = await put(filename, processedBuffer, {
      access: 'public',
      contentType: 'image/jpeg',
    });

    return NextResponse.json({
      success: true,
      url: blob.url,
      size: processedBuffer.length,
      originalSize: file.size,
      resized: needsResize,
      dimensions: needsResize 
        ? { width: Math.min(metadata.width, MAX_SIZE), height: Math.min(metadata.height, MAX_SIZE) }
        : { width: metadata.width, height: metadata.height },
    });

  } catch (error) {
    console.error('Photo upload error:', error);
    return NextResponse.json({ 
      error: 'Failed to upload photo. Please try again.' 
    }, { status: 500 });
  }
}

