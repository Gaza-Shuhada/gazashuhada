import { Gender } from '@prisma/client';

export interface BulkUploadRow {
  external_id: string;
  name: string;
  gender: Gender;
  date_of_birth: string;
}

const REQUIRED_COLUMNS = ['external_id', 'name', 'gender', 'date_of_birth'];
const FORBIDDEN_COLUMNS = ['date_of_death', 'location_of_death', 'obituary'];

export function parseCSV(csvContent: string): BulkUploadRow[] {
  const lines = csvContent.trim().split('\n');
  
  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  
  // Validate headers
  validateHeaders(headers);
  
  const rows: BulkUploadRow[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    
    if (values.length !== headers.length) {
      throw new Error(`Row ${i + 1} has ${values.length} columns, expected ${headers.length}`);
    }
    
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index];
    });
    
    // Validate gender
    const gender = row.gender?.toUpperCase();
    if (!['MALE', 'FEMALE', 'OTHER'].includes(gender)) {
      throw new Error(`Row ${i + 1}: Invalid gender "${row.gender}". Must be MALE, FEMALE, or OTHER`);
    }
    
    // Validate date format
    if (!isValidDate(row.date_of_birth)) {
      throw new Error(`Row ${i + 1}: Invalid date_of_birth "${row.date_of_birth}". Must be YYYY-MM-DD format`);
    }
    
    rows.push({
      external_id: row.external_id,
      name: row.name,
      gender: gender as Gender,
      date_of_birth: row.date_of_birth,
    });
  }
  
  return rows;
}

export function validateHeaders(headers: string[]): void {
  // Check for required columns
  const missingColumns = REQUIRED_COLUMNS.filter(col => !headers.includes(col));
  if (missingColumns.length > 0) {
    throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
  }
  
  // Check for forbidden columns
  const forbiddenFound = headers.filter(col => FORBIDDEN_COLUMNS.includes(col));
  if (forbiddenFound.length > 0) {
    throw new Error(
      `CSV contains forbidden columns: ${forbiddenFound.join(', ')}. ` +
      `Bulk uploads may only contain: ${REQUIRED_COLUMNS.join(', ')}`
    );
  }
  
  // Check for extra columns
  const extraColumns = headers.filter(col => !REQUIRED_COLUMNS.includes(col));
  if (extraColumns.length > 0) {
    throw new Error(
      `CSV contains unexpected columns: ${extraColumns.join(', ')}. ` +
      `Only allowed columns are: ${REQUIRED_COLUMNS.join(', ')}`
    );
  }
}

function isValidDate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) {
    return false;
  }
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}
