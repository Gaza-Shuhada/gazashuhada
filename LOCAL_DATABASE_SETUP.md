# Local Database Setup Guide

## ✅ Setup Complete!

Your local PostgreSQL database is now set up and running with the Gaza Shuhada project.

## 📊 Current Status

- **Database**: `gazashuhada` on PostgreSQL 14
- **Connection**: `postgresql://wil@localhost:5432/gazashuhada`
- **Status**: ✅ Connected and working (currently empty)
- **Dev Server**: Running on http://localhost:3000

## 🗂️ Database Tables Created

All tables are successfully created:
- `Person` - Main person records
- `PersonVersion` - Version history of persons
- `CommunitySubmission` - Community edit proposals
- `BulkUpload` - Bulk upload history
- `ChangeSource` - Change tracking
- `AuditLog` - Audit trail

## 📥 Importing Production Data

### Option 1: Get a Database Dump from Your Teammate

Ask your teammate to create a dump of the production database:

```bash
# They run this on their machine (with production access)
pg_dump "prisma+postgres://accelerate.prisma-data.net/?api_key=..." > production-dump.sql

# Or using Prisma Studio/Cloud interface to export data
```

Then they send you the `production-dump.sql` file.

### Option 2: Direct Database Export (if you have Prisma Console access)

1. Go to [cloud.prisma.io](https://cloud.prisma.io/)
2. Select the Gaza Shuhada project
3. Navigate to Accelerate → Data Browser
4. Export/download database backup

### Importing the Data

Once you have the dump file:

```bash
cd /Users/wil/dev/gazashuhada
./import-production-data.sh production-dump.sql
```

This will:
1. Drop your current local database
2. Create a fresh one
3. Import all production data
4. Show you statistics of imported records

## 🔧 Useful Commands

### Database Management

```bash
# View all tables
psql -d gazashuhada -c "\dt"

# Count records in each table
psql -d gazashuhada -c "SELECT COUNT(*) FROM \"Person\";"

# Open PostgreSQL prompt
psql gazashuhada

# Drop and recreate empty database
dropdb gazashuhada && createdb gazashuhada
npx prisma db push
```

### Prisma Commands

```bash
# Push schema changes to database
npx prisma db push

# Open Prisma Studio (visual database browser)
npx prisma studio

# Generate Prisma Client after schema changes
npx prisma generate

# Reset database (WARNING: deletes all data)
npx prisma db push --force-reset
```

### Development Server

```bash
# Start dev server
npm run dev

# Stop dev server
pkill -f "next dev"

# Build for production
npm run build

# Run linter
npm run lint
```

## 🗄️ Database Connection Strings

### Current Local Setup (.env and .env.local)
```
DATABASE_URL="postgresql://wil@localhost:5432/gazashuhada?schema=public"
```

### Production (Prisma Accelerate) - if you need to switch back
```
DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=..."
```

## 📝 Working with Data

### Using Prisma Studio (Recommended for beginners)

```bash
npx prisma studio
```

Opens a web interface at http://localhost:5555 where you can:
- Browse all tables
- Add/edit/delete records
- View relationships
- Export data

### Using psql (Command line)

```bash
# Connect to database
psql gazashuhada

# Some useful queries
SELECT COUNT(*) FROM "Person";
SELECT * FROM "Person" LIMIT 10;
SELECT * FROM "AuditLog" ORDER BY "createdAt" DESC LIMIT 20;

# Exit psql
\q
```

## 🚨 Troubleshooting

### Database Connection Errors

**Error**: "Connection refused"
```bash
# Check if PostgreSQL is running
brew services list | grep postgresql

# Start PostgreSQL
brew services start postgresql@14
```

**Error**: "Database does not exist"
```bash
# Recreate database
createdb gazashuhada
npx prisma db push
```

### Prisma Errors

**Error**: "Environment variable not found: DATABASE_URL"
```bash
# Make sure you have both .env and .env.local files
cd /Users/wil/dev/gazashuhada
cat .env.local > .env
```

**Error**: "Schema is out of sync"
```bash
# Resync schema
npx prisma db push
npx prisma generate
```

### Dev Server Errors

**Error**: Still seeing old Prisma errors
```bash
# Restart the dev server
pkill -f "next dev"
npm run dev
```

## 📚 Next Steps

1. ✅ Database is set up and working
2. ⏳ **Import production data** (if needed)
3. ✅ Dev server is running
4. 🚀 Start developing!

### Quick Test

Visit these URLs to verify everything works:

- Main app: http://localhost:3000
- API test: http://localhost:3000/api/public/persons?page=1&limit=10
- Prisma Studio: Run `npx prisma studio` → http://localhost:5555

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review the logs in the terminal
3. Ask your teammate for help with production data access
4. Check the project docs in `/docs` folder

---

**🎉 You're all set! Happy coding!**

