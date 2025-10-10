import { prisma } from './prisma';
import { BulkUploadRow } from './csv-utils';
import { ChangeType, Gender } from '@prisma/client';

/**
 * ==================================================================================
 * CONFIGURATION - Batch Sizes for Large Dataset Operations
 * ==================================================================================
 * 
 * These constants control how large CSV uploads are processed in batches to avoid
 * hitting PostgreSQL and Prisma limits.
 * 
 * IMPORTANT LIMITS:
 * - PostgreSQL: Max 32,767 bind variables per query (e.g., WHERE id IN (...))
 * - Prisma: Recommended max ~10,000 records per createMany/updateMany operation
 * - Next.js: API route timeout (see next.config.js maxDuration settings)
 * 
 * Adjust these values based on your database performance and record complexity.
 */

/**
 * SELECT Query Batch Size
 * Used for: Fetching existing persons by external IDs
 * Limit reason: PostgreSQL bind variable limit (32,767)
 */
const MAX_BATCH_SIZE = 10000;

/**
 * INSERT Operation Batch Size
 * Used for: createMany() and createManyAndReturn() operations
 * Limit reason: Balance between performance and memory usage
 */
const INSERT_BATCH_SIZE = 5000;

/**
 * UPDATE Operation Batch Size
 * Used for: Updating existing person records in transactions
 * Limit reason: Smaller batches to avoid transaction timeouts
 */
const UPDATE_BATCH_SIZE = 100;

/**
 * DELETE Operation Batch Size
 * Used for: Soft-deleting persons (isDeleted = true) in transactions
 * Limit reason: Smaller batches to avoid transaction timeouts
 * Note: Currently not used as we now mark records as unconfirmed instead of deleting
 */
// const DELETE_BATCH_SIZE = 100;

/**
 * Helper function to batch large arrays and query in chunks
 * This prevents hitting PostgreSQL's 32767 bind variable limit
 */
async function fetchPersonsInBatches(externalIds: string[]) {
  if (externalIds.length <= MAX_BATCH_SIZE) {
    // No batching needed - fetch ALL records (including deleted ones)
    return await prisma.person.findMany({
      where: { 
        externalId: { in: externalIds }
        // Don't filter by isDeleted - we need to know about ALL existing records
      },
      select: { externalId: true, name: true, nameEnglish: true, gender: true, dateOfBirth: true, isDeleted: true },
    });
  }

  // Batch the query
  const results = [];
  for (let i = 0; i < externalIds.length; i += MAX_BATCH_SIZE) {
    const batch = externalIds.slice(i, i + MAX_BATCH_SIZE);
    const batchResults = await prisma.person.findMany({
      where: { 
        externalId: { in: batch }
        // Don't filter by isDeleted - we need to know about ALL existing records
      },
      select: { externalId: true, name: true, nameEnglish: true, gender: true, dateOfBirth: true, isDeleted: true },
    });
    results.push(...batchResults);
    console.log(`  Fetched batch ${Math.floor(i / MAX_BATCH_SIZE) + 1} (${batchResults.length} records)`);
  }
  return results;
}

/**
 * Helper function to batch large arrays and query in chunks (for full person data)
 */
