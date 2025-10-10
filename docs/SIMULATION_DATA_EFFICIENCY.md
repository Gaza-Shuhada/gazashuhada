# Simulation Data Structure Analysis

**Date**: 2025-10-10  
**Issue**: Simulation data can be 20+ MB for large datasets  
**Question**: Is this designed efficiently?

## Current Reality

### Data Structure
```typescript
interface DiffItem {
  externalId: string;        // 12 bytes
  changeType: ChangeType;    // 8 bytes
  current?: {                // Full record (old state)
    name: string;            // ~30 bytes
    nameEnglish: string;     // ~20 bytes
    gender: Gender;          // 5 bytes
    dateOfBirth: Date;       // 25 bytes
  };
  incoming: {                // Full record (new state)
    name: string;            // ~30 bytes
    nameEnglish: string;     // ~20 bytes
    gender: Gender;          // 5 bytes
    dateOfBirth: Date;       // 25 bytes
  };
}
```

### Size Calculation (50K dataset)
- **Updates**: 31,000 × 180 bytes = **5.6 MB**
- **Inserts**: 18,000 × 80 bytes = **1.4 MB**
- **Deletes**: 1,000 × 80 bytes = **80 KB**
- **Total**: **~7 MB raw** → **~20 MB JSON stringified** (3x overhead)

### Why 3x Overhead?
JSON adds:
- Property names (`"externalId":`, `"current":`, etc.)
- Quotes around strings
- Whitespace and formatting
- Unicode escaping for Arabic text

Example:
```javascript
// Raw: ~80 bytes
{externalId:"MOH123",name:"محمد"}

// JSON: ~240 bytes  
{"externalId":"MOH123456","changeType":"UPDATE","current":{"name":"محمد أحمد عبد الله",...},"incoming":{...}}
```

---

## Is This Efficient? **NO!**

### Inefficiency #1: Storing Unchanged Data

For an update where **only dateOfBirth changed**:
```typescript
// We store this:
{
  current: {
    name: "محمد",           // Same
    nameEnglish: "Mohammed", // Same
    gender: "MALE",          // Same
    dateOfBirth: "1990-01"   // DIFFERENT
  },
  incoming: {
    name: "محمد",           // Same (duplicated!)
    nameEnglish: "Mohammed", // Same (duplicated!)
    gender: "MALE",          // Same (duplicated!)
    dateOfBirth: "1990-02"   // DIFFERENT
  }
}

// Should store this:
{
  externalId: "MOH123",
  delta: {
    dateOfBirth: ["1990-01", "1990-02"]  // Only the change
  }
}
```

**Waste**: ~160 bytes per update × 31K = **~5 MB of duplicated data**

### Inefficiency #2: Inserts Don't Need `current`

For inserts, we're storing:
```typescript
{
  externalId: "MOH123",
  changeType: "INSERT",
  current: undefined,      // Unnecessary
  incoming: { ... }
}
```

We could just store:
```typescript
["MOH123", "محمد أحمد", "Mohammed", "MALE", "1990-01-01"]
```

**Waste**: ~40% overhead for property names and structure

### Inefficiency #3: JSON is Not Compact

| Format | Size | Savings |
|--------|------|---------|
| JSON | 7 MB raw → 20 MB stringified | Baseline |
| JSON (minified) | 7 MB | 65% better |
| MessagePack | 4 MB | 80% better |
| Protocol Buffers | 3 MB | 85% better |
| Gzipped JSON | 2 MB | 90% better |

---

## Why Did We Design It This Way?

### Original Goal: "Trust Simulation"

**Problem we were solving**:
- Parsing CSV twice (simulate + apply) was slow
- Fetching database records twice was slow
- Computing diff twice was slow

**Solution**:
- Compute diff once during simulation
- Send full diff to server
- Server trusts the diff and applies it directly

**Worked great for**:
- Small datasets (<10K records → <1 MB)
- Medium datasets (<30K records → <3 MB)

**Broke down at**:
- Large datasets (>50K records → >7 MB → 20 MB JSON)

### The Trade-off We Made

```
Option A: Fast but big payload
- Simulate: Parse CSV, compute diff (60s)
- Apply: Use cached diff (90s)
- Total: 150s, but 20 MB payload

Option B: Slow but small payload  
- Simulate: Parse CSV, compute diff (60s)
- Apply: Re-parse CSV, re-compute diff (60s + 90s)
- Total: 210s, but 600 KB payload

Current: Hybrid
- Small files: Use Option A (fast)
- Large files: Use Option B (reliable)
```

---

## Better Design Options

### Option 1: Just Send IDs ⭐ (Simplest)

**What to send**:
```typescript
{
  summary: { inserts: 18000, updates: 31000, deletes: 1000 },
  insertIds: ["MOH001", "MOH002", ...],    // 216 KB
  updateIds: ["MOH100", "MOH101", ...],    // 372 KB
  deleteIds: ["MOH200", "MOH201", ...],    // 12 KB
}
```

**Total payload**: ~600 KB (97% reduction!)

**Server logic**:
```typescript
// Download CSV from blob
const rows = await downloadAndParseCSV(blobUrl);

// Apply only the changes simulation identified
const insertsToApply = rows.filter(r => insertIds.includes(r.external_id));
const updatesToApply = rows.filter(r => updateIds.includes(r.external_id));
// ...
```

