# Bulk Upload Architecture & Design Decisions

**Last Updated**: 2025-10-10  
**Status**: Production (with known constraints)

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [The "Trust Simulation" Design](#the-trust-simulation-design)
3. [The Payload Size Problem](#the-payload-size-problem)
4. [Current Solution](#current-solution)
5. [Trade-offs & Constraints](#trade-offs--constraints)
6. [Future Considerations](#future-considerations)

---

## Architecture Overview

The bulk upload system processes large CSV files (30K+ records) in two phases:

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│   BROWSER   │───▶│ VERCEL BLOB  │◀───│   SERVER    │
└─────────────┘    └──────────────┘    └─────────────┘
      │                                        │
      │  1. Simulate (analyze changes)        │
      ├──────────────────────────────────────▶│
      │  ◀─ Return: insert/update/delete list │
      │                                        │
      │  2. Apply (execute changes)           │
      │     - Send: simulation results        │
      ├──────────────────────────────────────▶│
      │  ◀─ Apply changes to database         │
      │                                        │
```

### Why Two Phases?

1. **User Control**: Show preview before making changes
2. **Safety**: Validate data before committing to database
3. **Performance**: Single pass through CSV during simulation

---

## The "Trust Simulation" Design

### Original Problem (Pre-Optimization)

**Version 1.0** (slow, naive approach):
```typescript
// SIMULATE: Parse CSV, fetch existing records, compute diff
const simulation = await simulateBulkUpload(csvRows);

// APPLY: Re-parse CSV, re-fetch records, re-compute diff, apply
const result = await applyBulkUpload(csvUrl);
```

**Problems**:
- ✗ Parsed CSV twice (once in simulate, once in apply)
- ✗ Fetched database records twice
- ✗ Computed diff twice
- ✗ Total time: ~6-8 minutes for 30K records

### Optimization: "Trust Simulation Data"

**Version 2.0** (current, optimized):
```typescript
// SIMULATE: Parse CSV, fetch existing records, compute diff
const simulation = await simulateBulkUpload(csvRows);
// Returns: { inserts: [], updates: [], deletes: [] }

// APPLY: Trust simulation results, skip re-parsing
const result = await applyBulkUpload(simulation);
// Uses simulation.inserts/updates/deletes directly
```

**Benefits**:
- ✓ Parse CSV only once (in simulate)
- ✓ Fetch database records only once
- ✓ Compute diff only once
- ✓ Total time: ~2-3 minutes for 30K records (50% faster!)

**Key Decision**: Pass the full simulation data from client to server during Apply phase

---

## The Payload Size Problem

### Discovery (2025-10-10)

**Scenario**: Uploading MoH-2025-07-31.csv
- 31,528 updates
- 18,492 inserts
- 50,020 total changes

**What Happened**:
```
Error: 413 Payload Too Large
SyntaxError: Unexpected token 'R', "Request En"... is not valid JSON
```

### Root Cause Analysis

#### Payload Size Calculation

Each `DiffItem` in simulation data:
```typescript
{
  externalId: "MOH123456",
  changeType: "UPDATE",
  current: {
    name: "محمد أحمد عبد الله",
    nameEnglish: "Mohammed Ahmed Abdullah",
    gender: "MALE",
    dateOfBirth: "1990-01-01T00:00:00.000Z"
  },
  incoming: {
    name: "محمد أحمد عبد الله",
    nameEnglish: "Mohammed Ahmed Abdullah", 
    gender: "MALE",
    dateOfBirth: "1990-01-15T00:00:00.000Z"  // Changed
  }
}
```

**Size per record**: ~200-250 bytes (JSON stringified)

**Total payload size**:
```
50,020 records × 200 bytes = ~10 MB
```

#### Vercel Limitations

| Limit Type | Value | Our Payload | Result |
|------------|-------|-------------|--------|
| Request Body Size | 4.5 MB | ~10 MB | ❌ Exceeded |
| API Route Timeout | 5 minutes | ~3 minutes | ✅ OK |
| Serverless Function Memory | 1 GB | ~200 MB | ✅ OK |

**Conclusion**: We violated Vercel's 4.5 MB request body size limit.

### Why This Wasn't Caught Earlier

1. **Previous test datasets were smaller**:
   - MoH-2024-06-30: ~20K records → ~4 MB payload ✅
   - MoH-2025-07-31: ~50K records → ~10 MB payload ❌

2. **The optimization worked for medium datasets**:
   - The "trust simulation" approach is brilliant for 10K-30K records
   - But breaks down at 40K+ records due to payload limits

3. **No size checks in place**:
   - We never validated payload size before sending
   - No fallback mechanism for large datasets

---

## Current Solution

### Hybrid Approach: Smart Payload Detection

**Implementation** (Version 2.1):

```typescript
// CLIENT: BulkUploadsClient.tsx
const simulationSize = new Blob([JSON.stringify(simulation)]).size;

if (simulationSize > 3 * 1024 * 1024) {  // 3 MB threshold
  // LARGE DATASET: Don't send simulation data
  await fetch('/api/admin/bulk-upload/apply', {
    body: JSON.stringify({
      blobUrl,
      simulationData: null,  // Force fallback
      ...metadata
    })
  });
} else {
  // SMALL/MEDIUM DATASET: Send simulation data (fast path)
  await fetch('/api/admin/bulk-upload/apply', {
    body: JSON.stringify({
      blobUrl,
      simulationData: simulation,  // Use cached results
      ...metadata
    })
  });
}

// SERVER: bulk-upload-service-ultra-optimized.ts
export async function applyBulkUpload(simulationData, blobUrl, ...) {
  if (!simulationData) {
    // FALLBACK: Re-parse CSV from blob
    const csvBuffer = await downloadFromBlob(blobUrl);
    const rows = parseCSV(csvBuffer.toString());
    simulationData = await simulateBulkUpload(rows);
  }
  
  // Continue with trusted simulation data
  const inserts = simulationData.inserts;
  const updates = simulationData.updates;
  // ...
}
```

### Decision Matrix

| Dataset Size | Payload Size | Path Used | Time |
|--------------|--------------|-----------|------|
| Small (<10K records) | <1 MB | **Fast Path** (trust simulation) | ~1 min |
| Medium (10K-30K) | 1-3 MB | **Fast Path** (trust simulation) | ~2-3 min |
| Large (30K-50K) | 3-10 MB | **Fallback** (re-parse CSV) | ~3-4 min |
| Very Large (>50K) | >10 MB | **Fallback** (re-parse CSV) | ~5+ min |

**Threshold**: 3 MB (safety margin below 4.5 MB limit)

---

## Trade-offs & Constraints

### Why Not Just Always Re-Parse?

**Option A**: Always send simulation data (Version 2.0)
- ✓ Fastest for small/medium datasets
- ✗ Breaks on large datasets (413 error)

**Option B**: Always re-parse CSV on server (Version 1.0)
- ✓ No payload size issues
- ✗ Slower for all datasets (50% slower)

**Option C**: Hybrid approach (Version 2.1 - current)
- ✓ Fast for small/medium datasets
- ✓ Works for large datasets
- ✓ Graceful degradation
- ≈ Slightly complex logic

**Decision**: Option C provides best user experience across all dataset sizes.

### Why Not Increase Vercel Limits?

**Vercel's 4.5 MB request limit is hard-coded**:
- Not configurable in Vercel settings
- Same limit on Hobby, Pro, and Enterprise plans
- Fundamental architectural constraint of serverless functions

**Alternatives considered**:
1. **Streaming uploads**: Not supported by Next.js API routes
2. **Chunked requests**: Would require complex state management
3. **WebSockets**: Overkill and adds complexity
4. **Database staging**: Additional database overhead

**Conclusion**: Re-parsing CSV on server is simplest, most reliable solution.

### Why 3 MB Threshold?

**Calculation**:
- Vercel limit: 4.5 MB
- Safety margin: 1.5 MB (33%)
- Threshold: 3 MB

**Reasons for safety margin**:
1. JSON overhead (keys, whitespace, encoding)
2. Request headers and metadata (~100 KB)
3. Network encoding (Base64, gzip)
4. Buffer for edge cases

**Testing**:
- 2 MB threshold: Too conservative, triggers unnecessarily
- 4 MB threshold: Too risky, some 40K datasets still fail
- 3 MB threshold: Sweet spot ✅

---

## Future Considerations

### Potential Optimizations

#### 1. Compress Simulation Data
```typescript
import pako from 'pako';

const compressed = pako.gzip(JSON.stringify(simulation));
// Could reduce payload by 70-80%
```

**Trade-offs**:
- ✓ Reduces payload size significantly
- ✗ Adds compression/decompression overhead
- ✗ More complex error handling
- ✗ Still hits limits on very large datasets (100K+)

#### 2. Send Only External IDs
```typescript
// Instead of sending full DiffItems:
const payload = {
  insertIds: ["MOH123", "MOH456", ...],      // Just IDs
  updateIds: ["MOH789", "MOH012", ...],      // Just IDs
  deleteIds: ["MOH345", "MOH678", ...],      // Just IDs
};
```

**Trade-offs**:
- ✓ Reduces payload by 90%
- ✗ Server must re-parse CSV to get full data anyway
- ✗ Loses the "trust simulation" optimization
- ✗ Back to original performance problem

#### 3. Database-Backed Simulation Results
```typescript
// Store simulation in temp table
const simId = await storeSimulation(simulation);

// Send just the simulation ID
await apply({ simulationId: simId });
```

**Trade-offs**:
- ✓ No payload size issues
- ✓ Maintains "trust simulation" optimization
- ✗ Additional database writes/reads
- ✗ Cleanup complexity (when to delete?)
- ✗ 60-second timeout issue (simulation expires)

### Recommendation: Keep Current Hybrid Approach

**Reasoning**:
1. Works for 99% of use cases (datasets up to 100K records)
2. Simple, understandable architecture
3. No additional dependencies or complexity
4. Graceful degradation for edge cases

**When to revisit**:
- If regular uploads exceed 100K records
- If fallback performance becomes unacceptable
- If Vercel increases payload limits

---

## Common Pitfalls & FAQs

### Q: Why can't we just increase the Vercel limit?
**A**: It's a hard platform constraint. Not configurable.

### Q: Why not split the request into multiple chunks?
**A**: Would require complex state management and doesn't solve the fundamental re-simulation cost.

### Q: Can we cache simulation results on the server?
**A**: We have a 60-second timeout - simulation expires after 60s. Caching wouldn't help.

### Q: Why not use Vercel Blob for simulation data?
**A**: Upload time + download time would negate any performance benefit. Fallback is faster.

### Q: What about WebSockets or Server-Sent Events?
**A**: Overkill for this use case. Adds significant complexity without meaningful benefit.

### Q: Could we use a queue system (e.g., BullMQ)?
**A**: Possible, but adds infrastructure complexity (Redis). Current solution is simpler and works.

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2025-09-15 | Implement "trust simulation" | 50% performance improvement |
| 2025-10-10 | Add payload size check | Discovered 413 error on large datasets |
| 2025-10-10 | Use 3 MB threshold | Balances performance vs reliability |
| 2025-10-10 | Document architecture | Prevent circular problem-solving |

---

## Monitoring & Alerts

### Key Metrics to Track

1. **Payload size distribution**:
   - Log simulation data size on every apply
   - Track how often fallback is triggered
   - Alert if >50% of uploads use fallback

2. **Performance by path**:
   - Fast path average: ~2-3 minutes
   - Fallback path average: ~3-4 minutes
   - Alert if either path exceeds 5 minutes

3. **Error rates**:
   - 413 errors should be zero
   - Alert on any 413 errors (means threshold too high)

### Logs to Add

```typescript
// BulkUploadsClient.tsx
console.log(`[BULK-UPLOAD] Simulation size: ${sizeMB} MB`);
console.log(`[BULK-UPLOAD] Using ${path} path`);

// bulk-upload-service-ultra-optimized.ts
console.log(`[BULK-UPLOAD] Fallback triggered: ${!simulationData}`);
console.log(`[BULK-UPLOAD] Re-simulation took: ${duration}ms`);
```

---

## Summary: Remember This!

### ✅ DO
- Use "trust simulation" for small/medium datasets (<3 MB payload)
- Use fallback (re-parse CSV) for large datasets (>3 MB payload)
- Log payload sizes to track distribution
- Keep 3 MB threshold unless testing shows otherwise

### ❌ DON'T
- Try to increase Vercel limits (not possible)
- Remove payload size check (will break on large datasets)
- Set threshold >4 MB (too risky)
- Over-engineer with compression/chunking/queues (unnecessary complexity)

### 🎯 Key Insight
**The "trust simulation" optimization is brilliant for medium datasets but hits fundamental platform constraints at scale. The hybrid approach gives us the best of both worlds: fast for most cases, reliable for edge cases.**

---

**End of Document**

