/**
 * Migration Script: Move BulkUpload.rawFile to Blob Storage
 * 
 * This script migrates existing bulk upload files from PostgreSQL BYTES
 * column to Vercel Blob storage.
 * 
 * Usage:
 *   npx tsx scripts/migrate-bulk-uploads-to-blob.ts [--dry-run]
 */

import { prisma } from '../src/lib/prisma';
import { uploadToBlob } from '../src/lib/blob-storage';

const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  console.log('🚀 Starting BulkUpload migration to Blob storage...');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no changes will be made)' : 'LIVE'}\n`);

  // Find all BulkUpload records that haven't been migrated yet
  const unmigrated = await prisma.bulkUpload.findMany({
    where: {
      fileUrl: null, // Not yet migrated
      rawFile: { not: null }, // Has raw file data
    },
    select: {
      id: true,
      filename: true,
      rawFile: true,
      uploadedAt: true,
    },
  });

  console.log(`Found ${unmigrated.length} records to migrate\n`);

  if (unmigrated.length === 0) {
    console.log('✅ No records need migration. All done!');
    return;
  }

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < unmigrated.length; i++) {
    const upload = unmigrated[i];
    console.log(`[${i + 1}/${unmigrated.length}] Processing: ${upload.filename}`);

    try {
      if (!upload.rawFile) {
        console.log('  ⚠️  Skipping: No rawFile data');
        continue;
      }

      const rawFileBuffer = Buffer.from(upload.rawFile);
      console.log(`  📦 File size: ${(rawFileBuffer.length / 1024).toFixed(2)} KB`);

      if (DRY_RUN) {
        console.log('  🔵 DRY RUN: Would upload to Blob storage');
      } else {
        // Upload to Blob
        const blobMetadata = await uploadToBlob(rawFileBuffer, upload.filename, {
          contentType: 'text/csv',
          generatePreview: true,
          previewLineCount: 20,
        });

        console.log(`  ✅ Uploaded to Blob: ${blobMetadata.url}`);
        console.log(`  🔐 SHA-256: ${blobMetadata.sha256}`);

        // Update database record
        await prisma.bulkUpload.update({
          where: { id: upload.id },
          data: {
            fileUrl: blobMetadata.url,
            fileSize: blobMetadata.size,
            fileSha256: blobMetadata.sha256,
            contentType: blobMetadata.contentType,
            previewLines: blobMetadata.previewLines,
            // Note: Not removing rawFile yet - that will be done in a future migration
          },
        });

        console.log('  💾 Database updated\n');
      }

      successCount++;
    } catch (error) {
      console.error(`  ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
      errorCount++;
    }
  }

  console.log('\n📊 Migration Summary:');
  console.log(`  ✅ Successful: ${successCount}`);
  console.log(`  ❌ Failed: ${errorCount}`);
  console.log(`  📋 Total: ${unmigrated.length}`);

  if (DRY_RUN) {
    console.log('\n💡 This was a dry run. Run without --dry-run to apply changes.');
  } else if (errorCount === 0) {
    console.log('\n✨ All records migrated successfully!');
    console.log('\n📝 Next Steps:');
    console.log('  1. Verify all fileUrl fields are populated:');
    console.log('     SELECT COUNT(*) FROM "BulkUpload" WHERE "fileUrl" IS NULL;');
    console.log('  2. Once verified, create a migration to:');
    console.log('     - Make fileUrl/fileSize/fileSha256 NOT NULL');
    console.log('     - Drop rawFile column');
  }
}

main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });

