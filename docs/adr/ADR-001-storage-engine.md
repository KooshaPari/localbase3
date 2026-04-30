# ADR-001: Storage Engine Selection

**Document ID:** PHENOTYPE_LOCALBASE3_ADR_001  
**Status:** Accepted  
**Last Updated:** 2026-04-03  
**Author:** Phenotype Architecture Team  
**Deciders:** LocalBase3 Core Team  
**Technical Story:** Provider Node Local Storage Implementation

---

## Table of Contents

1. [Context](#1-context)
2. [Decision](#2-decision)
3. [Consequences](#3-consequences)
4. [Architecture Diagrams](#4-architecture-diagrams)
5. [Code Examples](#5-code-examples)
6. [Cross-References](#6-cross-references)

---

## 1. Context

### 1.1 Problem Statement

LocalBase3 provider nodes require a robust local storage solution to manage:

- **Job lifecycle state**: Tracking jobs from assignment through completion
- **Metrics and telemetry**: GPU utilization, job throughput, response times
- **Configuration**: Provider settings, model registry, pricing configuration
- **Blockchain state cache**: Cached provider registry, model metadata, governance parameters
- **Offline operation**: Continuing to function during network partitions
- **Result buffering**: Storing job results for later submission when offline

The storage solution must meet the following requirements:

1. **Embedded**: No separate database server process; runs within the provider node
2. **Durable**: Survives crashes and power failures without data loss
3. **Performant**: Sub-millisecond reads for cache lookups, sub-10ms writes for job updates
4. **Transactional**: ACID guarantees for job state transitions
5. **Compact**: Minimal disk footprint (provider nodes may have limited storage)
6. **Cross-platform**: Runs on Linux (primary), macOS (development), Windows (optional)
7. **Well-supported**: Active maintenance, community support, clear upgrade path

### 1.2 Current State

The existing provider node implementation uses an in-memory Map-based database (`src/services/database.js`) with mock data. This approach is suitable for prototyping but inadequate for production:

```javascript
// Current implementation (inadequate for production)
const db = {
  users: new Map(),
  apiKeys: new Map(),
  transactions: []
};
```

**Limitations of current approach:**
- No persistence (data lost on restart)
- No transactional guarantees
- No concurrent access safety
- No query capabilities beyond simple lookups
- No crash recovery
- No offline resilience

### 1.3 Options Considered

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **SQLite + WAL** | Embedded relational database with Write-Ahead Logging | Mature, ACID, SQL, zero-config, ubiquitous | Single writer, limited concurrency |
| **RocksDB** | Facebook's embedded KV store (LSM-tree) | High write throughput, compression, configurable | No SQL, complex tuning, no built-in replication |
| **LMDB** | Lightning Memory-Mapped Database | Zero-copy reads, MVCC, extremely fast reads | Single writer, memory-mapped, less flexible |
| **LevelDB** | Google's embedded KV store | Simple API, good performance | Less maintained than RocksDB, fewer features |
| **NeDB** | Embedded document database (MongoDB-like) | Simple API, JSON-native | Deprecated, no WAL, limited scalability |
| **PouchDB** | JavaScript document DB with sync | Built-in sync, CouchDB compatible | Heavy, IndexedDB dependency, slower |

### 1.4 Evaluation Criteria

```
┌─────────────────────────────────────────────────────────┐
│              Evaluation Criteria                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. Durability (weight: 25%)                            │
│     • Crash recovery capabilities                       │
│     • Write-ahead logging or equivalent                 │
│     • Data integrity guarantees                         │
│                                                         │
│  2. Performance (weight: 20%)                           │
│     • Read latency (p99)                                │
│     • Write throughput                                  │
│     • Concurrent access patterns                        │
│                                                         │
│  3. Developer Experience (weight: 15%)                  │
│     • API simplicity                                    │
│     • Query capabilities                                │
│     • Tooling and debugging                             │
│                                                         │
│  4. Operational Simplicity (weight: 15%)                │
│     • Zero configuration                                │
│     • Backup and restore                                │
│     • Maintenance overhead                              │
│                                                         │
│  5. Ecosystem (weight: 15%)                             │
│     • Community support                                 │
│     • Third-party tools                                 │
│     • Long-term viability                               │
│                                                         │
│  6. Resource Efficiency (weight: 10%)                   │
│     • Memory footprint                                  │
│     • Disk usage                                        │
│     • CPU overhead                                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Decision

### 2.1 Primary Decision

**Selected: SQLite with Write-Ahead Logging (WAL) mode as the primary storage engine for provider node local state.**

Additionally, **RocksDB** is selected for the job queue (high-throughput append operations), and **LMDB** is selected for the blockchain state cache (zero-copy read performance).

### 2.2 Rationale

**SQLite + WAL** provides the optimal balance for the primary use case:

1. **Maturity**: 30+ years of development, deployed in billions of devices
2. **ACID guarantees**: Full transactional safety with WAL mode
3. **SQL interface**: Rich query capabilities for job history, metrics analysis
4. **Zero configuration**: Single file, no server process, no setup required
5. **Crash recovery**: WAL mode provides fast recovery after crashes
6. **Concurrent reads**: Multiple readers can access the database simultaneously
7. **Cross-platform**: Works on all target operating systems
8. **Tooling**: Extensive ecosystem (DB Browser for SQLite, sqlite-utils, etc.)

**RocksDB** for job queue:
- Optimized for high-throughput sequential writes
- Background compaction manages disk space automatically
- Configurable write buffers and compression

**LMDB** for blockchain state cache:
- Memory-mapped files enable zero-copy reads
- Multiple concurrent readers without locks
- Ideal for read-heavy cache access patterns

### 2.3 Storage Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Multi-Engine Storage Architecture            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │              Provider Node Application            │    │
│  └──────────────────────┬──────────────────────────┘    │
│                         │                               │
│         ┌───────────────┼───────────────┐               │
│         │               │               │               │
│         ▼               ▼               ▼               │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │   SQLite    │ │  RocksDB    │ │    LMDB     │       │
│  │   (WAL)     │ │             │ │             │       │
│  │             │ │             │ │             │       │
│  │ • Job state │ │ • Job queue │ │ • Blockchain│       │
│  │ • Metrics   │ │ • Event log │ │   state     │       │
│  │ • Config    │ │ • Audit log │ │   cache     │       │
│  │ • Sync state│ │             │ │ • Model     │       │
│  │             │ │             │ │   metadata  │       │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘       │
│         │               │               │               │
│         ▼               ▼               ▼               │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │ provider.db │ │   queue/    │ │   cache/    │       │
│  │ (single     │ │  (SST files)│ │ (data.mdb)  │       │
│  │  file)      │ │             │ │ (lock.mdb)  │       │
│  └─────────────┘ └─────────────┘ └─────────────┘       │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │              File System Layout                   │    │
│  │                                                   │    │
│  │  /var/localbase/provider/                        │    │
│  │  ├── state/                                      │    │
│  │  │   ├── provider.db                             │    │
│  │  │   ├── provider.db-wal                         │    │
│  │  │   └── provider.db-shm                         │    │
│  │  ├── queue/                                      │    │
│  │  │   ├── CURRENT                                 │    │
│  │  │   ├── LOG                                     │    │
│  │  │   ├── LOCK                                    │    │
│  │  │   └── *.sst                                   │    │
│  │  ├── cache/                                      │    │
│  │  │   ├── data.mdb                                │    │
│  │  │   └── lock.mdb                                │    │
│  │  └── config/                                     │    │
│  │      └── provider.json                           │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### 2.4 Configuration

**SQLite Configuration:**
```javascript
const db = new Database('state/provider.db');
db.pragma('journal_mode = WAL');           // Write-ahead logging
db.pragma('synchronous = NORMAL');         // Balance safety/performance
db.pragma('cache_size = -64000');          // 64MB page cache
db.pragma('foreign_keys = ON');            // Referential integrity
db.pragma('wal_autocheckpoint = 1000');    // Checkpoint every 1000 pages
db.pragma('mmap_size = 268435456');        // 256MB memory mapping
db.pragma('journal_size_limit = 67108864');// 64MB WAL size limit
```

**RocksDB Configuration:**
```javascript
await db.open({
  createIfMissing: true,
  compression: true,                      // Snappy compression
  blockSize: 65536,                       // 64KB blocks
  cacheSize: 256 * 1024 * 1024,           // 256MB block cache
  maxOpenFiles: 5000,                     // Keep files open
  writeBufferSize: 64 * 1024 * 1024,      // 64MB memtable
  maxWriteBufferNumber: 2,                // 2 memtables
  level0FileNumCompactionTrigger: 4,      // Compact at 4 L0 files
  maxBackgroundCompactions: 2,            // Background threads
});
```

**LMDB Configuration:**
```javascript
const cacheDb = lmdb.open('cache/', {
  mapSize: 1024 * 1024 * 1024,            // 1GB max size
  maxDbs: 5,                              // Named databases
  maxReaders: 64,                         // Concurrent readers
  noSync: false,                          // Ensure durability
  noMetaSync: false,                      // Sync metadata
});
```

---

## 3. Consequences

### 3.1 Positive Consequences

1. **Production-grade durability**: WAL mode ensures no data loss on crash, with automatic recovery on restart. The write-ahead log captures all changes before they are applied to the main database file.

2. **Rich query capabilities**: SQL enables complex queries for job history analysis, metrics aggregation, and provider performance reporting without additional tooling.

3. **Zero operational overhead**: No separate database process to manage, monitor, or maintain. The database is a single file that moves with the application.

4. **Excellent tooling ecosystem**: DB Browser for SQLite for debugging, sqlite-utils for CLI operations, and extensive documentation and community support.

5. **Proven at scale**: SQLite is deployed in every iOS device, Android device, macOS, Windows 10+, Firefox, Chrome, Skype, Dropbox, and countless other applications. It has been battle-tested for decades.

6. **Multi-engine optimization**: Using RocksDB for the job queue and LMDB for the cache allows each storage engine to excel at its specific workload pattern (write-heavy vs read-heavy).

7. **Backup simplicity**: Database files can be backed up using standard file copy operations (with WAL checkpoint). No specialized backup tools required.

8. **Cross-platform compatibility**: Works identically on Linux, macOS, and Windows, enabling consistent development and production environments.

### 3.2 Negative Consequences

1. **Single-writer limitation**: SQLite allows only one writer at a time. For the provider node use case (single process), this is not a limitation, but it prevents horizontal scaling of the storage layer.

2. **No built-in replication**: Unlike distributed databases, SQLite has no native replication. Blockchain state sync must be implemented at the application layer (see ADR-002).

3. **Disk I/O contention**: All three storage engines (SQLite, RocksDB, LMDB) compete for disk I/O. On systems with slow storage (HDD), this could become a bottleneck. Mitigated by using SSDs.

4. **Memory overhead**: Running three database engines increases memory usage. SQLite (64MB cache) + RocksDB (256MB cache) + LMDB (1GB map) = ~1.3GB memory overhead. Acceptable for provider nodes with 8GB+ RAM.

5. **Schema migration complexity**: SQLite has limited ALTER TABLE support. Schema migrations require careful planning and may involve table recreation for significant changes.

6. **RocksDB operational complexity**: RocksDB requires tuning of compaction settings, write buffer sizes, and cache configurations. Incorrect tuning can lead to write stalls or excessive disk usage.

### 3.3 Neutral Consequences

1. **File-based storage**: Database files grow over time and require periodic maintenance (VACUUM for SQLite, compaction for RocksDB). This is managed by the state pruner (see Section 8.3 of SOTA).

2. **No native encryption**: SQLite does not encrypt data at rest by default. SQLCipher extension is available but adds complexity. Provider nodes should rely on filesystem-level encryption (LUKS, FileVault) instead.

3. **Query performance limits**: SQLite is not optimized for analytical queries over large datasets. For complex analytics, metrics should be exported to DuckDB or a time-series database.

4. **Version coupling**: The application is coupled to specific versions of SQLite, RocksDB, and LMDB native bindings. Updates require testing across all target platforms.

---

## 4. Architecture Diagrams

### 4.1 Data Flow: Write Path

```
┌─────────────────────────────────────────────────────────┐
│              Write Path Architecture                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Application Write Request                              │
│         │                                               │
│         ▼                                               │
│  ┌─────────────────┐                                    │
│  │  Write Router   │                                    │
│  │  (determines    │                                    │
│  │   target engine)│                                    │
│  └────────┬────────┘                                    │
│           │                                             │
│     ┌─────┴─────┐                                       │
│     │           │                                       │
│     ▼           ▼                                       │
│  ┌─────┐   ┌─────────┐                                  │
│  │ Job │   │  Job    │                                  │
│  │State│   │  Queue  │                                  │
│  │ │   │   │         │                                  │
│  │ ▼   │   │  ▼      │                                  │
│  │SQLite│   │ RocksDB │                                  │
│  │WAL   │   │MemTable │                                  │
│  │ │    │   │  │      │                                  │
│  │ ▼    │   │  ▼      │                                  │
│  │WAL   │   │  WAL    │                                  │
│  │File  │   │  File   │                                  │
│  │ │    │   │  │      │                                  │
│  │ ▼    │   │  ▼      │                                  │
│  │DB    │   │  SST    │                                  │
│  │File  │   │  Files  │                                  │
│  └─────┘   └─────────┘                                  │
│                                                         │
│  Write Characteristics:                                 │
│  • SQLite: Sequential WAL append, checkpoint on idle    │
│  • RocksDB: MemTable + WAL, background compaction       │
│  • LMDB: Memory-mapped write, single writer             │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Data Flow: Read Path

```
┌─────────────────────────────────────────────────────────┐
│              Read Path Architecture                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Application Read Request                               │
│         │                                               │
│         ▼                                               │
│  ┌─────────────────┐                                    │
│  │  Read Router    │                                    │
│  │  (determines    │                                    │
│  │   target engine)│                                    │
│  └────────┬────────┘                                    │
│           │                                             │
│     ┌─────┼─────────────┐                               │
│     │     │             │                               │
│     ▼     ▼             ▼                               │
│  ┌─────┐ ┌─────────┐ ┌──────┐                          │
│  │SQLite│ │ RocksDB │ │ LMDB │                          │
│  │      │ │         │ │      │                          │
│  │Page  │ │Block    │ │Zero- │                          │
│  │Cache │ │Cache    │ │Copy  │                          │
│  │      │ │         │ │Read  │                          │
│  │  │   │ │  │      │ │  │   │                          │
│  │  ▼   │ │  ▼      │ │  ▼   │                          │
│  │B-Tree│ │Bloom    │ │B+Tree│                          │
│  │Lookup│ │Filter   │ │Lookup│                          │
│  │      │ │  │      │ │      │                          │
│  │      │ │  ▼      │ │      │                          │
│  │      │ │SST      │ │      │                          │
│  │      │ │Lookup   │ │      │                          │
│  └─────┘ └─────────┘ └──────┘                          │
│                                                         │
│  Read Characteristics:                                  │
│  • SQLite: Page cache + B-tree, concurrent readers      │
│  • RocksDB: Bloom filter + SST lookup, merge on read    │
│  • LMDB: Memory-mapped, OS page cache, zero-copy        │
└─────────────────────────────────────────────────────────┘
```

### 4.3 WAL Mode Operation

```
┌─────────────────────────────────────────────────────────┐
│              SQLite WAL Mode Operation                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Normal Operation:                                      │
│  ┌──────────────┐    ┌──────────────┐    ┌───────────┐  │
│  │  Application │───▶│  WAL File    │───▶│  DB File  │  │
│  │  (Writer)    │    │  (Append)    │    │  (Main)   │  │
│  └──────────────┘    └──────┬───────┘    └───────────┘  │
│                             │                           │
│                      Checkpoint                         │
│                      (periodic)                         │
│                             │                           │
│  ┌──────────────┐    ┌──────▼───────┐                   │
│  │  Readers     │◀───│  WAL + DB    │                   │
│  │  (Concurrent)│    │  (Snapshot)  │                   │
│  └──────────────┘    └──────────────┘                   │
│                                                         │
│  Crash Recovery:                                        │
│  ┌──────────────┐    ┌──────────────┐                   │
│  │  Crash       │───▶│  Recovery    │                   │
│  │  (Power loss)│    │  (Replay WAL)│                   │
│  └──────────────┘    └──────┬───────┘                   │
│                             │                           │
│                             ▼                           │
│                      ┌──────────────┐                   │
│                      │  Consistent  │                   │
│                      │  State       │                   │
│                      └──────────────┘                   │
│                                                         │
│  Checkpoint Process:                                    │
│  1. WAL reaches threshold (1000 pages)                  │
│  2. Writer pauses new writes                            │
│  3. WAL frames copied to main DB file                   │
│  4. WAL file truncated (or kept for reuse)              │
│  5. Writer resumes                                      │
└─────────────────────────────────────────────────────────┘
```

---

## 5. Code Examples

### 5.1 Provider State Manager

```javascript
const Database = require('better-sqlite3');

class ProviderStateManager {
  constructor(dbPath) {
    this.db = new Database(dbPath);
    this.configureDatabase();
    this.initializeSchema();
  }

  configureDatabase() {
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('cache_size = -64000');
    this.db.pragma('foreign_keys = ON');
    this.db.pragma('wal_autocheckpoint = 1000');
  }

  initializeSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS provider_info (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      );

      CREATE TABLE IF NOT EXISTS jobs (
        job_id TEXT PRIMARY KEY,
        model TEXT NOT NULL,
        status TEXT NOT NULL,
        input_hash TEXT,
        output_hash TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        assigned_at INTEGER,
        started_at INTEGER,
        completed_at INTEGER,
        processing_time_ms INTEGER,
        prompt_tokens INTEGER,
        completion_tokens INTEGER,
        error_code TEXT,
        error_message TEXT
      );

      CREATE TABLE IF NOT EXISTS metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        gpu_utilization REAL,
        gpu_memory_used_mb INTEGER,
        jobs_completed INTEGER DEFAULT 0,
        tokens_processed INTEGER DEFAULT 0,
        response_time_p50_ms REAL,
        response_time_p95_ms REAL
      );

      CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
      CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON metrics(timestamp DESC);
    `);
  }

  // Atomic job state transition
  transitionJobState(jobId, fromStatus, toStatus, metadata = {}) {
    const stmt = this.db.prepare(`
      UPDATE jobs SET 
        status = ?,
        assigned_at = CASE WHEN ? = 'assigned' AND assigned_at IS NULL 
          THEN strftime('%s', 'now') ELSE assigned_at END,
        started_at = CASE WHEN ? = 'running' AND started_at IS NULL 
          THEN strftime('%s', 'now') ELSE started_at END,
        completed_at = CASE WHEN ? = 'completed' AND completed_at IS NULL 
          THEN strftime('%s', 'now') ELSE completed_at END,
        output_hash = COALESCE(?, output_hash),
        processing_time_ms = COALESCE(?, processing_time_ms),
        prompt_tokens = COALESCE(?, prompt_tokens),
        completion_tokens = COALESCE(?, completion_tokens),
        error_code = COALESCE(?, error_code),
        error_message = COALESCE(?, error_message)
      WHERE job_id = ? AND status = ?
    `);

    const result = stmt.run(
      toStatus, toStatus, toStatus, toStatus,
      metadata.outputHash, metadata.processingTimeMs,
      metadata.promptTokens, metadata.completionTokens,
      metadata.errorCode, metadata.errorMessage,
      jobId, fromStatus
    );

    if (result.changes === 0) {
      throw new Error(
        `Job ${jobId} not found or not in status ${fromStatus}`
      );
    }

    return result;
  }

  // Batch metrics insertion with transaction
  recordMetricsBatch(metricsArray) {
    const insert = this.db.prepare(`
      INSERT INTO metrics (
        timestamp, gpu_utilization, gpu_memory_used_mb,
        jobs_completed, tokens_processed,
        response_time_p50_ms, response_time_p95_ms
      ) VALUES (
        @timestamp, @gpu_utilization, @gpu_memory_used_mb,
        @jobs_completed, @tokens_processed,
        @response_time_p50_ms, @response_time_p95_ms
      )
    `);

    const insertMany = this.db.transaction((metrics) => {
      for (const m of metrics) {
        insert.run(m);
      }
    });

    insertMany(metricsArray);
  }

  // Query with pagination
  getJobsByStatus(status, limit = 50, offset = 0) {
    return this.db.prepare(`
      SELECT * FROM jobs 
      WHERE status = ? 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `).all(status, limit, offset);
  }

  // Aggregate metrics
  getAggregatedMetrics(hours = 24) {
    const cutoffTimestamp = Math.floor(
      (Date.now() - hours * 60 * 60 * 1000) / 1000
    );

    return this.db.prepare(`
      SELECT 
        COUNT(*) as data_points,
        AVG(gpu_utilization) as avg_gpu_util,
        MAX(gpu_utilization) as max_gpu_util,
        SUM(jobs_completed) as total_jobs,
        SUM(tokens_processed) as total_tokens,
        AVG(response_time_p50_ms) as avg_p50,
        MAX(response_time_p95_ms) as max_p95
      FROM metrics
      WHERE timestamp >= ?
    `).get(cutoffTimestamp);
  }

  close() {
    this.db.pragma('wal_checkpoint(TRUNCATE)');
    this.db.close();
  }
}
```

### 5.2 Schema Migration System

```javascript
class SchemaMigration {
  constructor(db) {
    this.db = db;
    this.ensureMigrationTable();
  }

  ensureMigrationTable() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at INTEGER DEFAULT (strftime('%s', 'now'))
      );
    `);
  }

  getCurrentVersion() {
    const row = this.db.prepare(
      'SELECT MAX(version) as version FROM schema_migrations'
    ).get();
    return row.version || 0;
  }

  async migrate(migrations) {
    const currentVersion = this.getCurrentVersion();
    
    for (const migration of migrations) {
      if (migration.version <= currentVersion) continue;

      console.log(`Applying migration ${migration.version}: ${migration.name}`);
      
      const tx = this.db.transaction(() => {
        migration.up(this.db);
        this.db.prepare(
          'INSERT INTO schema_migrations (version, name) VALUES (?, ?)'
        ).run(migration.version, migration.name);
      });

      tx();
    }
  }
}

// Usage
const migrations = [
  {
    version: 1,
    name: 'initial_schema',
    up: (db) => {
      db.exec(`CREATE TABLE jobs (...);`);
    },
  },
  {
    version: 2,
    name: 'add_error_fields',
    up: (db) => {
      db.exec(`
        ALTER TABLE jobs ADD COLUMN error_code TEXT;
        ALTER TABLE jobs ADD COLUMN error_message TEXT;
      `);
    },
  },
  {
    version: 3,
    name: 'add_metrics_table',
    up: (db) => {
      db.exec(`CREATE TABLE metrics (...);`);
    },
  },
];

const migration = new SchemaMigration(db);
await migration.migrate(migrations);
```

---

## 6. Cross-References

### 6.1 Related ADRs

| ADR | Title | Relationship |
|-----|-------|-------------|
| [ADR-002](./ADR-002-sync-strategy.md) | Offline Sync Strategy | Defines how local state syncs with blockchain |
| [ADR-003](./ADR-003-query-language.md) | Query Language Design | Defines query patterns on top of storage engines |

### 6.2 Related Documents

| Document | Path | Relationship |
|----------|------|-------------|
| SOTA Research | `docs/research/LOCAL_DATABASES_SOTA.md` | Comprehensive technology analysis |
| SPEC | `SPEC.md` | System specification with storage requirements |
| Architecture | `localbase/docs/architecture.md` | High-level system architecture |

### 6.3 External References

1. [SQLite WAL Mode Documentation](https://www.sqlite.org/wal.html)
2. [RocksDB Tuning Guide](https://github.com/facebook/rocksdb/wiki/RocksDB-Tuning-Guide)
3. [LMDB Documentation](http://www.lmdb.tech/doc/)
4. [better-sqlite3 Documentation](https://github.com/WiseLibs/better-sqlite3)

---

*ADR Version: 1.0.0*  
*Status: Accepted*  
*Last Updated: 2026-04-03*