async function fetchFullPersonsInBatches(externalIds: string[]) {
  if (externalIds.length <= MAX_BATCH_SIZE) {
    // No batching needed - fetch ALL records (including deleted ones)
    return await prisma.person.findMany({
      where: { 
        externalId: { in: externalIds }
        // Don't filter by isDeleted - we need to know about ALL existing records
      },
      select: {
        id: true,
        externalId: true,
        name: true,
        nameEnglish: true,
        gender: true,
        dateOfBirth: true,
        dateOfDeath: true,
        locationOfDeathLat: true,
        locationOfDeathLng: true,
        isDeleted: true, // Include this so we can check if it's deleted
      },
    });
  }

  // Batch the query
  const results = [];
  for (let i = 0; i < externalIds.length; i += MAX_BATCH_SIZE) {
    const batch = externalIds.slice(i, i + MAX_BATCH_SIZE);
    const batchResults = await prisma.person.findMany({
      where: { 
        externalId: { in: batch }
        // Don't filter by isDeleted - we need to know about ALL existing records
      },
      select: {
        id: true,
        externalId: true,
        name: true,
        nameEnglish: true,
        gender: true,
        dateOfBirth: true,
        dateOfDeath: true,
        locationOfDeathLat: true,
        locationOfDeathLng: true,
        isDeleted: true, // Include this so we can check if it's deleted
      },
    });
    results.push(...batchResults);
    console.log(`  Fetched batch ${Math.floor(i / MAX_BATCH_SIZE) + 1} (${batchResults.length} records)`);
  }
  return results;
}

// Type for existing Person records fetched from database
interface ExistingPerson {
  id: string;
  externalId: string;
  name: string;
  nameEnglish: string | null;
  gender: Gender;
  dateOfBirth: Date | null;
  dateOfDeath: Date | null;
  locationOfDeathLat: number | null;
  locationOfDeathLng: number | null;
  isDeleted: boolean;
}

// Same interfaces as before...
export interface DiffItem {
  externalId: string;
  changeType: ChangeType;
  current?: {
    name: string;
    nameEnglish: string | null;
    gender: Gender;
    dateOfBirth: Date | null;
  };
  incoming: {
    name: string;
    nameEnglish: string | null;
    gender: Gender;
    dateOfBirth: Date | null;
  };
}

export interface SimulationResult {
  summary: {
    totalIncoming: number;
    inserts: number;
    updates: number;
    deletes: number;
  };
  deletions: DiffItem[];
  updates: DiffItem[];
  sampleInserts: DiffItem[];
}

export async function simulateBulkUpload(rows: BulkUploadRow[]): Promise<SimulationResult> {
  const incomingIds = rows.map(r => r.external_id);
  const incomingIdsSet = new Set(incomingIds);
  
  console.log(`  Simulating bulk upload with ${rows.length} rows...`);
  
  // SMART FETCHING: First get just IDs (lightweight), then fetch full data only for what we need
  console.log('  📊 Fetching existing IDs from database...');
  const allExistingIds = await prisma.person.findMany({
    where: { isDeleted: false },
    select: { externalId: true },
  });
  const existingIdsSet = new Set(allExistingIds.map(p => p.externalId));
  
  // Only fetch full records for IDs that exist in the CSV (potential updates)
  const idsToFetch = rows.filter(r => existingIdsSet.has(r.external_id)).map(r => r.external_id);
  console.log(`  📦 Fetching ${idsToFetch.length} full records for comparison (only potential updates)`);
  
  const matchingPersons = idsToFetch.length > 0 ? await fetchPersonsInBatches(idsToFetch) : [];
  const existingMap = new Map(matchingPersons.map(p => [p.externalId, p]));
  
  const insertDiffs: DiffItem[] = [];
  const updateDiffs: DiffItem[] = [];
  const deleteDiffs: DiffItem[] = []; // Actually "unconfirmed" - records marked as no longer MoH-confirmed
  
  for (const row of rows) {
    const existing = existingMap.get(row.external_id);
    const incomingDate = row.date_of_birth ? new Date(row.date_of_birth) : null;
    
    if (!existing) {
      // Truly new record - no existing record with this externalId
      insertDiffs.push({
        externalId: row.external_id,
        changeType: ChangeType.INSERT,
        incoming: {
          name: row.name,
          nameEnglish: row.name_english,
          gender: row.gender,
          dateOfBirth: incomingDate,
        },
      });
    } else {
      // Record exists (either active or deleted)
      const existingDate = existing.dateOfBirth ? new Date(existing.dateOfBirth) : null;
      const isDifferent = 
        existing.name !== row.name ||
        existing.nameEnglish !== row.name_english ||
        existing.gender !== row.gender ||
        (existingDate?.getTime() !== incomingDate?.getTime()) ||
        existing.isDeleted; // If deleted, we need to un-delete it
      
      if (isDifferent) {
        updateDiffs.push({
          externalId: row.external_id,
          changeType: ChangeType.UPDATE,
          current: {
            name: existing.name,
            nameEnglish: existing.nameEnglish,
            gender: existing.gender,
            dateOfBirth: existing.dateOfBirth,
          },
          incoming: {
            name: row.name,
            nameEnglish: row.name_english,
            gender: row.gender,
            dateOfBirth: incomingDate,
          },
        });
      }
    }
  }
  
  // Mark removed records as deleted
  // Records not in the new MoH upload should be marked isDeleted = true
  const idsToDelete = allExistingIds.filter(e => !incomingIdsSet.has(e.externalId)).map(e => e.externalId);
  
  if (idsToDelete.length > 0) {
    console.log(`  📦 Fetching ${idsToDelete.length} records for deletion`);
    const personsToDelete = await fetchPersonsInBatches(idsToDelete);
    
    for (const existing of personsToDelete) {
      if (!existing.isDeleted) {
        deleteDiffs.push({
          externalId: existing.externalId,
          changeType: ChangeType.DELETE,
          current: {
            name: existing.name,
            nameEnglish: existing.nameEnglish,
            gender: existing.gender,
            dateOfBirth: existing.dateOfBirth,
          },
          incoming: {
            name: existing.name,
            nameEnglish: existing.nameEnglish,
            gender: existing.gender,
            dateOfBirth: existing.dateOfBirth,
          },
        });
      }
    }
  }
  
  return {
    summary: {
      totalIncoming: rows.length,
      inserts: insertDiffs.length,
      updates: updateDiffs.length,
      deletes: deleteDiffs.length,
    },
    deletions: deleteDiffs,
    updates: updateDiffs,
    sampleInserts: insertDiffs.slice(0, 10),
  };
}

