import { prisma } from '../src/lib/prisma';

async function clearDatabase() {
  console.log('⚠️  DATABASE CLEARING SCRIPT');
  console.log('='.repeat(60));
  console.log('');
  console.log('This will DELETE ALL DATA from the database!');
  console.log('');
  console.log('Tables to be cleared:');
  console.log('  - CommunitySubmission');
  console.log('  - PersonVersion');
  console.log('  - Person');
  console.log('  - BulkUpload');
  console.log('  - ChangeSource');
  console.log('');
  
  // Give user 3 seconds to cancel
  console.log('Starting in 3 seconds... (Press Ctrl+C to cancel)');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  console.log('');
  console.log('🗑️  Clearing data...\n');
  
  try {
    // Delete in correct order due to foreign key constraints
    const communityCount = await prisma.communitySubmission.deleteMany({});
    console.log(`   ✓ Cleared ${communityCount.count} CommunitySubmission records`);
    
    const versionCount = await prisma.personVersion.deleteMany({});
    console.log(`   ✓ Cleared ${versionCount.count} PersonVersion records`);
    
    const personCount = await prisma.person.deleteMany({});
    console.log(`   ✓ Cleared ${personCount.count} Person records`);
    
    const uploadCount = await prisma.bulkUpload.deleteMany({});
    console.log(`   ✓ Cleared ${uploadCount.count} BulkUpload records`);
    
    const sourceCount = await prisma.changeSource.deleteMany({});
    console.log(`   ✓ Cleared ${sourceCount.count} ChangeSource records`);
    
    console.log('');
    console.log('✅ Database cleared successfully!');
    console.log('');
    console.log('You can now start fresh uploads through the UI.');
    console.log('');
    
  } catch (error) {
    console.error('');
    console.error('❌ Error clearing database:', error);
    console.error('');
    throw error;
  }
}

clearDatabase()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

