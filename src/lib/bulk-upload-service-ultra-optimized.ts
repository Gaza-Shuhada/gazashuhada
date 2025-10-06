import { prisma } from './prisma';
import { BulkUploadRow } from './csv-utils';
import { ChangeType, Gender } from '@prisma/client';
import { uploadToBlob } from './blob-storage';

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
  obituary: string | null;
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
  
  const matchingPersons = await prisma.person.findMany({
    where: { 
      externalId: { in: incomingIds },
      isDeleted: false 
    },
    select: { externalId: true, name: true, nameEnglish: true, gender: true, dateOfBirth: true },
  });
  
  const existingMap = new Map(matchingPersons.map(p => [p.externalId, p]));
  
  const allExistingIds = await prisma.person.findMany({
    where: { isDeleted: false },
    select: { externalId: true, name: true, nameEnglish: true, gender: true, dateOfBirth: true },
  });
  
  const insertDiffs: DiffItem[] = [];
  const updateDiffs: DiffItem[] = [];
  const deleteDiffs: DiffItem[] = [];
  
  for (const row of rows) {
    const existing = existingMap.get(row.external_id);
    const incomingDate = row.date_of_birth ? new Date(row.date_of_birth) : null;
    
    if (!existing) {
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
      const existingDate = existing.dateOfBirth ? new Date(existing.dateOfBirth) : null;
      const isDifferent = 
        existing.name !== row.name ||
        existing.nameEnglish !== row.name_english ||
        existing.gender !== row.gender ||
        (existingDate?.getTime() !== incomingDate?.getTime());
      
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
  
  for (const existing of allExistingIds) {
    if (!incomingIdsSet.has(existing.externalId)) {
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
  rawFile: Buffer,
  label: string,
  dateReleased: Date
): Promise<{ uploadId: string; changeSourceId: string }> {
  const incomingIds = rows.map(r => r.external_id);
  const incomingIdsSet = new Set(incomingIds);
  
  // Fetch existing data
  const matchingPersons = await prisma.person.findMany({
    where: { 
      externalId: { in: incomingIds },
      isDeleted: false 
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
      obituary: true,
    },
  });
  
  const existingMap = new Map(matchingPersons.map(p => [p.externalId, p]));
  
  const allExistingPersons = await prisma.person.findMany({
    where: { isDeleted: false },
    select: { id: true, externalId: true, name: true, nameEnglish: true, gender: true, dateOfBirth: true, dateOfDeath: true, locationOfDeathLat: true, locationOfDeathLng: true, obituary: true },
  });
  
  // Upload file to Blob storage
  const blobMetadata = await uploadToBlob(rawFile, filename, {
    contentType: 'text/csv',
    generatePreview: true,
    previewLineCount: 20,
  });
  
  // Create metadata
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
      label,
      dateReleased,
      // Blob storage metadata (replaces rawFile)
      fileUrl: blobMetadata.url,
      fileSize: blobMetadata.size,
      fileSha256: blobMetadata.sha256,
      contentType: blobMetadata.contentType,
      previewLines: blobMetadata.previewLines,
    },
  });
  
  // Separate inserts and updates
  const toInsert: BulkUploadRow[] = [];
  const toUpdate: Array<{ existing: ExistingPerson; row: BulkUploadRow }> = [];
  
  for (const row of rows) {
    const existing = existingMap.get(row.external_id);
    const incomingDate = row.date_of_birth ? new Date(row.date_of_birth) : null;
    
    if (!existing) {
      toInsert.push(row);
    } else {
      const existingDate = existing.dateOfBirth ? new Date(existing.dateOfBirth) : null;
      const isDifferent = 
        existing.name !== row.name ||
        existing.nameEnglish !== row.name_english ||
        existing.gender !== row.gender ||
        (existingDate?.getTime() !== incomingDate?.getTime());
      
      if (isDifferent) {
        toUpdate.push({ existing, row });
      }
    }
  }
  
  console.log(`  Bulk operations: ${toInsert.length} inserts, ${toUpdate.length} updates`);
  
  // BULK INSERT - This is MUCH faster!
  if (toInsert.length > 0) {
    // Insert persons in bulk
    const insertedPersons = await prisma.person.createManyAndReturn({
      data: toInsert.map(row => ({
        externalId: row.external_id,
        name: row.name,
        nameEnglish: row.name_english,
        gender: row.gender,
        dateOfBirth: row.date_of_birth ? new Date(row.date_of_birth) : null,
      })),
    });
    
    // Create versions in bulk
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
    
    console.log(`  ✓ Bulk inserted ${toInsert.length} persons`);
  }
  
  // OPTIMIZED BATCH UPDATES - Fetch all latest versions first, then batch operations
  if (toUpdate.length > 0) {
    // Step 1: Get all latest version numbers in ONE query (much faster!)
    const personIds = toUpdate.map(u => u.existing.id);
    const latestVersions = await prisma.personVersion.groupBy({
      by: ['personId'],
      where: { personId: { in: personIds } },
      _max: { versionNumber: true },
    });
    
    const versionMap = new Map(
      latestVersions.map(v => [v.personId, v._max.versionNumber || 0])
    );
    
    console.log(`  Fetched latest versions for ${toUpdate.length} persons`);
    
    // Step 2: Process updates in batches
    const UPDATE_BATCH_SIZE = 100; // Larger batches since we have version numbers
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
            obituary: existing.obituary,
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
  
  // OPTIMIZED BATCH DELETES
  const toDelete = allExistingPersons.filter(existing => !incomingIdsSet.has(existing.externalId));
  
  if (toDelete.length > 0) {
    // Step 1: Get all latest version numbers in ONE query
    const deleteIds = toDelete.map(d => d.id);
    const latestDeleteVersions = await prisma.personVersion.groupBy({
      by: ['personId'],
      where: { personId: { in: deleteIds } },
      _max: { versionNumber: true },
    });
    
    const deleteVersionMap = new Map(
      latestDeleteVersions.map(v => [v.personId, v._max.versionNumber || 0])
    );
    
    console.log(`  Fetched latest versions for ${toDelete.length} persons to delete`);
    
    // Step 2: Process deletes in batches
    const DELETE_BATCH_SIZE = 100;
    for (let i = 0; i < toDelete.length; i += DELETE_BATCH_SIZE) {
      const batch = toDelete.slice(i, Math.min(i + DELETE_BATCH_SIZE, toDelete.length));
      
      await prisma.$transaction(async (tx) => {
        const personDeletes = [];
        const versionCreates = [];
        
        for (const existing of batch) {
          const currentVersion = deleteVersionMap.get(existing.id) || 0;
          const nextVersionNumber = currentVersion + 1;
          
          // Prepare batch deletes
          personDeletes.push(
            tx.person.update({
              where: { id: existing.id },
              data: { isDeleted: true },
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
            obituary: existing.obituary,
            versionNumber: nextVersionNumber,
            sourceId: changeSource.id,
            changeType: ChangeType.DELETE,
            isDeleted: true,
          });
        }
        
        // Execute all deletes in parallel
        await Promise.all(personDeletes);
        
        // Create all version records in one query
        await tx.personVersion.createMany({
          data: versionCreates,
        });
      }, {
        maxWait: 90000,
        timeout: 90000,
      });
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
            obituary: previousVersion.obituary,
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
            obituary: previousVersion.obituary,
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
