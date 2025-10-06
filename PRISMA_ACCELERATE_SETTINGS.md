# Prisma Accelerate Configuration

## Required Settings for Bulk Upload Operations

This project requires specific Prisma Accelerate settings to handle bulk uploads of up to 70,000 records efficiently.

---

## ⚙️ Recommended Configuration

### Response Size: **15 MiB** (Maximum)
- **Default:** 5 MiB
- **Required:** 15 MiB
- **Reason:** 
  - Fetching all existing records (up to 70,000) for comparison requires large response payloads
  - Simulation results include detailed diffs that can be large
  - Larger response size prevents truncation and errors

### Query Duration: **60 seconds** (Maximum)
- **Default:** 10 seconds
- **Required:** 60 seconds
- **Reason:**
  - Complex queries fetching and comparing 70k records take time
  - Network latency through Accelerate adds overhead
  - Queries with multiple JOINs and aggregations need time
  - GroupBy operations to fetch version numbers

### Transaction Duration: **90 seconds** (Maximum)
- **Default:** 15 seconds
- **Required:** 90 seconds
- **Reason:**
  - ⚠️ **CRITICAL:** This is the most important setting
  - Each batch of 100 updates/deletes includes multiple queries with network round-trips
  - 15-second default causes "Transaction already closed" errors
  - 90 seconds allows for reasonable batch sizes while maintaining version history

---

## 🎯 How to Configure

### 1. Access Prisma Accelerate Dashboard
- Go to: https://console.prisma.io/
- Select your project
- Navigate to "Accelerate" settings
- Click on "Configure Limits"

### 2. Set the Sliders

```
Response Size:        |==================>| 15 MiB
                      1 MiB              20 MiB

Query Duration:       |==================>| 60 s
                      1 s                60 s

Transaction Duration: |==================>| 90 s
                      1 s                90 s
```

### 3. Save and Wait
- Click "Update response size" / "Update query duration" / "Update transaction duration"
- Wait 1-2 minutes for changes to propagate globally
- Restart your application

---

## 📊 Expected Performance

With these settings, here's what you can expect:

| Upload Type | Record Count | Expected Time |
|-------------|--------------|---------------|
| **First Upload** | 14,140 new records | 1-2 minutes |
| **Subsequent Uploads** | 20,000-60,000 (mixed) | 2-8 minutes |
| **Total (9 files)** | 345,532 total records | 25-40 minutes |

### Breakdown by Operation:
- **Inserts:** ~5-10 seconds for bulk createMany
- **Updates:** ~2-3 seconds per 100 records
- **Deletes:** ~2-3 seconds per 100 records

---

## 🚨 Troubleshooting

### Error: "Transaction already closed"
```
Transaction API error: Transaction already closed: 
The timeout for this transaction was 15000 ms...
```

**Solution:** Increase Transaction Duration to 90 seconds

---

### Error: "Response size limit exceeded"
```
Transaction API error: Response size exceeded 5242880 bytes
```

**Solution:** Increase Response Size to 15 MiB

---

### Error: "Query duration timeout"
```
Query timeout: Query exceeded 10000 ms
```

**Solution:** Increase Query Duration to 60 seconds

---

### Slow Uploads Despite Correct Settings

If uploads are still very slow (>10 minutes per file):

1. **Check Internet Connection**
   - Accelerate latency depends on your connection speed
   - Each batch has multiple network round-trips
   - Try from a location with better connectivity

2. **Reduce Batch Size** (if needed)
   - Edit `src/lib/bulk-upload-service-ultra-optimized.ts`
   - Change `UPDATE_BATCH_SIZE` from 100 to 50
   - Change `DELETE_BATCH_SIZE` from 100 to 50

3. **Monitor Accelerate Usage**
   - Check Accelerate dashboard for performance metrics
   - Look for slow queries or connection issues

---

## 💰 Cost Implications

**Good News:** These limit increases do NOT increase your base costs.

- Accelerate pricing is based on actual query volume and data transfer
- Setting higher limits just prevents artificial timeouts
- You only pay for what you actually use
- These are maximum limits, not quotas

---

## 🔄 When to Update These Settings

Update these settings:
- ✅ Before running bulk uploads for the first time
- ✅ If you see timeout errors
- ✅ When database grows beyond 100k records
- ✅ If adding more complex queries

You can leave these at maximum indefinitely - there's no downside.

---

## 📝 Alternative: Direct Database Connection

If Prisma Accelerate limitations become too restrictive, consider using a direct database connection instead:

### Pros of Direct Connection:
- No 90-second transaction limit
- Lower latency (no proxy)
- Faster bulk operations (5-10x faster)
- No response size limits

### Cons of Direct Connection:
- No automatic connection pooling
- No global edge caching
- No query acceleration
- Must manage connections manually

### To Switch to Direct Connection:

Update `.env`:
```bash
# Replace this:
DATABASE_URL="prisma://accelerate..."

# With this:
DATABASE_URL="postgresql://user:password@host:5432/database"
```

Then:
```bash
npx prisma generate
npm run dev
```

---

## 📚 Related Documentation

- [Prisma Accelerate Limits](https://www.prisma.io/docs/accelerate/limits)
- [Transaction Configuration](https://www.prisma.io/docs/orm/prisma-client/queries/transactions#transaction-options)
- [Bulk Operations Best Practices](https://www.prisma.io/docs/orm/prisma-client/queries/crud#create-multiple-records)

---

## ✅ Quick Checklist

Before running bulk uploads:

- [ ] Response Size set to **15 MiB**
- [ ] Query Duration set to **60 seconds**
- [ ] Transaction Duration set to **90 seconds**
- [ ] Settings saved in Accelerate dashboard
- [ ] Waited 1-2 minutes for propagation
- [ ] Restarted dev server
- [ ] Tested with smallest file first (2024-01-05.csv)

---

**Last Updated:** 2024-10-06
**Status:** ✅ Required for production bulk uploads

