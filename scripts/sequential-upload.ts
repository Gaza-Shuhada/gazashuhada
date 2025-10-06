import { prisma } from '../src/lib/prisma';
import { parseCSV } from '../src/lib/csv-utils';
import { applyBulkUpload } from '../src/lib/bulk-upload-service-ultra-optimized';
import * as fs from 'fs';
import * as path from 'path';

interface UploadStats {
  file: string;
  dateReleased: Date;
  inserts: number;
  updates: number;
  deletes: number;
  totalRecords: number;
  duration: number;
}

const CSV_FILES = [
  { file: '2024-01-05.csv', label: 'MOH Update - January 5, 2024', dateReleased: new Date('2024-01-05') },
  { file: '2024-03-29.csv', label: 'MOH Update - March 29, 2024', dateReleased: new Date('2024-03-29') },
  { file: '2024-04-30.csv', label: 'MOH Update - April 30, 2024', dateReleased: new Date('2024-04-30') },
  { file: '2024-06-30.csv', label: 'MOH Update - June 30, 2024', dateReleased: new Date('2024-06-30') },
  { file: '2024-08-31.csv', label: 'MOH Update - August 31, 2024', dateReleased: new Date('2024-08-31') },
  { file: '2025-03-23.csv', label: 'MOH Update - March 23, 2025', dateReleased: new Date('2025-03-23') },
  { file: '2025-06-15.csv', label: 'MOH Update - June 15, 2025', dateReleased: new Date('2025-06-15') },
  { file: '2025-07-15.csv', label: 'MOH Update - July 15, 2025', dateReleased: new Date('2025-07-15') },
  { file: '2025-07-31.csv', label: 'MOH Update - July 31, 2025', dateReleased: new Date('2025-07-31') },
];

async function clearAllData() {
  console.log('🗑️  Clearing all existing data...\n');
  
  try {
    // Delete in correct order due to foreign key constraints
    await prisma.communitySubmission.deleteMany({});
    console.log('   ✓ Cleared CommunitySubmission');
    
    await prisma.personVersion.deleteMany({});
    console.log('   ✓ Cleared PersonVersion');
    
    await prisma.person.deleteMany({});
    console.log('   ✓ Cleared Person');
    
    await prisma.bulkUpload.deleteMany({});
    console.log('   ✓ Cleared BulkUpload');
    
    await prisma.changeSource.deleteMany({});
    console.log('   ✓ Cleared ChangeSource');
    
    await prisma.auditLog.deleteMany({});
    console.log('   ✓ Cleared AuditLog');
    
    console.log('\n✅ All data cleared successfully!\n');
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    throw error;
  }
}

async function uploadCSVFile(
  filePath: string,
  label: string,
  dateReleased: Date
): Promise<{ inserts: number; updates: number; deletes: number; totalRecords: number }> {
  const csvContent = fs.readFileSync(filePath, 'utf-8');
  const rows = parseCSV(csvContent);
  const rawFile = fs.readFileSync(filePath);
  const filename = path.basename(filePath);
  
  // Get counts before upload
  const beforeCount = await prisma.person.count({ where: { isDeleted: false } });
  
  // Apply the upload
  await applyBulkUpload(rows, filename, rawFile, label, dateReleased);
  
  // Get counts after upload
  const afterCount = await prisma.person.count({ where: { isDeleted: false } });
  
  // Get version counts by change type for this upload
  const latestUpload = await prisma.bulkUpload.findFirst({
    orderBy: { uploadedAt: 'desc' },
    include: {
      changeSource: {
        include: {
          versions: {
            select: { changeType: true }
          }
        }
      }
    }
  });
  
  const versions = latestUpload?.changeSource.versions || [];
  const inserts = versions.filter(v => v.changeType === 'INSERT').length;
  const updates = versions.filter(v => v.changeType === 'UPDATE').length;
  const deletes = versions.filter(v => v.changeType === 'DELETE').length;
  
  return {
    inserts,
    updates,
    deletes,
    totalRecords: rows.length
  };
}

