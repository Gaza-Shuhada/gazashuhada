# CSV Test Examples

This document contains test cases for the CSV parser validation.

## ✅ Valid CSV Examples

### Basic Valid CSV
```csv
external_id,name,gender,date_of_birth
P001,John Smith,MALE,1965-04-12
P002,Jane Doe,FEMALE,1972-11-05
P003,Alex Johnson,OTHER,1990-02-28
```

### CSV with Commas in Names (Properly Quoted)
```csv
external_id,name,gender,date_of_birth
P001,"Smith, John",MALE,1965-04-12
P002,"Doe-Martinez, Jane María",FEMALE,1972-11-05
P003,"Al-Hassan, Ahmed",MALE,1990-02-28
```

### CSV with Quotes in Names
```csv
external_id,name,gender,date_of_birth
P001,"Jane ""Janey"" Doe",FEMALE,1985-03-15
P002,John O'Brien,MALE,1992-06-20
```

### CSV with Case-Insensitive Gender
```csv
external_id,name,gender,date_of_birth
P001,John Smith,male,1965-04-12
P002,Jane Doe,Female,1972-11-05
P003,Alex Johnson,other,1990-02-28
```

---

## ❌ Invalid CSV Examples (With Expected Errors)

### Missing Required Column
```csv
external_id,name,date_of_birth
P001,John Smith,1965-04-12
```
**Expected Error:**
```
Missing required column(s): gender.
Your CSV headers: external_id, name, date_of_birth
Required headers: external_id, name, gender, date_of_birth
```

### Forbidden Column (Death Fields)
```csv
external_id,name,gender,date_of_birth,date_of_death
P001,John Smith,MALE,1965-04-12,2024-01-15
```
**Expected Error:**
```
CSV contains forbidden column(s): date_of_death.
Death-related fields cannot be included in bulk uploads.
Only these columns are allowed: external_id, name, gender, date_of_birth
```

### Extra Unexpected Column
```csv
external_id,name,gender,date_of_birth,address
P001,John Smith,MALE,1965-04-12,123 Main St
```
**Expected Error:**
```
CSV contains unexpected column(s): address.
Only these columns are allowed: external_id, name, gender, date_of_birth
Remove the extra columns and try again.
```

### Empty Required Field
```csv
external_id,name,gender,date_of_birth
P001,,MALE,1965-04-12
```
**Expected Error:**
```
Row 2: Missing required field "name". All fields are required and cannot be empty.
```

### Invalid Gender Value
```csv
external_id,name,gender,date_of_birth
P001,John Smith,M,1965-04-12
```
**Expected Error:**
```
Row 2: Invalid gender "M". Must be MALE, FEMALE, or OTHER (case-insensitive).
```

### Invalid Date Format
```csv
external_id,name,gender,date_of_birth
P001,John Smith,MALE,12/04/1965
```
**Expected Error:**
```
Row 2: Invalid date_of_birth "12/04/1965". Must be in YYYY-MM-DD format (e.g., 1990-12-25).
```

### Whitespace-Only Field
```csv
external_id,name,gender,date_of_birth
P001,   ,MALE,1965-04-12
```
**Expected Error:**
```
Row 2: name cannot be empty or contain only whitespace.
```

### Duplicate Column Headers
```csv
external_id,name,name,gender,date_of_birth
P001,John,Smith,MALE,1965-04-12
```
**Expected Error:**
```
CSV contains duplicate column(s): name.
Each column header must be unique.
```

### No Data Rows (Headers Only)
```csv
external_id,name,gender,date_of_birth
```
**Expected Error:**
```
CSV file contains no data rows (only headers or empty)
```

### Empty File
```csv

```
**Expected Error:**
```
CSV file is empty
```

---

## Validation Summary

The CSV parser now validates:

✅ **Structural Issues:**
- File not empty
- Has headers
- Has data rows
- All rows have same number of columns
- No duplicate headers

✅ **Required Columns:**
- `external_id` (must be present and non-empty)
- `name` (must be present and non-empty)
- `gender` (must be present and non-empty)
- `date_of_birth` (must be present and non-empty)

✅ **Forbidden Columns:**
- No `date_of_death`
- No `location_of_death`
- No `obituary`
- No extra unexpected columns

✅ **Field Validation:**
- `external_id`: Not empty or whitespace-only
- `name`: Not empty or whitespace-only
- `gender`: Must be MALE, FEMALE, or OTHER (case-insensitive)
- `date_of_birth`: Must be YYYY-MM-DD format and valid date

✅ **Edge Cases:**
- Handles commas in names (properly quoted)
- Handles quotes in names (escaped quotes)
- Trims whitespace from fields
- Case-insensitive gender values
- Clear, actionable error messages with row numbers