/**
 * ULTRA-OPTIMIZED VERSION: Uses bulk operations for massive speed improvement
 * This approach uses createMany/updateMany which is 50-100x faster than individual inserts
 */
export async function applyBulkUpload(
  rows: BulkUploadRow[],
  filename: string,
  blobUrl: string,
  blobMetadata: { size: number; sha256: string; contentType: string; previewLines?: string | null },
  comment: string | null,
  dateReleased: Date,
  simulationSummary?: { inserts: number; updates: number; deletes: number }
): Promise<{ uploadId: string; changeSourceId: string }> {
  const incomingIds = rows.map(r => r.external_id);
  const incomingIdsSet = new Set(incomingIds);
  
  console.log(`  Applying bulk upload with ${rows.length} rows...`);
  
  // OPTIMIZATION: If simulation detected 0 changes, skip expensive DB queries
  const hasChanges = !simulationSummary || 
    simulationSummary.inserts > 0 || 
    simulationSummary.updates > 0 || 
    simulationSummary.deletes > 0;
  
  if (!hasChanges) {
    console.log('  ⚡ No changes detected - skipping database operations');
  }
  
  // SMART FETCHING: Only fetch what we actually need
  let toInsert: BulkUploadRow[];
  let toUpdate: Array<{ existing: ExistingPerson; row: BulkUploadRow }>;
  let toDelete: ExistingPerson[];
  
  if (hasChanges) {
    // Initialize arrays
    toInsert = [];
    toUpdate = [];
    
    // Step 1: Get lightweight ID-only list from database (very fast)
    console.log('  📊 Fetching existing IDs from database...');
    const existingIds = await prisma.person.findMany({
      where: { isDeleted: false },
      select: { externalId: true }
    });
    const existingIdsSet = new Set(existingIds.map(p => p.externalId));
    
    // Step 2: Determine which IDs need updating vs inserting
    const idsToUpdate = rows.filter(r => existingIdsSet.has(r.external_id)).map(r => r.external_id);
    const idsToDelete = existingIds.filter(e => !incomingIdsSet.has(e.externalId)).map(e => e.externalId);
    
    console.log(`  📊 ID analysis: ${idsToUpdate.length} potential updates, ${rows.length - idsToUpdate.length} inserts, ${idsToDelete.length} deletes`);
    
    // Step 3: Only fetch full records for IDs that need updating or deleting
    const idsToFetch = [...idsToUpdate, ...idsToDelete];
    const personsToCheck = idsToFetch.length > 0 ? await fetchFullPersonsInBatches(idsToFetch) : [];
    
    console.log(`  📦 Fetched ${personsToCheck.length} full records (only what's needed)`);
    
    const existingMap = new Map(personsToCheck.map(p => [p.externalId, p]));
    
    // Step 4: Build update and delete lists
    for (const row of rows) {
      const existing = existingMap.get(row.external_id);
      
      if (!existing) {
        // New record - insert it
        toInsert.push(row);
      } else {
        // Existing record - check if it needs updating
        const incomingDate = row.date_of_birth ? new Date(row.date_of_birth) : null;
        const existingDate = existing.dateOfBirth ? new Date(existing.dateOfBirth) : null;
        const isDifferent = 
          existing.name !== row.name ||
          existing.nameEnglish !== row.name_english ||
          existing.gender !== row.gender ||
          (existingDate?.getTime() !== incomingDate?.getTime()) ||
          existing.isDeleted;
        
        if (isDifferent) {
          toUpdate.push({ existing, row });
        }
      }
    }
    
    // Step 5: Prepare deletions
    toDelete = personsToCheck.filter(p => 
      !incomingIdsSet.has(p.externalId) && !p.isDeleted
    );
  } else {
    // No changes - initialize empty arrays
    toInsert = [];
    toUpdate = [];
    toDelete = [];
  }
  
  // Create metadata (blob already uploaded during simulation)
  const changeSource = await prisma.changeSource.create({
    data: {
      type: 'BULK_UPLOAD',
      description: `Bulk upload: ${filename}`,
    },
  });
  
  const bulkUpload = await prisma.bulkUpload.create({
    data: {
      changeSourceId: changeSource.id,
      filename,
      comment,
      dateReleased,
      // Use existing blob URL from simulation
      fileUrl: blobUrl,
      fileSize: blobMetadata.size,
      fileSha256: blobMetadata.sha256,
      contentType: blobMetadata.contentType,
      previewLines: blobMetadata.previewLines,
    },
  });
  
  console.log(`  ✅ Bulk operations determined: ${toInsert.length} inserts, ${toUpdate.length} updates, ${toDelete.length} deletes`);
  
  // BULK INSERT - Batched to handle large datasets
  if (toInsert.length > 0) {
    const allInsertedPersons = [];
    
    for (let i = 0; i < toInsert.length; i += INSERT_BATCH_SIZE) {
      const batch = toInsert.slice(i, Math.min(i + INSERT_BATCH_SIZE, toInsert.length));
      
      // Insert persons in bulk (batch)
      const insertedPersons = await prisma.person.createManyAndReturn({
        data: batch.map(row => ({
          externalId: row.external_id,
          name: row.name,
          nameEnglish: row.name_english,
          gender: row.gender,
          dateOfBirth: row.date_of_birth ? new Date(row.date_of_birth) : null,
        })),
      });
      
      allInsertedPersons.push(...insertedPersons);
      
      // Create versions in bulk (batch)
      await prisma.personVersion.createMany({
        data: insertedPersons.map(person => ({
          personId: person.id,
          externalId: person.externalId,
          name: person.name,
          nameEnglish: person.nameEnglish,
          gender: person.gender,
          dateOfBirth: person.dateOfBirth,
          versionNumber: 1,
          sourceId: changeSource.id,
          changeType: ChangeType.INSERT,
        })),
      });
      
      console.log(`  ✓ Inserted batch ${Math.floor(i / INSERT_BATCH_SIZE) + 1}: ${insertedPersons.length} persons (total: ${allInsertedPersons.length}/${toInsert.length})`);
    }
    
    console.log(`  ✓ Bulk inserted ${toInsert.length} persons in ${Math.ceil(toInsert.length / INSERT_BATCH_SIZE)} batches`);
  }
  
  // OPTIMIZED BATCH UPDATES - Fetch all latest versions first, then batch operations
  if (toUpdate.length > 0) {
    // Step 1: Get all latest version numbers - batched to avoid bind variable limit
    const personIds = toUpdate.map(u => u.existing.id);
    const versionMap = new Map<string, number>();
    
    // Fetch version numbers in batches
    for (let i = 0; i < personIds.length; i += MAX_BATCH_SIZE) {
      const batch = personIds.slice(i, i + MAX_BATCH_SIZE);
      const latestVersions = await prisma.personVersion.groupBy({
        by: ['personId'],
        where: { personId: { in: batch } },
        _max: { versionNumber: true },
      });
      
      latestVersions.forEach(v => {
        versionMap.set(v.personId, v._max.versionNumber || 0);
      });
    }
    
    console.log(`  Fetched latest versions for ${toUpdate.length} persons`);
    
    // Step 2: Process updates in batches
    for (let i = 0; i < toUpdate.length; i += UPDATE_BATCH_SIZE) {
      const batch = toUpdate.slice(i, Math.min(i + UPDATE_BATCH_SIZE, toUpdate.length));
      
      await prisma.$transaction(async (tx) => {
        const personUpdates = [];
        const versionCreates = [];
        
        for (const { existing, row } of batch) {
          const incomingDate = row.date_of_birth ? new Date(row.date_of_birth) : null;
          const currentVersion = versionMap.get(existing.id) || 0;
          const nextVersionNumber = currentVersion + 1;
          
          // Prepare batch updates
          personUpdates.push(
            tx.person.update({
              where: { id: existing.id },
              data: {
                name: row.name,
                nameEnglish: row.name_english,
                gender: row.gender,
                dateOfBirth: incomingDate,
                isDeleted: false, // Restore record if it was deleted
                currentVersion: nextVersionNumber,
              },
            })
          );
          
          // Prepare version records
          versionCreates.push({
            personId: existing.id,
            externalId: row.external_id,
            name: row.name,
            nameEnglish: row.name_english,
            gender: row.gender,
            dateOfBirth: incomingDate,
            dateOfDeath: existing.dateOfDeath,
            locationOfDeathLat: existing.locationOfDeathLat,
            locationOfDeathLng: existing.locationOfDeathLng,
            isDeleted: false, // Mark as not deleted in version history
            versionNumber: nextVersionNumber,
            sourceId: changeSource.id,
            changeType: ChangeType.UPDATE,
          });
          
          // Update our version map for next batch
          versionMap.set(existing.id, nextVersionNumber);
        }
        
        // Execute all updates in parallel
        await Promise.all(personUpdates);
        
        // Create all version records in one query
        await tx.personVersion.createMany({
          data: versionCreates,
        });
      }, {
        maxWait: 90000,
        timeout: 90000,
      });
      
      console.log(`  Progress: ${Math.min(i + UPDATE_BATCH_SIZE, toUpdate.length)}/${toUpdate.length} updates`);
    }
  }
  
  // MARK AS DELETED
  // Records not in the new MoH upload should be marked as deleted
  if (toDelete.length > 0) {
    // Step 1: Get all latest version numbers - batched to avoid bind variable limit
    const deleteIds = toDelete.map(d => d.id);
    const deleteVersionMap = new Map<string, number>();
    
    // Fetch version numbers in batches
    for (let i = 0; i < deleteIds.length; i += MAX_BATCH_SIZE) {
      const batch = deleteIds.slice(i, i + MAX_BATCH_SIZE);
      const latestDeleteVersions = await prisma.personVersion.groupBy({
        by: ['personId'],
        where: { personId: { in: batch } },
        _max: { versionNumber: true },
      });
      
      latestDeleteVersions.forEach(v => {
        deleteVersionMap.set(v.personId, v._max.versionNumber || 0);
      });
    }
    
    console.log(`  Fetched latest versions for ${toDelete.length} persons to mark as deleted`);
    
    // Step 2: Process delete operations in batches
    for (let i = 0; i < toDelete.length; i += UPDATE_BATCH_SIZE) {
      const batch = toDelete.slice(i, Math.min(i + UPDATE_BATCH_SIZE, toDelete.length));
      
      await prisma.$transaction(async (tx) => {
        const personUpdates = [];
        const versionCreates = [];
        
        for (const existing of batch) {
          const currentVersion = deleteVersionMap.get(existing.id) || 0;
          const nextVersionNumber = currentVersion + 1;
          
          // Prepare batch updates: Mark as deleted
          personUpdates.push(
            tx.person.update({
              where: { id: existing.id },
              data: { 
                isDeleted: true,
                currentVersion: nextVersionNumber,
              },
            })
          );
          
          // Prepare version records
          versionCreates.push({
            personId: existing.id,
            externalId: existing.externalId,
            name: existing.name,
            nameEnglish: existing.nameEnglish,
            gender: existing.gender,
            dateOfBirth: existing.dateOfBirth,
            dateOfDeath: existing.dateOfDeath,
            locationOfDeathLat: existing.locationOfDeathLat,
            locationOfDeathLng: existing.locationOfDeathLng,
            versionNumber: nextVersionNumber,
            sourceId: changeSource.id,
            changeType: ChangeType.UPDATE,
            isDeleted: true,
          });
        }
        
        // Execute all updates in parallel
        await Promise.all(personUpdates);
        
        // Create all version records in one query
        await tx.personVersion.createMany({
          data: versionCreates,
        });
      }, {
        maxWait: 90000,
        timeout: 90000,
      });
      
      console.log(`  Progress: ${Math.min(i + UPDATE_BATCH_SIZE, toDelete.length)}/${toDelete.length} records marked as deleted`);
    }
  }
  
  return {
    uploadId: bulkUpload.id,
    changeSourceId: changeSource.id,
  };
}