async function main() {
  console.log('='.repeat(80));
  console.log('SEQUENTIAL MOH CSV UPLOAD');
  console.log('='.repeat(80));
  console.log('');
  
  // Step 1: Clear all data
  await clearAllData();
  
  // Step 2: Upload all CSV files sequentially
  const stats: UploadStats[] = [];
  const mohDir = path.join(process.cwd(), 'moh-updates');
  
  console.log('📤 Starting sequential uploads...\n');
  
  for (let i = 0; i < CSV_FILES.length; i++) {
    const { file, label, dateReleased } = CSV_FILES[i];
    const filePath = path.join(mohDir, file);
    
    console.log(`[${i + 1}/${CSV_FILES.length}] Uploading ${file}...`);
    
    const startTime = Date.now();
    
    try {
      const result = await uploadCSVFile(filePath, label, dateReleased);
      const duration = Date.now() - startTime;
      
      stats.push({
        file,
        dateReleased,
        inserts: result.inserts,
        updates: result.updates,
        deletes: result.deletes,
        totalRecords: result.totalRecords,
        duration
      });
      
      console.log(`   ✓ Complete: +${result.inserts} inserts, ~${result.updates} updates, -${result.deletes} deletes (${(duration / 1000).toFixed(1)}s)\n`);
      
    } catch (error) {
      console.error(`   ✗ Failed:`, error);
      throw error;
    }
  }
  
  // Step 3: Display summary
  console.log('='.repeat(80));
  console.log('UPLOAD SUMMARY');
  console.log('='.repeat(80));
  console.log('');
  
  console.log('┌────────────────────┬──────────┬─────────┬─────────┬─────────┬──────────┐');
  console.log('│ Date Released      │ Records  │ Inserts │ Updates │ Deletes │ Duration │');
  console.log('├────────────────────┼──────────┼─────────┼─────────┼─────────┼──────────┤');
  
  let totalInserts = 0;
  let totalUpdates = 0;
  let totalDeletes = 0;
  let totalDuration = 0;
  
  for (const stat of stats) {
    const dateStr = stat.dateReleased.toISOString().split('T')[0].padEnd(18);
    const recordsStr = stat.totalRecords.toLocaleString().padStart(8);
    const insertsStr = stat.inserts.toLocaleString().padStart(7);
    const updatesStr = stat.updates.toLocaleString().padStart(7);
    const deletesStr = stat.deletes.toLocaleString().padStart(7);
    const durationStr = `${(stat.duration / 1000).toFixed(1)}s`.padStart(8);
    
    console.log(`│ ${dateStr} │ ${recordsStr} │ ${insertsStr} │ ${updatesStr} │ ${deletesStr} │ ${durationStr} │`);
    
    totalInserts += stat.inserts;
    totalUpdates += stat.updates;
    totalDeletes += stat.deletes;
    totalDuration += stat.duration;
  }
  
  console.log('├────────────────────┼──────────┼─────────┼─────────┼─────────┼──────────┤');
  console.log(`│ ${'TOTAL'.padEnd(18)} │ ${' '.repeat(8)} │ ${totalInserts.toLocaleString().padStart(7)} │ ${totalUpdates.toLocaleString().padStart(7)} │ ${totalDeletes.toLocaleString().padStart(7)} │ ${(totalDuration / 1000).toFixed(1)}s`.padStart(8) + ' │');
  console.log('└────────────────────┴──────────┴─────────┴─────────┴─────────┴──────────┘');
  console.log('');
  
  // Final database stats
  const finalCount = await prisma.person.count({ where: { isDeleted: false } });
  const totalVersions = await prisma.personVersion.count();
  const totalUploads = await prisma.bulkUpload.count();
  
  console.log('📊 Final Database Statistics:');
  console.log(`   Active persons: ${finalCount.toLocaleString()}`);
  console.log(`   Total versions: ${totalVersions.toLocaleString()}`);
  console.log(`   Bulk uploads: ${totalUploads}`);
  console.log('');
  
  console.log('✅ ALL UPLOADS COMPLETED SUCCESSFULLY!');
  console.log('');
}

main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

