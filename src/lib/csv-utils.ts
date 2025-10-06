import { Gender } from '@prisma/client';
import { parse } from 'csv-parse/sync';

export interface BulkUploadRow {
  external_id: string;
  name: string;
  name_english: string | null; // English translation of name (from MOH name_en)
  gender: Gender;
  date_of_birth: string | null; // Can be null/empty for MOH records without DOB
}

// Column mapping: MOH CSV columns → our internal columns
const COLUMN_MAPPINGS: Record<string, string> = {
  'id': 'external_id',
  'name_ar_raw': 'name',
  'name_en': 'name_english',
  'sex': 'gender',
  'dob': 'date_of_birth',
};

// These are the normalized internal column names we expect
const REQUIRED_COLUMNS = ['external_id', 'name', 'gender', 'date_of_birth'];

// Optional columns that can be present but we'll ignore
const OPTIONAL_IGNORED_COLUMNS = ['index', 'age', 'source'];

const FORBIDDEN_COLUMNS = ['date_of_death', 'location_of_death', 'obituary'];

export function parseCSV(csvContent: string): BulkUploadRow[] {
  if (!csvContent || csvContent.trim().length === 0) {
    throw new Error('CSV file is empty');
  }

  let records: Record<string, string>[];
  
  // Parse CSV with proper library that handles quotes, commas, etc.
  try {
    records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relaxColumnCount: false, // Strict: all rows must have same column count
      relax_quotes: true, // Allow malformed quotes (MOH CSVs have some quote issues)
      escape: '"',
      quote: '"',
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
  
  // Validate headers (case-insensitive) and normalize
  const originalHeaders = Object.keys(records[0]).map(h => h.trim().toLowerCase());
  validateHeaders(originalHeaders);
  
  const rows: BulkUploadRow[] = [];
  
  for (let i = 0; i < records.length; i++) {
    const rowNumber = i + 2; // +2 because row 1 is headers, and array is 0-indexed
    const record = records[i];
    
    // Normalize keys to lowercase and map to internal column names
    const row: Record<string, string> = {};
    Object.keys(record).forEach(key => {
      const normalizedKey = key.trim().toLowerCase();
      const mappedKey = COLUMN_MAPPINGS[normalizedKey] || normalizedKey;
      row[mappedKey] = record[key];
    });
    
    // Validate all required fields are present and non-empty
    for (const field of REQUIRED_COLUMNS) {
      const value = row[field];
      
      // Allow empty date_of_birth (some MOH records don't have DOB)
      if (field === 'date_of_birth') {
        if (value === undefined || value === null) {
          row[field] = ''; // Set to empty string
        }
        continue;
      }
      
      if (value === undefined || value === null || value.trim() === '') {
        throw new Error(
          `Row ${rowNumber}: Missing required field "${field}". All fields are required and cannot be empty.`
        );
      }
    }
    
    // Validate and normalize gender (M/F → MALE/FEMALE)
    const genderValue = row.gender.trim().toUpperCase();
    let normalizedGender: string;
    
    if (genderValue === 'M' || genderValue === 'MALE') {
      normalizedGender = 'MALE';
    } else if (genderValue === 'F' || genderValue === 'FEMALE') {
      normalizedGender = 'FEMALE';
    } else if (genderValue === 'OTHER' || genderValue === 'O') {
      normalizedGender = 'OTHER';
    } else {
      throw new Error(
        `Row ${rowNumber}: Invalid gender "${row.gender}". Must be M/F/O or MALE/FEMALE/OTHER (case-insensitive).`
      );
    }
    
    // Validate date format if provided
    const dobValue = row.date_of_birth.trim();
    if (dobValue && !isValidDate(dobValue)) {
      throw new Error(
        `Row ${rowNumber}: Invalid date_of_birth "${dobValue}". Must be in YYYY-MM-DD or MM/DD/YYYY format (e.g., 1990-12-25 or 12/25/1990) or empty.`
      );
    }
    
    // Normalize date to YYYY-MM-DD format
    const normalizedDob = dobValue ? normalizeDate(dobValue) : null;
    
    // Validate external_id format
    const externalId = row.external_id.trim();
    if (externalId.length === 0) {
      throw new Error(
        `Row ${rowNumber}: external_id cannot be empty or contain only whitespace.`
      );
    }
    if (externalId.length > 50) {
      throw new Error(
        `Row ${rowNumber}: external_id cannot exceed 50 characters. Got: ${externalId.length} characters.`
      );
    }
    // Allow letters, numbers, hyphens, underscores (e.g., "P12345", "MoH-2024-001", "record_123")
    if (!/^[A-Za-z0-9_-]+$/.test(externalId)) {
      throw new Error(
        `Row ${rowNumber}: external_id "${externalId}" contains invalid characters. ` +
        `Only letters, numbers, hyphens, and underscores are allowed.`
      );
    }
    
    // Validate name is not just whitespace
    if (row.name.trim().length === 0) {
      throw new Error(
        `Row ${rowNumber}: name cannot be empty or contain only whitespace.`
      );
    }
    
    // Get nameEnglish if present
    const nameEnglish = row.name_english ? row.name_english.trim() : null;
    
    rows.push({
      external_id: externalId,
      name: row.name.trim(),
      name_english: nameEnglish || null,
      gender: normalizedGender as Gender,
      date_of_birth: normalizedDob,
    });
  }
  
  return rows;
}

export function validateHeaders(headers: string[]): void {
  if (headers.length === 0) {
    throw new Error(
      'CSV file has no headers. Expected headers: id, name_ar_raw, sex, dob'
    );
  }

  // Map headers to internal column names
  const mappedHeaders = headers.map(h => COLUMN_MAPPINGS[h] || h);
  
  // Check for required columns (after mapping)
  const missingColumns = REQUIRED_COLUMNS.filter(col => !mappedHeaders.includes(col));
  if (missingColumns.length > 0) {
    // Provide helpful error message with original column names
    const missingOriginal: string[] = [];
    for (const col of missingColumns) {
      // Find the original column name
      const originalName = Object.keys(COLUMN_MAPPINGS).find(k => COLUMN_MAPPINGS[k] === col);
      missingOriginal.push(originalName || col);
    }
    
    throw new Error(
      `Missing required column(s): ${missingOriginal.join(', ')}.\n` +
      `Your CSV headers: ${headers.join(', ')}\n` +
      `Required headers: id, name_ar_raw, sex, dob`
    );
  }
  
  // Check for forbidden columns
  const forbiddenFound = headers.filter(col => FORBIDDEN_COLUMNS.includes(col));
  if (forbiddenFound.length > 0) {
    throw new Error(
      `CSV contains forbidden column(s): ${forbiddenFound.join(', ')}.\n` +
      `Death-related fields cannot be included in bulk uploads.\n` +
      `Required headers: id, name_ar_raw, sex, dob (optional: name_en, ${OPTIONAL_IGNORED_COLUMNS.join(', ')})`
    );
  }
  
  // Check for extra columns (allow optional columns)
  const allowedColumns = [
    ...Object.keys(COLUMN_MAPPINGS), // Original MOH column names
    ...OPTIONAL_IGNORED_COLUMNS,
  ];
  
  const extraColumns = headers.filter(col => !allowedColumns.includes(col));
  if (extraColumns.length > 0) {
    throw new Error(
      `CSV contains unexpected column(s): ${extraColumns.join(', ')}.\n` +
      `Required: id, name_ar_raw, sex, dob\n` +
      `Optional: name_en, ${OPTIONAL_IGNORED_COLUMNS.join(', ')}\n` +
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
  // Support YYYY-MM-DD format
  const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (isoRegex.test(dateString)) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }
  
  // Support MM/DD/YYYY format (convert to YYYY-MM-DD)
  const usRegex = /^\d{2}\/\d{2}\/\d{4}$/;
  if (usRegex.test(dateString)) {
    const [month, day, year] = dateString.split('/');
    const isoDate = `${year}-${month}-${day}`;
    const date = new Date(isoDate);
    return date instanceof Date && !isNaN(date.getTime());
  }
  
  return false;
}

function normalizeDate(dateString: string): string {
  // If already in YYYY-MM-DD format, return as-is
  const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (isoRegex.test(dateString)) {
    return dateString;
  }
  
  // Convert MM/DD/YYYY to YYYY-MM-DD
  const usRegex = /^\d{2}\/\d{2}\/\d{4}$/;
  if (usRegex.test(dateString)) {
    const [month, day, year] = dateString.split('/');
    return `${year}-${month}-${day}`;
  }
  
  return dateString;
}