/**
 * Rollback a bulk upload
 * 
 * Reverts all changes made by a bulk upload by:
 * - DELETE versions: Restoring person to previous state (undelete)
 * - UPDATE versions: Restoring person to previous state
 * - INSERT versions: Deleting the person entirely
 * 
 * Enforces LIFO (Last In, First Out) - cannot rollback if subsequent uploads modified the same records
 */
export async function rollbackBulkUpload(
  uploadId: string
): Promise<{ 
  success: boolean; 
  changeSourceId: string;
  stats: { inserts: number; updates: number; deletes: number };
}> {
  // Get the bulk upload and its change source
  const bulkUpload = await prisma.bulkUpload.findUnique({
    where: { id: uploadId },
    include: {
      changeSource: {
        include: {
          versions: {
            include: {
              person: true,
            },
          },
        },
      },
    },
  });

  if (!bulkUpload) {
    throw new Error('Bulk upload not found');
  }

  const versions = bulkUpload.changeSource.versions;
  
  if (versions.length === 0) {
    throw new Error('No versions found for this bulk upload');
  }

  // SAFETY CHECK: Detect if any affected persons have subsequent versions from other sources
  const affectedPersonIds = versions.map(v => v.personId);
  const maxVersionNumbers = new Map<string, number>();
  
  // Get the max version number for each person in this upload
  versions.forEach(v => {
    const current = maxVersionNumbers.get(v.personId) || 0;
    if (v.versionNumber > current) {
      maxVersionNumbers.set(v.personId, v.versionNumber);
    }
  });

  // Check if any person has a higher version number from a different source
  const conflictingVersions = await prisma.personVersion.findMany({
    where: {
      personId: { in: affectedPersonIds },
      sourceId: { not: bulkUpload.changeSource.id },
    },
    select: {
      personId: true,
      versionNumber: true,
      sourceId: true,
      createdAt: true,
    },
  });

  // Check for conflicts (versions created after this upload's versions)
  const conflicts = conflictingVersions.filter(cv => {
    const uploadMaxVersion = maxVersionNumbers.get(cv.personId);
    return uploadMaxVersion && cv.versionNumber > uploadMaxVersion;
  });

  if (conflicts.length > 0) {
    throw new Error(
      `Cannot rollback: ${conflicts.length} record(s) have been modified by subsequent uploads. ` +
      `Please rollback recent uploads first (LIFO - Last In, First Out).`
    );
  }

  let removedInserts = 0;
  let removedUpdates = 0;
  let removedDeletes = 0;

  // Use a transaction to ensure atomicity
  const result = await prisma.$transaction(async (tx) => {
    // Process each version - silently remove/undo the changes
    for (const version of versions) {
      const person = version.person;

      if (version.changeType === ChangeType.INSERT) {
        // Original was INSERT → Delete the person version and the person record
        await tx.personVersion.delete({
          where: { id: version.id },
        });

        // Delete the person record entirely (it was newly inserted)
        await tx.person.delete({
          where: { id: person.id },
        });

        removedInserts++;
      } else if (version.changeType === ChangeType.UPDATE) {
        // Original was UPDATE → Delete this version and restore person to previous state
        const previousVersion = await tx.personVersion.findFirst({
          where: {
            personId: person.id,
            versionNumber: version.versionNumber - 1,
          },
        });

        if (!previousVersion) {
          console.warn(`No previous version found for person ${person.id}, skipping rollback`);
          continue;
        }

        // Delete the update version
        await tx.personVersion.delete({
          where: { id: version.id },
        });

        // Restore person to previous state (from previous version)
        await tx.person.update({
          where: { id: person.id },
          data: {
            name: previousVersion.name,
            nameEnglish: previousVersion.nameEnglish,
            gender: previousVersion.gender,
            dateOfBirth: previousVersion.dateOfBirth,
            dateOfDeath: previousVersion.dateOfDeath,
            locationOfDeathLat: previousVersion.locationOfDeathLat,
            locationOfDeathLng: previousVersion.locationOfDeathLng,
            isDeleted: previousVersion.isDeleted,
          },
        });

        removedUpdates++;
      } else if (version.changeType === ChangeType.DELETE) {
        // Original was DELETE → Delete this version and restore person to previous state
        const previousVersion = await tx.personVersion.findFirst({
          where: {
            personId: person.id,
            versionNumber: version.versionNumber - 1,
          },
        });

        if (!previousVersion) {
          console.warn(`No previous version found for person ${person.id}, skipping rollback`);
          continue;
        }

        // Delete the deletion version
        await tx.personVersion.delete({
          where: { id: version.id },
        });

        // Restore person from previous version (undelete)
        await tx.person.update({
          where: { id: person.id },
          data: {
            isDeleted: false,
            name: previousVersion.name,
            nameEnglish: previousVersion.nameEnglish,
            gender: previousVersion.gender,
            dateOfBirth: previousVersion.dateOfBirth,
            dateOfDeath: previousVersion.dateOfDeath,
            locationOfDeathLat: previousVersion.locationOfDeathLat,
            locationOfDeathLng: previousVersion.locationOfDeathLng,
          },
        });

        removedDeletes++;
      }
    }

    // Delete the bulk upload record
    await tx.bulkUpload.delete({
      where: { id: uploadId },
    });

    // Delete the change source record
    await tx.changeSource.delete({
      where: { id: bulkUpload.changeSource.id },
    });

    return {
      success: true,
      changeSourceId: bulkUpload.changeSource.id,
      stats: {
        inserts: removedInserts,
        updates: removedUpdates,
        deletes: removedDeletes,
      },
    };
  });

  return result;
}
