import { prisma } from './prisma';
import { BulkUploadRow } from './csv-utils';
import { ChangeType, Gender } from '@prisma/client';

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

export async function applyBulkUpload(
  rows: BulkUploadRow[],
  filename: string,
  rawFile: Buffer,
  label: string,
  dateReleased: Date
): Promise<{ uploadId: string; changeSourceId: string }> {
  const incomingIds = rows.map(r => r.external_id);
  const incomingIdsSet = new Set(incomingIds);
  
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
  
  // Step 1: Create metadata records (quick)
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
      rawFile,
    },
  });
  
  // Step 2: Process in smaller batches (optimized for Accelerate network latency)
  const BATCH_SIZE = 25; // Very conservative for Prisma Accelerate
  
  // Process inserts and updates
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, Math.min(i + BATCH_SIZE, rows.length));
    
    await prisma.$transaction(async (tx) => {
      for (const row of batch) {
        const existing = existingMap.get(row.external_id);
        const incomingDate = row.date_of_birth ? new Date(row.date_of_birth) : null;
        
        if (!existing) {
          const person = await tx.person.create({
            data: {
              externalId: row.external_id,
              name: row.name,
              nameEnglish: row.name_english,
              gender: row.gender,
              dateOfBirth: incomingDate,
            },
          });
          
          await tx.personVersion.create({
            data: {
              personId: person.id,
              externalId: row.external_id,
              name: row.name,
              nameEnglish: row.name_english,
              gender: row.gender,
              dateOfBirth: incomingDate,
              versionNumber: 1,
              sourceId: changeSource.id,
              changeType: 'INSERT',
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
            const latestVersion = await tx.personVersion.findFirst({
              where: { personId: existing.id },
              orderBy: { versionNumber: 'desc' },
            });
            
            const nextVersionNumber = (latestVersion?.versionNumber || 0) + 1;
            
            await tx.person.update({
              where: { id: existing.id },
              data: {
                name: row.name,
                nameEnglish: row.name_english,
                gender: row.gender,
                dateOfBirth: incomingDate,
              },
            });
            
            await tx.personVersion.create({
              data: {
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
                changeType: 'UPDATE',
              },
            });
          }
        }
      }
    }, {
      maxWait: 15000,
      timeout: 15000,
    });
    
    // Progress indicator
    if ((i + BATCH_SIZE) % 1000 === 0 || (i + BATCH_SIZE) >= rows.length) {
      console.log(`  Progress: ${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length} records processed`);
    }
  }
  
  // Process deletes
  const toDelete = allExistingPersons.filter(existing => !incomingIdsSet.has(existing.externalId));
  
  for (let i = 0; i < toDelete.length; i += BATCH_SIZE) {
    const batch = toDelete.slice(i, Math.min(i + BATCH_SIZE, toDelete.length));
    
    await prisma.$transaction(async (tx) => {
      for (const existing of batch) {
        const latestVersion = await tx.personVersion.findFirst({
          where: { personId: existing.id },
          orderBy: { versionNumber: 'desc' },
        });
        
        const nextVersionNumber = (latestVersion?.versionNumber || 0) + 1;
        
        await tx.person.update({
          where: { id: existing.id },
          data: { isDeleted: true },
        });
        
        await tx.personVersion.create({
          data: {
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
            changeType: 'DELETE',
            isDeleted: true,
          },
        });
      }
    }, {
      maxWait: 15000,
      timeout: 15000,
    });
  }
  
  return {
    uploadId: bulkUpload.id,
    changeSourceId: changeSource.id,
  };
}

