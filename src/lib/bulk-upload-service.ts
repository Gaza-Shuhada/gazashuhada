import { prisma } from './prisma';
import { BulkUploadRow } from './csv-utils';
import { ChangeType, Gender } from '@prisma/client';

export interface DiffItem {
  externalId: string;
  changeType: ChangeType;
  current?: {
    name: string;
    gender: Gender;
    dateOfBirth: Date;
  };
  incoming: {
    name: string;
    gender: Gender;
    dateOfBirth: Date;
  };
}

export interface SimulationResult {
  summary: {
    totalIncoming: number;
    inserts: number;
    updates: number;
    deletes: number;
  };
  // All deletions (need to review before applying)
  deletions: DiffItem[];
  // All updates (need to review changes)
  updates: DiffItem[];
  // Sample inserts (first 10, since they're new records)
  sampleInserts: DiffItem[];
}

export async function simulateBulkUpload(rows: BulkUploadRow[]): Promise<SimulationResult> {
  const incomingIds = rows.map(r => r.external_id);
  const incomingIdsSet = new Set(incomingIds);
  
  // OPTIMIZED: Only fetch persons that match incoming IDs (for INSERT/UPDATE detection)
  const matchingPersons = await prisma.person.findMany({
    where: { 
      externalId: { in: incomingIds },
      isDeleted: false 
    },
  });
  
  const existingMap = new Map(matchingPersons.map(p => [p.externalId, p]));
  
  // OPTIMIZED: For DELETE detection, only fetch external_id field
  const allExistingIds = await prisma.person.findMany({
    where: { isDeleted: false },
    select: { externalId: true, name: true, gender: true, dateOfBirth: true },
  });
  
  const insertDiffs: DiffItem[] = [];
  const updateDiffs: DiffItem[] = [];
  const deleteDiffs: DiffItem[] = [];
  
  // Check for inserts and updates
  for (const row of rows) {
    const existing = existingMap.get(row.external_id);
    const incomingDate = new Date(row.date_of_birth);
    
    if (!existing) {
      // INSERT
      insertDiffs.push({
        externalId: row.external_id,
        changeType: ChangeType.INSERT,
        incoming: {
          name: row.name,
          gender: row.gender,
          dateOfBirth: incomingDate,
        },
      });
    } else {
      // Check if different (UPDATE)
      const existingDate = new Date(existing.dateOfBirth);
      const isDifferent = 
        existing.name !== row.name ||
        existing.gender !== row.gender ||
        existingDate.getTime() !== incomingDate.getTime();
      
      if (isDifferent) {
        updateDiffs.push({
          externalId: row.external_id,
          changeType: ChangeType.UPDATE,
          current: {
            name: existing.name,
            gender: existing.gender,
            dateOfBirth: existing.dateOfBirth,
          },
          incoming: {
            name: row.name,
            gender: row.gender,
            dateOfBirth: incomingDate,
          },
        });
      }
    }
  }
  
  // Check for deletes (existing records not in incoming)
  for (const existing of allExistingIds) {
    if (!incomingIdsSet.has(existing.externalId)) {
      deleteDiffs.push({
        externalId: existing.externalId,
        changeType: ChangeType.DELETE,
        current: {
          name: existing.name,
          gender: existing.gender,
          dateOfBirth: existing.dateOfBirth,
        },
        incoming: {
          name: existing.name,
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
    deletions: deleteDiffs, // ALL deletions for review
    updates: updateDiffs,    // ALL updates for review
    sampleInserts: insertDiffs.slice(0, 10), // Sample of inserts (first 10)
  };
}

export async function applyBulkUpload(
  rows: BulkUploadRow[],
  filename: string,
  rawFile: Buffer,
  label: string,
  dateReleased: Date
): Promise<{ uploadId: string; changeSourceId: string }> {
  const incomingIds = rows.map(r => r.external_id);
  const incomingIdsSet = new Set(incomingIds);
  
  // OPTIMIZED: Only fetch persons that match incoming IDs
  const matchingPersons = await prisma.person.findMany({
    where: { 
      externalId: { in: incomingIds },
      isDeleted: false 
    },
  });
  
  const existingMap = new Map(matchingPersons.map(p => [p.externalId, p]));
  
  // OPTIMIZED: For DELETE detection, only fetch IDs
  const allExistingPersons = await prisma.person.findMany({
    where: { isDeleted: false },
    select: { id: true, externalId: true, name: true, gender: true, dateOfBirth: true, dateOfDeath: true, locationOfDeathLat: true, locationOfDeathLng: true, obituary: true },
  });
  
  // Use a transaction to ensure atomicity
  const result = await prisma.$transaction(async (tx) => {
    // Create change source for bulk upload
    const changeSource = await tx.changeSource.create({
      data: {
        type: 'BULK_UPLOAD',
        description: `Bulk upload: ${filename}`,
      },
    });
    
    // Create bulk upload record
    const bulkUpload = await tx.bulkUpload.create({
      data: {
        changeSourceId: changeSource.id,
        filename,
        label,
        dateReleased,
        rawFile,
      },
    });
    
    // Process inserts and updates
    for (const row of rows) {
      const existing = existingMap.get(row.external_id);
      const incomingDate = new Date(row.date_of_birth);
      
      if (!existing) {
        // INSERT
        const person = await tx.person.create({
          data: {
            externalId: row.external_id,
            name: row.name,
            gender: row.gender,
            dateOfBirth: incomingDate,
          },
        });
        
        // Create version with INSERT changeType
        await tx.personVersion.create({
          data: {
            personId: person.id,
            externalId: row.external_id,
            name: row.name,
            gender: row.gender,
            dateOfBirth: incomingDate,
            versionNumber: 1,
            sourceId: changeSource.id,
            changeType: 'INSERT',
          },
        });
      } else {
        // Check if different (UPDATE)
        const existingDate = new Date(existing.dateOfBirth);
        const isDifferent = 
          existing.name !== row.name ||
          existing.gender !== row.gender ||
          existingDate.getTime() !== incomingDate.getTime();
        
        if (isDifferent) {
          // Get current version number
          const latestVersion = await tx.personVersion.findFirst({
            where: { personId: existing.id },
            orderBy: { versionNumber: 'desc' },
          });
          
          const nextVersionNumber = (latestVersion?.versionNumber || 0) + 1;
          
          // Update person
          await tx.person.update({
            where: { id: existing.id },
            data: {
              name: row.name,
              gender: row.gender,
              dateOfBirth: incomingDate,
            },
          });
          
          // Create new version with UPDATE changeType
          await tx.personVersion.create({
            data: {
              personId: existing.id,
              externalId: row.external_id,
              name: row.name,
              gender: row.gender,
              dateOfBirth: incomingDate,
              dateOfDeath: existing.dateOfDeath,
              locationOfDeathLat: existing.locationOfDeathLat,
              locationOfDeathLng: existing.locationOfDeathLng,
              obituary: existing.obituary,
              versionNumber: nextVersionNumber,
              sourceId: changeSource.id,
              changeType: 'UPDATE',
            },
          });
        }
      }
    }
    
    // Process deletes (soft delete)
    for (const existing of allExistingPersons) {
      if (!incomingIdsSet.has(existing.externalId)) {
        // Get current version number
        const latestVersion = await tx.personVersion.findFirst({
          where: { personId: existing.id },
          orderBy: { versionNumber: 'desc' },
        });
        
        const nextVersionNumber = (latestVersion?.versionNumber || 0) + 1;
        
        // Soft delete person
        await tx.person.update({
          where: { id: existing.id },
          data: { isDeleted: true },
        });
        
        // Create deletion version with DELETE changeType
        await tx.personVersion.create({
          data: {
            personId: existing.id,
            externalId: existing.externalId,
            name: existing.name,
            gender: existing.gender,
            dateOfBirth: existing.dateOfBirth,
            dateOfDeath: existing.dateOfDeath,
            locationOfDeathLat: existing.locationOfDeathLat,
            locationOfDeathLng: existing.locationOfDeathLng,
            obituary: existing.obituary,
            versionNumber: nextVersionNumber,
            sourceId: changeSource.id,
            changeType: 'DELETE',
            isDeleted: true,
          },
        });
      }
    }
    
    return {
      uploadId: bulkUpload.id,
      changeSourceId: changeSource.id,
    };
  });
  
  return result;
}

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

      if (version.changeType === 'INSERT') {
        // Original was INSERT → Delete the person version and the person record
        await tx.personVersion.delete({
          where: { id: version.id },
        });

        // Delete the person record entirely (it was newly inserted)
        await tx.person.delete({
          where: { id: person.id },
        });

        removedInserts++;
      } else if (version.changeType === 'UPDATE') {
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
      } else if (version.changeType === 'DELETE') {
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
