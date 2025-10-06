import { prisma } from '../src/lib/prisma';
import { parseCSV } from '../src/lib/csv-utils';
import { simulateBulkUpload, applyBulkUpload } from '../src/lib/bulk-upload-service-ultra-optimized';
import * as fs from 'fs';
import * as path from 'path';

interface UploadResult {
  file: string;
  dateReleased: Date;
  label: string;
  inserts: number;
  updates: number;
  deletes: number;
  totalInFile: number;
  databaseCount: number;
  duration: number;
  withEnglishNames: number;
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

async function clearDatabase() {
  console.log('🗑️  Clearing database...\n');
  
  await prisma.communitySubmission.deleteMany({});
  await prisma.personVersion.deleteMany({});
  await prisma.person.deleteMany({});
  await prisma.bulkUpload.deleteMany({});
  await prisma.changeSource.deleteMany({});
  
  console.log('✅ Database cleared\n');
}

async function uploadFile(
  filePath: string,
  label: string,
  dateReleased: Date
): Promise<{
  inserts: number;
  updates: number;
  deletes: number;
  totalInFile: number;
  withEnglishNames: number;
}> {
  // Read and parse CSV (same as API endpoint does)
  const csvContent = fs.readFileSync(filePath, 'utf-8');
  const rows = parseCSV(csvContent);
  
  // Count English names in the upload
  const withEnglishNames = rows.filter(r => r.name_english !== null).length;
  
  // Step 1: Simulate (same as clicking "Simulate" button)
  const simulation = await simulateBulkUpload(rows);
  
  // Step 2: Apply (same as clicking "Apply" button)
  const rawFile = fs.readFileSync(filePath);
  const filename = path.basename(filePath);
  await applyBulkUpload(rows, filename, rawFile, label, dateReleased);
  
  return {
    inserts: simulation.summary.inserts,
    updates: simulation.summary.updates,
    deletes: simulation.summary.deletes,
    totalInFile: rows.length,
    withEnglishNames,
  };
}

async function validateDatabase() {
  const totalPersons = await prisma.person.count({ where: { isDeleted: false } });
  const withEnglish = await prisma.person.count({ 
    where: { 
      isDeleted: false,
      nameEnglish: { not: null }
    } 
  });
  const totalVersions = await prisma.personVersion.count();
  const totalUploads = await prisma.bulkUpload.count();
  
  const changeTypes = await prisma.personVersion.groupBy({
    by: ['changeType'],
    _count: { changeType: true }
  });
  
  return {
    totalPersons,
    withEnglish,
    totalVersions,
    totalUploads,
    changeTypes,
  };
}

async function main() {
  console.log('='.repeat(80));
  console.log('AUTOMATED MOH CSV UPLOAD TEST');
  console.log('Testing actual application flow (simulate → apply)');
  console.log('='.repeat(80));
  console.log('');
  
  // Clear database first
  await clearDatabase();
  
  // Upload all files
  const results: UploadResult[] = [];
  const mohDir = path.join(process.cwd(), 'moh-updates');
  
  console.log('📤 Starting sequential uploads...\n');
  console.log('='.repeat(80));
  console.log('');
  
  for (let i = 0; i < CSV_FILES.length; i++) {
    const { file, label, dateReleased } = CSV_FILES[i];
    const filePath = path.join(mohDir, file);
    
    console.log(`📁 Upload ${i + 1}/${CSV_FILES.length}: ${file}`);
    console.log(`   Label: ${label}`);
    console.log(`   Date: ${dateReleased.toISOString().split('T')[0]}`);
    
    const startTime = Date.now();
    
    try {
      const stats = await uploadFile(filePath, label, dateReleased);
      const duration = Date.now() - startTime;
      
      // Get current database count
      const dbCount = await prisma.person.count({ where: { isDeleted: false } });
      
      results.push({
        file,
        dateReleased,
        label,
        inserts: stats.inserts,
        updates: stats.updates,
        deletes: stats.deletes,
        totalInFile: stats.totalInFile,
        databaseCount: dbCount,
        duration,
        withEnglishNames: stats.withEnglishNames,
      });
      
      console.log(`   ✅ Simulation: +${stats.inserts} inserts, ~${stats.updates} updates, -${stats.deletes} deletes`);
      console.log(`   ✅ Applied: ${stats.totalInFile.toLocaleString()} records processed`);
      console.log(`   📊 Database now has: ${dbCount.toLocaleString()} active persons`);
      if (stats.withEnglishNames > 0) {
        console.log(`   🌐 English names: ${stats.withEnglishNames.toLocaleString()} (${(stats.withEnglishNames / stats.totalInFile * 100).toFixed(1)}%)`);
      }
      console.log(`   ⏱️  Duration: ${(duration / 1000).toFixed(2)}s`);
      console.log('');
      
    } catch (error) {
      console.error(`   ❌ Failed: ${error}`);
      throw error;
    }
  }
  
  console.log('='.repeat(80));
  console.log('UPLOAD SUMMARY');
  console.log('='.repeat(80));
  console.log('');
  
  // Display results table
  console.log('┌─────┬────────────────────┬──────────┬─────────┬─────────┬─────────┬────────────┬──────────┐');
  console.log('│  #  │ Date Released      │ In File  │ Inserts │ Updates │ Deletes │ DB Total   │ Duration │');
  console.log('├─────┼────────────────────┼──────────┼─────────┼─────────┼─────────┼────────────┼──────────┤');
  
  let totalInserts = 0;
  let totalUpdates = 0;
  let totalDeletes = 0;
  let totalDuration = 0;
  
  results.forEach((result, idx) => {
    const num = (idx + 1).toString().padStart(3);
    const date = result.dateReleased.toISOString().split('T')[0].padEnd(18);
    const inFile = result.totalInFile.toLocaleString().padStart(8);
    const inserts = result.inserts.toLocaleString().padStart(7);
    const updates = result.updates.toLocaleString().padStart(7);
    const deletes = result.deletes.toLocaleString().padStart(7);
    const dbTotal = result.databaseCount.toLocaleString().padStart(10);
    const duration = `${(result.duration / 1000).toFixed(1)}s`.padStart(8);
    
    console.log(`│ ${num} │ ${date} │ ${inFile} │ ${inserts} │ ${updates} │ ${deletes} │ ${dbTotal} │ ${duration} │`);
    
    totalInserts += result.inserts;
    totalUpdates += result.updates;
    totalDeletes += result.deletes;
    totalDuration += result.duration;
  });
  
  console.log('├─────┼────────────────────┼──────────┼─────────┼─────────┼─────────┼────────────┼──────────┤');
  const totalLabel = 'TOTALS'.padEnd(18);
  console.log(`│     │ ${totalLabel} │          │ ${totalInserts.toLocaleString().padStart(7)} │ ${totalUpdates.toLocaleString().padStart(7)} │ ${totalDeletes.toLocaleString().padStart(7)} │            │ ${(totalDuration / 1000).toFixed(1)}s`.padStart(8) + ' │');
  console.log('└─────┴────────────────────┴──────────┴─────────┴─────────┴─────────┴────────────┴──────────┘');
  console.log('');
  
  // Validate final database state
  console.log('='.repeat(80));
  console.log('DATABASE VALIDATION');
  console.log('='.repeat(80));
  console.log('');
  
  const validation = await validateDatabase();
  
  console.log('📊 Final Database State:');
  console.log(`   Active Persons: ${validation.totalPersons.toLocaleString()}`);
  console.log(`   With English Names: ${validation.withEnglish.toLocaleString()} (${(validation.withEnglish / validation.totalPersons * 100).toFixed(1)}%)`);
  console.log(`   Total Versions: ${validation.totalVersions.toLocaleString()}`);
  console.log(`   Bulk Uploads: ${validation.totalUploads}`);
  console.log('');
  
  console.log('📈 Change Type Breakdown:');
  validation.changeTypes.forEach(ct => {
    console.log(`   ${ct.changeType}: ${ct._count.changeType.toLocaleString()}`);
  });
  console.log('');
  
  // English name coverage by upload
  console.log('🌐 English Name Coverage by Upload:');
  results.forEach((result, idx) => {
    const coverage = result.withEnglishNames > 0 
      ? `${result.withEnglishNames.toLocaleString()} (${(result.withEnglishNames / result.totalInFile * 100).toFixed(1)}%)`
      : 'None';
    console.log(`   ${idx + 1}. ${result.file.padEnd(20)} → ${coverage}`);
  });
  console.log('');
  
  // Sample records
  console.log('📋 Sample Records with English Names:');
  const sampleRecords = await prisma.person.findMany({
    where: { 
      nameEnglish: { not: null },
      isDeleted: false 
    },
    select: {
      externalId: true,
      name: true,
      nameEnglish: true,
      gender: true,
      dateOfBirth: true,
    },
    take: 5,
  });
  
  sampleRecords.forEach((record, idx) => {
    console.log(`   ${idx + 1}. ID: ${record.externalId}`);
    console.log(`      Arabic:  ${record.name}`);
    console.log(`      English: ${record.nameEnglish}`);
    console.log(`      Gender:  ${record.gender}`);
    console.log(`      DOB:     ${record.dateOfBirth ? record.dateOfBirth.toISOString().split('T')[0] : 'null'}`);
    console.log('');
  });
  
  // Validation checks
  console.log('='.repeat(80));
  console.log('VALIDATION CHECKS');
  console.log('='.repeat(80));
  console.log('');
  
  const checks = [];
  
  // Check 1: Final count matches last file
  const lastUpload = results[results.length - 1];
  const countMatch = validation.totalPersons === lastUpload.totalInFile;
  checks.push({
    name: 'Final person count matches last file',
    expected: lastUpload.totalInFile,
    actual: validation.totalPersons,
    passed: countMatch,
  });
  
  // Check 2: Total inserts equal final count
  const insertsMatch = totalInserts === validation.totalPersons;
  checks.push({
    name: 'Total inserts equal final person count',
    expected: validation.totalPersons,
    actual: totalInserts,
    passed: insertsMatch,
  });
  
  // Check 3: English names coverage
  const expectedEnglishCoverage = 64; // approximately 64.8%
  const actualEnglishCoverage = (validation.withEnglish / validation.totalPersons * 100);
  const englishCoverageOk = actualEnglishCoverage >= expectedEnglishCoverage && actualEnglishCoverage <= 70;
  checks.push({
    name: 'English name coverage (~65%)',
    expected: `${expectedEnglishCoverage}%+`,
    actual: `${actualEnglishCoverage.toFixed(1)}%`,
    passed: englishCoverageOk,
  });
  
  // Check 4: No deletions
  const noDeletions = totalDeletes === 0;
  checks.push({
    name: 'No records deleted (cumulative data)',
    expected: 0,
    actual: totalDeletes,
    passed: noDeletions,
  });
  
  // Check 5: All uploads completed
  const allUploadsCompleted = validation.totalUploads === CSV_FILES.length;
  checks.push({
    name: 'All bulk uploads recorded',
    expected: CSV_FILES.length,
    actual: validation.totalUploads,
    passed: allUploadsCompleted,
  });
  
  checks.forEach(check => {
    const icon = check.passed ? '✅' : '❌';
    const status = check.passed ? 'PASS' : 'FAIL';
    console.log(`${icon} ${status}: ${check.name}`);
    console.log(`   Expected: ${check.expected}`);
    console.log(`   Actual:   ${check.actual}`);
    console.log('');
  });
  
  const allPassed = checks.every(c => c.passed);
  
  console.log('='.repeat(80));
  if (allPassed) {
    console.log('✅ ALL VALIDATION CHECKS PASSED!');
    console.log('');
    console.log('🎉 System is working correctly!');
    console.log('   - All 9 MOH CSV files uploaded successfully');
    console.log('   - Data integrity validated');
    console.log('   - English names imported correctly');
    console.log('   - Ready for production use!');
  } else {
    console.log('❌ SOME VALIDATION CHECKS FAILED');
    console.log('');
    console.log('Please review the failed checks above.');
  }
  console.log('='.repeat(80));
  console.log('');
}

main()
  .catch((error) => {
    console.error('');
    console.error('❌ Fatal error:', error);
    console.error('');
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