**Pros**:
- ✅ Payload always under 1 MB (no 413 errors)
- ✅ Simple data structure
- ✅ Still avoids re-computing diff (uses simulation results)

**Cons**:
- ✗ Must download CSV on server (adds ~5-10s)
- ✗ Still need to parse CSV (adds ~5-10s)

**Performance**:
- Small files: +10s slower (60s → 70s)
- Large files: Same speed (already re-parsing in fallback)

### Option 2: Delta/Diff Format (Most Efficient)

**Store only what changed**:
```typescript
interface UpdateDiff {
  id: string,
  changed: {
    dateOfBirth?: [Date, Date],  // [old, new]
    gender?: [Gender, Gender],
    // Only include fields that changed
  }
}
```

**Savings**: ~70% reduction (5.6 MB → 1.7 MB)

**Pros**:
- ✅ Much smaller payload
- ✅ Clear what changed (good for auditing)

**Cons**:
- ✗ Complex apply logic (must merge with existing record)
- ✗ Still exceeds 4.5 MB for very large files (100K+)

### Option 3: Compress JSON ⚡ (Quick Win)

**Gzip compression**:
```typescript
import pako from 'pako';

const json = JSON.stringify(simulation);
const compressed = pako.gzip(json);
// 20 MB → 2-3 MB (85-90% reduction)
```

**Pros**:
- ✅ Easy to implement (add compression library)
- ✅ No logic changes needed
- ✅ Works for all file sizes

**Cons**:
- ✗ CPU overhead (compression + decompression)
- ✗ Still fails for very large files (150K+ records)
- ✗ Adds dependency

### Option 4: Always Re-Parse (Simplest of All)

**Remove "trust simulation" entirely**:
```typescript
// Client: Send only blob URL + metadata
await fetch('/api/apply', {
  body: JSON.stringify({
    blobUrl,
    dateReleased,
    comment
    // NO simulation data
  })
});

// Server: Always download and re-parse
const rows = await downloadAndParseCSV(blobUrl);
const diff = await computeDiff(rows);
await applyDiff(diff);
```

**Pros**:
- ✅ Payload always tiny (<1 KB)
- ✅ No payload size issues ever
- ✅ Simpler code (no hybrid logic)

**Cons**:
- ✗ Slower for ALL files (not just large)
- ✗ Loses "trust simulation" optimization

---

## Recommendation

### Short Term (Hotfix - Already Done) ✅
**Hybrid approach with 3 MB threshold**
- Small files: Send full simulation (fast)
- Large files: Re-parse CSV (reliable)
- **Status**: Implemented, ready to deploy

### Medium Term (Next Iteration) 🎯
**Option 1: Just Send IDs**

**Why**:
1. Simple to implement (minimal code change)
2. Payload always <1 MB (no 413 errors ever)
3. Still uses simulation results (avoids re-computing diff)
4. Only adds 10s to small files (acceptable)

**Implementation**:
```typescript
// 1. Change SimulationResult structure
interface SimulationResult {
  summary: { ... },
  insertIds: string[],  // Instead of inserts: DiffItem[]
  updateIds: string[],  // Instead of updates: DiffItem[]
  deleteIds: string[],  // Instead of deletions: DiffItem[]
}

// 2. Update client to send IDs only
const payload = {
  blobUrl,
  simulationIds: {
    inserts: simulation.insertIds,
    updates: simulation.updateIds,
    deletes: simulation.deleteIds,
  }
};

// 3. Update server to fetch data from CSV
const rows = await downloadAndParseCSV(blobUrl);
const insertsToApply = rows.filter(r => insertIds.includes(r.external_id));
```

**Estimated effort**: 2-3 hours  
**Performance impact**: +10s for small files, neutral for large files  
**Benefit**: No more payload size issues, simpler code

### Long Term (If Needed) 🔮
**Option 3: Compression**

Only if:
- We frequently process 100K+ record files
- The +10s for re-parsing becomes unacceptable
- We're willing to add compression dependency

---

## Conclusion

### Is current design efficient? **NO**

**Problems**:
1. Storing full records instead of deltas (5 MB waste)
2. Storing unchanged data for updates (duplication)
3. JSON adds 3x overhead (7 MB → 20 MB)

### Should we fix it? **YES (Medium Priority)**

**Why not urgent**:
- Current hybrid approach works (payload <3 MB uses fast path)
- Large files already use fallback (re-parse CSV)
- No more 413 errors

**Why fix eventually**:
- Cleaner architecture (no hybrid complexity)
- Better performance (no re-parsing for any size)
- More scalable (works for 100K+ records)

### Recommended fix: **Send IDs only**

- Simple to implement
- Eliminates payload size issues permanently
- Minimal performance impact
- Removes hybrid complexity

---

## Action Items

1. ✅ **Done**: Deploy current hybrid approach (hotfix)
2. 🎯 **Next**: Implement "send IDs only" approach
3. 📊 **Monitor**: Track payload sizes and apply times
4. 🔍 **Evaluate**: Consider compression if >100K files become common

---

**Last Updated**: 2025-10-10  
**Status**: Analysis complete, recommendation provided

