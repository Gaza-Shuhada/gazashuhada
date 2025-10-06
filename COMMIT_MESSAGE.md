# fix: Add enhanced error logging for GitHub Issues #1 and #2

## Overview
Improved error logging and details for two production issues reported on GitHub:
- Issue #2: "Propose new record - Internal server error"
- Issue #1: "Bulk Upload - Failed to simulate upload"

## Changes Made

### Community Submit Endpoint (`/api/community/submit`)
- Added console logging to track user ID and role on submission attempts
- Enhanced error responses to include error details in addition to generic message
- Added stack trace logging for better debugging in production logs
- Error response now includes: `{ error: string, details: string }`

### Bulk Upload Simulate Endpoint (`/api/admin/bulk-upload/simulate`)
- Added console logging to track admin user ID and role
- Enhanced error responses to include error details
- Added stack trace logging for production debugging
- Error response now includes: `{ error: string, details: string }`

## Debugging Strategy

### For Users Experiencing Errors
The errors will now show more specific information instead of just "Internal server error". Users and developers can see:
1. What specific error occurred (via `details` field)
2. Which user ID triggered the error (server logs)
3. What role the user has (server logs)
4. Full stack trace (server logs)

### Common Issues to Check

#### Issue #2: Community Submission Errors
Most likely causes:
1. **Missing role assignment** - User needs to be authenticated (any role works)
2. **Database connection** - Check `DATABASE_URL` in production environment
3. **Blob storage issues** - Check `BLOB_READ_WRITE_TOKEN` if photo upload fails
4. **Invalid data format** - Check date formats, gender enum values

#### Issue #1: Bulk Upload Simulation Errors
Most likely causes:
1. **User not admin** - Only users with `role='admin'` can upload
2. **CSV parsing error** - Invalid CSV format or missing required columns
3. **Database connection** - Check `DATABASE_URL` in production
4. **Large file timeout** - File may be too large for single transaction

## Next Steps

### To Diagnose in Production
1. Check Vercel logs for the new console output:
   - Look for `[Community Submit]` logs
   - Look for `[Bulk Upload Simulate]` logs
2. Error responses now include `details` field with specific error message
3. Stack traces logged server-side for debugging

### If Issues Persist
1. Verify environment variables in Vercel dashboard
2. Check user's role assignment in Clerk dashboard
3. Run database migration: `npx prisma migrate deploy`
4. Check Vercel function logs for timeout errors
5. Verify Blob storage token is valid

## Files Modified
- `src/app/api/community/submit/route.ts`
- `src/app/api/admin/bulk-upload/simulate/route.ts`

## Testing
- ✅ Production build passes
- ✅ No TypeScript errors
- ✅ No linting errors
- ✅ Error responses now include details for debugging
