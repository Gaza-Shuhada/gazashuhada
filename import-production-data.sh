#!/bin/bash

# Import Production Data Script
# This script helps you import data from production to your local database

echo "🔄 Gaza Shuhada - Import Production Data"
echo "=========================================="
echo ""

# Check if dump file is provided
if [ -z "$1" ]; then
  echo "❌ Error: No dump file provided"
  echo ""
  echo "Usage: ./import-production-data.sh <dump-file.sql>"
  echo ""
  echo "Options:"
  echo "  1. Get a database dump from production:"
  echo "     Ask your teammate to run:"
  echo "     pg_dump [production-db-url] > production-dump.sql"
  echo ""
  echo "  2. Or if you have access to Prisma Accelerate console:"
  echo "     - Go to cloud.prisma.io"
  echo "     - Select the project"
  echo "     - Export/download a backup"
  echo ""
  echo "  3. Then run this script:"
  echo "     ./import-production-data.sh production-dump.sql"
  exit 1
fi

DUMP_FILE=$1

# Check if file exists
if [ ! -f "$DUMP_FILE" ]; then
  echo "❌ Error: File '$DUMP_FILE' not found"
  exit 1
fi

echo "📁 Found dump file: $DUMP_FILE"
echo ""
echo "⚠️  WARNING: This will DROP and recreate your local database!"
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Import cancelled"
  exit 1
fi

echo ""
echo "🗑️  Dropping existing database..."
dropdb gazashuhada 2>/dev/null || echo "Database didn't exist, creating new one..."

echo "📦 Creating fresh database..."
createdb gazashuhada

echo "📥 Importing data from $DUMP_FILE..."
psql -d gazashuhada -f "$DUMP_FILE" > /tmp/import.log 2>&1

if [ $? -eq 0 ]; then
  echo "✅ Import successful!"
  echo ""
  echo "📊 Database statistics:"
  psql -d gazashuhada -c "
    SELECT 
      'Persons' as table_name, COUNT(*) as count FROM \"Person\" 
    UNION ALL 
    SELECT 'Person Versions', COUNT(*) FROM \"PersonVersion\"
    UNION ALL 
    SELECT 'Community Submissions', COUNT(*) FROM \"CommunitySubmission\"
    UNION ALL 
    SELECT 'Bulk Uploads', COUNT(*) FROM \"BulkUpload\"
    UNION ALL 
    SELECT 'Change Sources', COUNT(*) FROM \"ChangeSource\"
    UNION ALL 
    SELECT 'Audit Logs', COUNT(*) FROM \"AuditLog\";
  "
  echo ""
  echo "✅ All done! Your local database now has production data."
  echo "🚀 Start the dev server: npm run dev"
else
  echo "❌ Import failed. Check /tmp/import.log for details"
  exit 1
fi

