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
  sampleDiffs: DiffItem[];
}

export async function simulateBulkUpload(rows: BulkUploadRow[]): Promise<SimulationResult> {
  const incomingIds = new Set(rows.map(r => r.external_id));
  
  // Fetch all existing persons
  const existingPersons = await prisma.person.findMany({
    where: { isDeleted: false },
  });
  
  const existingMap = new Map(existingPersons.map(p => [p.externalId, p]));
  
  const diffs: DiffItem[] = [];
  let inserts = 0;
  let updates = 0;
  let deletes = 0;
  
  // Check for inserts and updates
  for (const row of rows) {
    const existing = existingMap.get(row.external_id);
    const incomingDate = new Date(row.date_of_birth);
    
    if (!existing) {
      // INSERT
      inserts++;
      diffs.push({
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
        updates++;
        diffs.push({
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
  for (const existing of existingPersons) {
    if (!incomingIds.has(existing.externalId)) {
      deletes++;
      diffs.push({
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
  
  // Return sample diffs (first 10 of each type)
  const sampleDiffs = [
    ...diffs.filter(d => d.changeType === ChangeType.INSERT).slice(0, 10),
    ...diffs.filter(d => d.changeType === ChangeType.UPDATE).slice(0, 10),
    ...diffs.filter(d => d.changeType === ChangeType.DELETE).slice(0, 10),
  ];
  
  return {
    summary: {
      totalIncoming: rows.length,
      inserts,
      updates,
      deletes,
    },
    sampleDiffs,
  };
}

export async function applyBulkUpload(
  rows: BulkUploadRow[],
  filename: string,
  rawFile: Buffer
): Promise<{ uploadId: string; changeSourceId: string }> {
  const incomingIds = new Set(rows.map(r => r.external_id));
  
  // Fetch all existing persons
  const existingPersons = await prisma.person.findMany({
    where: { isDeleted: false },
  });
  
  const existingMap = new Map(existingPersons.map(p => [p.externalId, p]));
  
  // Use a transaction to ensure atomicity
  const result = await prisma.$transaction(async (tx) => {
    // Create change source for bulk upload
    const changeSource = await tx.changeSource.create({
      data: {
        type: 'BULK_UPLOAD',
        changeType: 'INSERT', // Will be overridden per version
        description: `Bulk upload: ${filename}`,
      },
    });
    
    // Create bulk upload record
    const bulkUpload = await tx.bulkUpload.create({
      data: {
        changeSourceId: changeSource.id,
        filename,
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
        
        // Create version
        await tx.personVersion.create({
          data: {
            personId: person.id,
            externalId: row.external_id,
            name: row.name,
            gender: row.gender,
            dateOfBirth: incomingDate,
            versionNumber: 1,
            sourceId: changeSource.id,
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
          
          // Create new version
          await tx.personVersion.create({
            data: {
              personId: existing.id,
              externalId: row.external_id,
              name: row.name,
              gender: row.gender,
              dateOfBirth: incomingDate,
              dateOfDeath: existing.dateOfDeath,
              locationOfDeath: existing.locationOfDeath,
              obituary: existing.obituary,
              versionNumber: nextVersionNumber,
              sourceId: changeSource.id,
            },
          });
        }
      }
    }
    
    // Process deletes (soft delete)
    for (const existing of existingPersons) {
      if (!incomingIds.has(existing.externalId)) {
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
        
        // Create deletion version
        await tx.personVersion.create({
          data: {
            personId: existing.id,
            externalId: existing.externalId,
            name: existing.name,
            gender: existing.gender,
            dateOfBirth: existing.dateOfBirth,
            dateOfDeath: existing.dateOfDeath,
            locationOfDeath: existing.locationOfDeath,
            obituary: existing.obituary,
            versionNumber: nextVersionNumber,
            sourceId: changeSource.id,
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
