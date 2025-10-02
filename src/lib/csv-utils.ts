import { Gender } from '@prisma/client';
import { parse } from 'csv-parse/sync';

export interface BulkUploadRow {
  external_id: string;
  name: string;
  gender: Gender;
  date_of_birth: string;
}

const REQUIRED_COLUMNS = ['external_id', 'name', 'gender', 'date_of_birth'];
const FORBIDDEN_COLUMNS = ['date_of_death', 'location_of_death', 'obituary'];

export function parseCSV(csvContent: string): BulkUploadRow[] {
  if (!csvContent || csvContent.trim().length === 0) {
    throw new Error('CSV file is empty');
  }

  let records: any[];
  
  // Parse CSV with proper library that handles quotes, commas, etc.
  try {
    records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relaxColumnCount: false, // Strict: all rows must have same column count
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`CSV parsing failed: ${error.message}`);
    }
    throw new Error('CSV parsing failed: Invalid CSV format');
  }
  
  if (records.length === 0) {
    throw new Error('CSV file contains no data rows (only headers or empty)');
  }
  
  // Validate headers (case-insensitive)
  const headers = Object.keys(records[0]).map(h => h.trim().toLowerCase());
  validateHeaders(headers);
  
  const rows: BulkUploadRow[] = [];
  
  for (let i = 0; i < records.length; i++) {
    const rowNumber = i + 2; // +2 because row 1 is headers, and array is 0-indexed
    const record = records[i];
    
    // Normalize keys to lowercase
    const row: Record<string, string> = {};
    Object.keys(record).forEach(key => {
      row[key.trim().toLowerCase()] = record[key];
    });
    
    // Validate all required fields are present and non-empty
    for (const field of REQUIRED_COLUMNS) {
      const value = row[field];
      if (value === undefined || value === null || value.trim() === '') {
        throw new Error(
          `Row ${rowNumber}: Missing required field "${field}". All fields are required and cannot be empty.`
        );
      }
    }
    
    // Validate gender
    const gender = row.gender.trim().toUpperCase();
    if (!['MALE', 'FEMALE', 'OTHER'].includes(gender)) {
      throw new Error(
        `Row ${rowNumber}: Invalid gender "${row.gender}". Must be MALE, FEMALE, or OTHER (case-insensitive).`
      );
    }
    
    // Validate date format
    if (!isValidDate(row.date_of_birth)) {
      throw new Error(
        `Row ${rowNumber}: Invalid date_of_birth "${row.date_of_birth}". Must be in YYYY-MM-DD format (e.g., 1990-12-25).`
      );
    }
    
    // Validate external_id is not just whitespace
    if (row.external_id.trim().length === 0) {
      throw new Error(
        `Row ${rowNumber}: external_id cannot be empty or contain only whitespace.`
      );
    }
    
    // Validate name is not just whitespace
    if (row.name.trim().length === 0) {
      throw new Error(
        `Row ${rowNumber}: name cannot be empty or contain only whitespace.`
      );
    }
    
    rows.push({
      external_id: row.external_id.trim(),
      name: row.name.trim(),
      gender: gender as Gender,
      date_of_birth: row.date_of_birth.trim(),
    });
  }
  
  return rows;
}

export function validateHeaders(headers: string[]): void {
  if (headers.length === 0) {
    throw new Error(
      'CSV file has no headers. Expected headers: ' + REQUIRED_COLUMNS.join(', ')
    );
  }

  // Check for required columns
  const missingColumns = REQUIRED_COLUMNS.filter(col => !headers.includes(col));
  if (missingColumns.length > 0) {
    throw new Error(
      `Missing required column(s): ${missingColumns.join(', ')}.\n` +
      `Your CSV headers: ${headers.join(', ')}\n` +
      `Required headers: ${REQUIRED_COLUMNS.join(', ')}`
    );
  }
  
  // Check for forbidden columns
  const forbiddenFound = headers.filter(col => FORBIDDEN_COLUMNS.includes(col));
  if (forbiddenFound.length > 0) {
    throw new Error(
      `CSV contains forbidden column(s): ${forbiddenFound.join(', ')}.\n` +
      `Death-related fields cannot be included in bulk uploads.\n` +
      `Only these columns are allowed: ${REQUIRED_COLUMNS.join(', ')}`
    );
  }
  
  // Check for extra columns
  const extraColumns = headers.filter(col => !REQUIRED_COLUMNS.includes(col));
  if (extraColumns.length > 0) {
    throw new Error(
      `CSV contains unexpected column(s): ${extraColumns.join(', ')}.\n` +
      `Only these columns are allowed: ${REQUIRED_COLUMNS.join(', ')}\n` +
      `Remove the extra columns and try again.`
    );
  }
  
  // Check for duplicate columns
  const duplicates = headers.filter((col, index) => headers.indexOf(col) !== index);
  if (duplicates.length > 0) {
    throw new Error(
      `CSV contains duplicate column(s): ${[...new Set(duplicates)].join(', ')}.\n` +
      `Each column header must be unique.`
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
