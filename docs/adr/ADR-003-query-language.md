# ADR-003: Query Language Design

**Document ID:** PHENOTYPE_LOCALBASE3_ADR_003  
**Status:** Proposed  
**Last Updated:** 2026-04-03  
**Author:** Phenotype Architecture Team  
**Deciders:** LocalBase3 Core Team  
**Technical Story:** Provider Node Query Interface and Local Data Access Patterns

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

LocalBase3 provider nodes store data across multiple storage engines (SQLite, RocksDB, LMDB) with different access patterns and query capabilities. The query language design must address:

- **Unified access**: A consistent query interface across different storage backends
- **Expressiveness**: Support for filtering, sorting, aggregation, and pagination
- **Performance**: Efficient query execution without full table scans
- **Safety**: Protection against injection attacks and resource exhaustion
- **Developer ergonomics**: Intuitive API that doesn't require deep SQL knowledge
- **Observability**: Query logging, metrics, and slow query detection

**Query Use Cases:**

```
┌─────────────────────────────────────────────────────────┐
│              Query Use Cases for Provider Nodes          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. Job Queries                                         │
│     • Find pending jobs for execution                   │
│     • Get job history with filtering                    │
│     • Count jobs by status/model                        │
│     • Find failed jobs for retry                        │
│                                                         │
│  2. Metrics Queries                                     │
│     • Get recent GPU utilization                        │
│     • Calculate average response times                  │
│     • Aggregate metrics by time period                  │
│     • Detect performance anomalies                      │
│                                                         │
│  3. Configuration Queries                               │
│     • Read provider settings                            │
│     • Check model availability                          │
│     • Get pricing configuration                         │
│                                                         │
│  4. Sync State Queries                                  │
│     • Check last synced block height                    │
│     • Find pending sync operations                      │
│     • Get sync health status                            │
│                                                         │
│  5. Cache Queries                                       │
│     • Look up cached blockchain state                   │
│     • Check cache validity (TTL)                        │
│     • Invalidate stale cache entries                    │
│                                                         │
│  6. Analytics Queries                                   │
│     • Provider performance trends                       │
│     • Cost/revenue analysis                             │
│     • Model popularity and pricing optimization         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 1.2 Current State

The current implementation uses raw SQL queries scattered throughout the codebase with no abstraction layer:

```javascript
// Current approach (scattered, inconsistent)
const jobs = db.prepare('SELECT * FROM jobs WHERE status = ?').all('pending');
const metrics = db.prepare('SELECT * FROM metrics ORDER BY timestamp DESC LIMIT 100').all();
const config = db.prepare("SELECT value FROM provider_config WHERE key = ?").get('reputation');
```

**Problems with current approach:**
- No query abstraction or validation
- SQL injection risk with string interpolation
- No query metrics or slow query detection
- Inconsistent error handling
- No pagination support
- No query composition or reuse
- Difficult to test and mock

### 1.3 Options Considered

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **Raw SQL** | Direct SQL queries with parameterized statements | Full SQL power, no abstraction overhead | Error-prone, no validation, hard to test |
| **Query Builder** | Programmatic SQL construction (Knex, Kysely) | Type-safe, composable, parameterized | Learning curve, abstraction leak |
| **ORM** | Object-Relational Mapping (Prisma, Sequelize) | High-level API, migrations, relations | Heavy, performance overhead, complex |
| **Repository Pattern** | Custom repository classes with typed methods | Clean API, testable, encapsulated | Boilerplate, manual implementation |
| **Data Mapper** | Separate data access layer (TypeORM pattern) | Decoupled, flexible, testable | Complex, overkill for embedded DB |

### 1.4 Evaluation Matrix

```
┌─────────────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
│ Criteria        │ Raw SQL  │ Query    │ ORM      │ Repository│ Data     │
│                 │          │ Builder  │          │ Pattern   │ Mapper   │
├─────────────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ Type Safety     │ ★☆☆☆☆   │ ★★★★☆   │ ★★★★★   │ ★★★★☆   │ ★★★★☆   │
│ Performance     │ ★★★★★   │ ★★★★☆   │ ★★★☆☆   │ ★★★★★   │ ★★★★☆   │
│ Simplicity      │ ★★★☆☆   │ ★★★★☆   │ ★★☆☆☆   │ ★★★★☆   │ ★★☆☆☆   │
│ Testability     │ ★★☆☆☆   │ ★★★★☆   │ ★★★☆☆   │ ★★★★★   │ ★★★★☆   │
│ Flexibility     │ ★★★★★   │ ★★★★☆   │ ★★★☆☆   │ ★★★☆☆   │ ★★★★☆   │
│ Maintainability │ ★★☆☆☆   │ ★★★★☆   │ ★★★☆☆   │ ★★★★★   │ ★★★☆☆   │
├─────────────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ Total           │ 20/30   │ 26/30    │ 20/30    │ 27/30    │ 22/30    │
└─────────────────┴──────────┴──────────┴──────────┴──────────┴──────────┘
```

---

## 2. Decision

### 2.1 Primary Decision

**Selected: Repository Pattern with Query Builder for complex queries.**

The query architecture uses a layered approach:

1. **Repository Layer**: Typed repository classes for each entity (JobRepository, MetricsRepository, etc.) providing a clean, testable API
2. **Query Builder Layer**: Kysely for complex queries requiring composition, joins, or dynamic filtering
3. **Raw SQL Layer**: Direct SQL for simple, performance-critical queries with strict parameterization

### 2.2 Rationale

**Repository Pattern** provides the optimal balance for the LocalBase3 use case:

1. **Clean API**: Consumers interact with typed methods (`jobs.findPending()`) rather than raw SQL
2. **Testability**: Repositories can be easily mocked in tests
3. **Encapsulation**: SQL details are hidden behind a clean interface
4. **Flexibility**: Complex queries can use the query builder internally
5. **Performance**: No ORM overhead; repositories use prepared statements directly
6. **Maintainability**: Query logic is centralized and easy to audit

**Kysely** as the query builder:
- Type-safe SQL construction with TypeScript
- Zero runtime overhead (compiles to raw SQL)
- Supports all SQLite features
- Excellent migration support
- Active maintenance and growing ecosystem

### 2.3 Query Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Query Layer Architecture                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │              Application Layer                    │    │
│  │                                                   │    │
│  │  JobExecutor  MetricsCollector  ConfigManager     │    │
│  │       │              │               │            │    │
│  └───────┼──────────────┼───────────────┼────────────┘    │
│          │              │               │                 │
│          ▼              ▼               ▼                 │
│  ┌─────────────────────────────────────────────────┐    │
│  │              Repository Layer                     │    │
│  │                                                   │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐          │    │
│  │  │   Job    │ │ Metrics  │ │  Config  │          │    │
│  │  │Repository│ │Repository│ │Repository│          │    │
│  │  │          │ │          │ │          │          │    │
│  │  │findPending│ │aggregate│ │get(key)  │          │    │
│  │  │findById  │ │getRecent │ │set(k,v)  │          │    │
│  │  │update    │ │getByRange│ │getAll    │          │    │
│  │  │count     │ │export    │ │delete    │          │    │
│  │  └──────────┘ └──────────┘ └──────────┘          │    │
│  └─────────────────────────────────────────────────┘    │
│          │              │               │                 │
│          ▼              ▼               ▼                 │
│  ┌─────────────────────────────────────────────────┐    │
│  │              Query Builder Layer                  │    │
│  │              (Kysely)                             │    │
│  │                                                   │    │
│  │  • Type-safe SQL construction                    │    │
│  │  • Dynamic query composition                     │    │
│  │  • Pagination helpers                            │    │
│  │  • Aggregation functions                         │    │
│  └─────────────────────────────────────────────────┘    │
│          │                                               │
│          ▼                                               │
│  ┌─────────────────────────────────────────────────┐    │
│  │              Storage Layer                        │    │
│  │                                                   │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐          │    │
│  │  │  SQLite  │ │ RocksDB  │ │   LMDB   │          │    │
│  │  │  (WAL)   │ │          │ │          │          │    │
│  │  └──────────┘ └──────────┘ └──────────┘          │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### 2.4 Query Language Specification

**Query Types:**

```
┌─────────────────────────────────────────────────────────┐
│              Query Type Classification                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Simple Queries (Repository methods):                   │
│  ┌─────────────────────────────────────────────────┐    │
│  │  findById(id)        → Single record by PK      │    │
│  │  findAll(filter)     → Multiple records         │    │
│  │  count(filter)       → Aggregate count          │    │
│  │  exists(id)          → Boolean existence check  │    │
│  │  insert(data)        → Insert single record     │    │
│  │  insertMany(data[])  → Batch insert             │    │
│  │  update(id, data)    → Update by PK             │    │
│  │  delete(id)          → Delete by PK             │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  Complex Queries (Query Builder):                       │
│  ┌─────────────────────────────────────────────────┐    │
│  │  findWithRelations(id) → JOIN queries           │    │
│  │  aggregate(groupBy)    → GROUP BY + aggregates  │    │
│  │  findPaginated(page)   → OFFSET/LIMIT           │    │
│  │  findWithSubquery()    → Subqueries             │    │
│  │  upsert(data)          → INSERT OR REPLACE      │    │
│  │  findWithWindow()      → Window functions       │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  Raw Queries (Direct SQL):                              │
│  ┌─────────────────────────────────────────────────┐    │
│  │  execute(sql, params)  → Arbitrary SQL          │    │
│  │  transaction(fn)       → Transactional block    │    │
│  │  pragma(name, value)   → SQLite pragmas         │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### 2.5 Pagination Strategy

```
┌─────────────────────────────────────────────────────────┐
│              Pagination Strategy                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Cursor-based Pagination (preferred):                   │
│  ┌─────────────────────────────────────────────────┐    │
│  │  SELECT * FROM jobs                              │    │
│  │  WHERE created_at < ?                            │    │
│  │  ORDER BY created_at DESC                        │    │
│  │  LIMIT 50                                        │    │
│  │                                                  │    │
│  │  Response:                                       │    │
│  │  {                                               │    │
│  │    data: [...],                                  │    │
│  │    nextCursor: "2024-01-15T10:30:00Z",           │    │
│  │    hasMore: true                                 │    │
│  │  }                                               │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  Offset-based Pagination (for analytics):               │
│  ┌─────────────────────────────────────────────────┐    │
│  │  SELECT * FROM metrics                           │    │
│  │  ORDER BY timestamp DESC                         │    │
│  │  LIMIT 100 OFFSET 0                              │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  Keyset Pagination (for large datasets):                │
│  ┌─────────────────────────────────────────────────┐    │
│  │  SELECT * FROM jobs                              │    │
│  │  WHERE (status, created_at) < (?, ?)             │    │
│  │  ORDER BY status DESC, created_at DESC           │    │
│  │  LIMIT 50                                        │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Consequences

### 3.1 Positive Consequences

1. **Type-safe queries**: TypeScript types ensure query parameters and return values are validated at compile time, eliminating runtime type errors.

2. **Clean separation of concerns**: Repositories encapsulate data access logic, making the application layer independent of storage implementation details.

3. **Testable architecture**: Repository interfaces can be easily mocked, enabling unit tests without a real database. Integration tests use a test database with fixtures.

4. **Query composition**: Kysely enables building complex queries from reusable components, reducing code duplication and improving maintainability.

5. **Consistent error handling**: All queries go through the repository layer, providing a single point for error handling, logging, and metrics collection.

6. **Performance visibility**: The repository layer can track query execution times, detect slow queries, and emit metrics for monitoring.

7. **Migration path**: The repository pattern allows gradual migration from raw SQL to the query builder without changing the application layer API.

8. **Security**: Parameterized queries through the repository layer eliminate SQL injection risks. Input validation is centralized.

### 3.2 Negative Consequences

1. **Boilerplate overhead**: Each entity requires a repository class with typed methods, increasing the initial development effort compared to raw SQL.

2. **Query builder learning curve**: Kysely has a learning curve, especially for developers unfamiliar with type-safe query builders. Complex queries may require understanding of Kysely's type system.

3. **Abstraction limitations**: The repository pattern may not cover all edge cases. Some queries may require falling back to raw SQL, creating inconsistency in the codebase.

4. **Type maintenance**: TypeScript types for database schemas must be kept in sync with actual database schema. Schema changes require type updates.

5. **Performance overhead**: While minimal, the repository layer adds a small amount of overhead compared to direct SQL execution. For hot paths, raw SQL may still be preferred.

### 3.3 Neutral Consequences

1. **Dependency addition**: Kysely adds a dependency to the project. The team must track updates and handle breaking changes.

2. **Code organization**: The repository pattern requires a specific directory structure (`repositories/`, `types/`, `queries/`) that must be consistently followed.

3. **Migration complexity**: Existing raw SQL queries must be gradually migrated to the repository pattern, requiring careful refactoring to avoid regressions.

---

## 4. Architecture Diagrams

### 4.1 Query Execution Flow

```
┌─────────────────────────────────────────────────────────┐
│              Query Execution Flow                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Application Request                                    │
│         │                                               │
│         ▼                                               │
│  ┌─────────────────┐                                    │
│  │  Repository     │                                    │
│  │  Method Call    │                                    │
│  │  (Typed API)    │                                    │
│  └────────┬────────┘                                    │
│           │                                             │
│           ▼                                             │
│  ┌─────────────────┐                                    │
│  │  Input          │                                    │
│  │  Validation     │                                    │
│  │  (Zod schema)   │                                    │
│  └────────┬────────┘                                    │
│           │                                             │
│           ▼                                             │
│  ┌─────────────────┐                                    │
│  │  Query Builder  │                                    │
│  │  (Kysely)       │                                    │
│  │  • Compose SQL  │                                    │
│  │  • Bind params  │                                    │
│  └────────┬────────┘                                    │
│           │                                             │
│           ▼                                             │
│  ┌─────────────────┐                                    │
│  │  Query          │                                    │
│  │  Execution      │                                    │
│  │  (better-sqlite3)│                                   │
│  └────────┬────────┘                                    │
│           │                                             │
│           ▼                                             │
│  ┌─────────────────┐                                    │
│  │  Result         │                                    │
│  │  Mapping        │                                    │
│  │  (Type-safe)    │                                    │
│  └────────┬────────┘                                    │
│           │                                             │
│           ▼                                             │
│  ┌─────────────────┐                                    │
│  │  Metrics        │                                    │
│  │  Collection     │                                    │
│  │  (timing, count)│                                    │
│  └────────┬────────┘                                    │
│           │                                             │
│           ▼                                             │
│  ┌─────────────────┐                                    │
│  │  Response       │                                    │
│  │  (Typed)        │                                    │
│  └─────────────────┘                                    │
│                                                         │
│  Total Latency Budget:                                  │
│  • Validation: < 0.1ms                                  │
│  • Query build: < 0.5ms                                 │
│  • Execution: < 5ms (indexed), < 50ms (full scan)       │
│  • Mapping: < 0.5ms                                     │
│  • Total: < 10ms (typical)                              │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Repository Interface Design

```
┌─────────────────────────────────────────────────────────┐
│              Repository Interface Design                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  interface Repository<T, ID> {                          │
│    findById(id: ID): Promise<T | null>;                 │
│    findAll(filter?: Filter<T>): Promise<T[]>;           │
│    findPaginated(                                       │
│      filter?: Filter<T>,                                │
│      pagination?: Pagination                            │
│    ): Promise<PaginatedResult<T>>;                      │
│    count(filter?: Filter<T>): Promise<number>;          │
│    exists(id: ID): Promise<boolean>;                    │
│    insert(data: InsertData<T>): Promise<T>;             │
│    insertMany(data: InsertData<T>[]): Promise<T[]>;     │
│    update(id: ID, data: UpdateData<T>): Promise<T>;     │
│    delete(id: ID): Promise<boolean>;                    │
│  }                                                      │
│                                                         │
│  interface JobRepository extends Repository<Job, string>│
│  {                                                      │
│    findPending(limit?: number): Promise<Job[]>;         │
│    findByStatus(status: JobStatus): Promise<Job[]>;     │
│    findByModel(model: string): Promise<Job[]>;          │
│    findFailed(since?: Date): Promise<Job[]>;            │
│    getStats(): Promise<JobStats>;                       │
│    transitionStatus(                                    │
│      jobId: string,                                     │
│      from: JobStatus,                                   │
│      to: JobStatus,                                     │
│      metadata?: JobMetadata                             │
│    ): Promise<boolean>;                                 │
│  }                                                      │
│                                                         │
│  interface MetricsRepository {                          │
│    record(metrics: MetricsData): Promise<void>;         │
│    getRecent(hours?: number): Promise<Metrics[]>;       │
│    aggregate(                                           │
│      period: TimePeriod,                                │
│      groupBy?: string                                   │
│    ): Promise<AggregatedMetrics[]>;                     │
│    getAnomalies(threshold?: number): Promise<Metrics[]> │
│    export(start: Date, end: Date): Promise<Metrics[]>;  │
│    prune(olderThan: Date): Promise<number>;             │
│  }                                                      │
│                                                         │
│  interface ConfigRepository {                           │
│    get(key: string): Promise<string | null>;            │
│    getAll(): Promise<Record<string, string>>;           │
│    set(key: string, value: string): Promise<void>;      │
│    delete(key: string): Promise<boolean>;               │
│    getTyped<T>(key: string, schema: ZodSchema<T>):      │
│      Promise<T | null>;                                 │
│  }                                                      │
└─────────────────────────────────────────────────────────┘
```

---

## 5. Code Examples

### 5.1 Base Repository Implementation

```typescript
import { Kysely, SqliteDialect, SelectQueryBuilder } from 'kysely';
import Database from 'better-sqlite3';
import { z } from 'zod';

// Database types for Kysely
interface DatabaseSchema {
  jobs: JobTable;
  metrics: MetricsTable;
  provider_info: ProviderInfoTable;
  sync_state: SyncStateTable;
}

interface JobTable {
  job_id: string;
  model: string;
  status: string;
  input_hash: string | null;
  output_hash: string | null;
  created_at: number;
  assigned_at: number | null;
  started_at: number | null;
  completed_at: number | null;
  processing_time_ms: number | null;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  error_code: string | null;
  error_message: string | null;
}

interface MetricsTable {
  id: number;
  timestamp: number;
  gpu_utilization: number | null;
  gpu_memory_used_mb: number | null;
  jobs_completed: number;
  tokens_processed: number;
  response_time_p50_ms: number | null;
  response_time_p95_ms: number | null;
}

interface ProviderInfoTable {
  key: string;
  value: string;
  updated_at: number;
}

interface SyncStateTable {
  key: string;
  value: string;
  updated_at: number;
}

// Query metrics collector
class QueryMetrics {
  private queries = new Map<string, { count: number; totalTime: number }>();

  record(queryName: string, durationMs: number) {
    const existing = this.queries.get(queryName) || { count: 0, totalTime: 0 };
    this.queries.set(queryName, {
      count: existing.count + 1,
      totalTime: existing.totalTime + durationMs,
    });
  }

  getStats() {
    const stats: Record<string, { count: number; avgMs: number }> = {};
    for (const [name, { count, totalTime }] of this.queries.entries()) {
      stats[name] = { count, avgMs: totalTime / count };
    }
    return stats;
  }
}

// Base repository
class BaseRepository {
  protected db: Kysely<DatabaseSchema>;
  protected metrics: QueryMetrics;

  constructor(dbPath: string) {
    const sqlite = new Database(dbPath);
    sqlite.pragma('journal_mode = WAL');
    sqlite.pragma('synchronous = NORMAL');
    sqlite.pragma('cache_size = -64000');
    sqlite.pragma('foreign_keys = ON');

    const dialect = new SqliteDialect({
      database: sqlite,
    });

    this.db = new Kysely<DatabaseSchema>({ dialect });
    this.metrics = new QueryMetrics();
  }

  protected async measure<T>(queryName: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      return await fn();
    } finally {
      const duration = performance.now() - start;
      this.metrics.record(queryName, duration);
      
      if (duration > 100) {
        console.warn(`Slow query: ${queryName} took ${duration.toFixed(1)}ms`);
      }
    }
  }

  getMetrics() {
    return this.metrics.getStats();
  }
}
```

### 5.2 Job Repository

```typescript
interface JobFilter {
  status?: string;
  model?: string;
  createdAfter?: number;
  createdBefore?: number;
}

interface Pagination {
  limit: number;
  cursor?: number; // created_at timestamp
}

interface PaginatedResult<T> {
  data: T[];
  nextCursor: number | null;
  hasMore: boolean;
}

class JobRepository extends BaseRepository {
  async findById(jobId: string): Promise<JobTable | null> {
    return this.measure('job.findById', async () => {
      return this.db
        .selectFrom('jobs')
        .selectAll()
        .where('job_id', '=', jobId)
        .executeTakeFirst();
    });
  }

  async findPending(limit: number = 50): Promise<JobTable[]> {
    return this.measure('job.findPending', async () => {
      return this.db
        .selectFrom('jobs')
        .selectAll()
        .where('status', '=', 'pending')
        .orderBy('created_at', 'asc')
        .limit(limit)
        .execute();
    });
  }

  async findByStatus(status: string): Promise<JobTable[]> {
    return this.measure('job.findByStatus', async () => {
      return this.db
        .selectFrom('jobs')
        .selectAll()
        .where('status', '=', status)
        .orderBy('created_at', 'desc')
        .execute();
    });
  }

  async findWithFilter(
    filter: JobFilter,
    pagination: Pagination
  ): Promise<PaginatedResult<JobTable>> {
    return this.measure('job.findWithFilter', async () => {
      let query = this.db
        .selectFrom('jobs')
        .selectAll()
        .orderBy('created_at', 'desc')
        .limit(pagination.limit + 1); // Fetch one extra to check hasMore

      if (filter.status) {
        query = query.where('status', '=', filter.status);
      }
      if (filter.model) {
        query = query.where('model', '=', filter.model);
      }
      if (filter.createdAfter) {
        query = query.where('created_at', '>=', filter.createdAfter);
      }
      if (filter.createdBefore) {
        query = query.where('created_at', '<=', filter.createdBefore);
      }
      if (pagination.cursor) {
        query = query.where('created_at', '<', pagination.cursor);
      }

      const rows = await query.execute();
      const hasMore = rows.length > pagination.limit;
      const data = rows.slice(0, pagination.limit);
      const nextCursor = hasMore ? data[data.length - 1].created_at : null;

      return { data, nextCursor, hasMore };
    });
  }

  async count(filter?: JobFilter): Promise<number> {
    return this.measure('job.count', async () => {
      let query = this.db
        .selectFrom('jobs')
        .select((eb) => eb.fn.countAll().as('count'));

      if (filter?.status) {
        query = query.where('status', '=', filter.status);
      }
      if (filter?.model) {
        query = query.where('model', '=', filter.model);
      }

      const result = await query.executeTakeFirst();
      return Number(result?.count ?? 0);
    });
  }

  async getStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byModel: Record<string, number>;
    avgProcessingTime: number | null;
  }> {
    return this.measure('job.getStats', async () => {
      const total = await this.count();

      const byStatus = await this.db
        .selectFrom('jobs')
        .select(['status', (eb) => eb.fn.countAll().as('count')])
        .groupBy('status')
        .execute();

      const byModel = await this.db
        .selectFrom('jobs')
        .select(['model', (eb) => eb.fn.countAll().as('count')])
        .groupBy('model')
        .execute();

      const avgTime = await this.db
        .selectFrom('jobs')
        .select((eb) => eb.fn.avg('processing_time_ms').as('avg'))
        .where('processing_time_ms', 'is not', null)
        .executeTakeFirst();

      return {
        total,
        byStatus: Object.fromEntries(byStatus.map(r => [r.status, Number(r.count)])),
        byModel: Object.fromEntries(byModel.map(r => [r.model, Number(r.count)])),
        avgProcessingTime: avgTime?.avg ? Number(avgTime.avg) : null,
      };
    });
  }

  async transitionStatus(
    jobId: string,
    fromStatus: string,
    toStatus: string,
    metadata: Record<string, unknown> = {}
  ): Promise<boolean> {
    return this.measure('job.transitionStatus', async () => {
      const updates: Record<string, unknown> = { status: toStatus };

      if (toStatus === 'assigned' && !metadata.assigned_at) {
        updates.assigned_at = Math.floor(Date.now() / 1000);
      }
      if (toStatus === 'running' && !metadata.started_at) {
        updates.started_at = Math.floor(Date.now() / 1000);
      }
      if (toStatus === 'completed' && !metadata.completed_at) {
        updates.completed_at = Math.floor(Date.now() / 1000);
      }
      if (metadata.output_hash) {
        updates.output_hash = metadata.output_hash;
      }
      if (metadata.processing_time_ms) {
        updates.processing_time_ms = metadata.processing_time_ms;
      }
      if (metadata.prompt_tokens) {
        updates.prompt_tokens = metadata.prompt_tokens;
      }
      if (metadata.completion_tokens) {
        updates.completion_tokens = metadata.completion_tokens;
      }
      if (metadata.error_code) {
        updates.error_code = metadata.error_code;
      }
      if (metadata.error_message) {
        updates.error_message = metadata.error_message;
      }

      const result = await this.db
        .updateTable('jobs')
        .set(updates)
        .where('job_id', '=', jobId)
        .where('status', '=', fromStatus)
        .executeTakeFirst();

      return Number(result.numUpdatedRows) > 0;
    });
  }

  async insert(job: Omit<JobTable, 'created_at'>): Promise<JobTable> {
    return this.measure('job.insert', async () => {
      const result = await this.db
        .insertInto('jobs')
        .values({
          ...job,
          created_at: Math.floor(Date.now() / 1000),
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      return result;
    });
  }

  async delete(jobId: string): Promise<boolean> {
    return this.measure('job.delete', async () => {
      const result = await this.db
        .deleteFrom('jobs')
        .where('job_id', '=', jobId)
        .executeTakeFirst();

      return Number(result.numDeletedRows) > 0;
    });
  }
}
```

### 5.3 Metrics Repository with Aggregation

```typescript
class MetricsRepository extends BaseRepository {
  async record(metrics: Omit<MetricsTable, 'id'>): Promise<void> {
    await this.measure('metrics.record', async () => {
      await this.db
        .insertInto('metrics')
        .values(metrics)
        .execute();
    });
  }

  async getRecent(hours: number = 24): Promise<MetricsTable[]> {
    return this.measure('metrics.getRecent', async () => {
      const cutoffTimestamp = Math.floor(Date.now() / 1000) - hours * 3600;

      return this.db
        .selectFrom('metrics')
        .selectAll()
        .where('timestamp', '>=', cutoffTimestamp)
        .orderBy('timestamp', 'desc')
        .execute();
    });
  }

  async aggregate(
    period: 'hour' | 'day' | 'week',
    groupBy?: string
  ): Promise<Record<string, unknown>[]> {
    return this.measure('metrics.aggregate', async () => {
      const periodFormat = {
        hour: '%Y-%m-%d %H:00:00',
        day: '%Y-%m-%d',
        week: '%Y-%W',
      }[period];

      let query = this.db
        .selectFrom('metrics')
        .select([
          (eb) => eb.fn('strftime', [periodFormat, eb.ref('timestamp')]).as('period'),
          (eb) => eb.fn.avg('gpu_utilization').as('avg_gpu_utilization'),
          (eb) => eb.fn.max('gpu_utilization').as('max_gpu_utilization'),
          (eb) => eb.fn.sum('jobs_completed').as('total_jobs'),
          (eb) => eb.fn.sum('tokens_processed').as('total_tokens'),
          (eb) => eb.fn.avg('response_time_p50_ms').as('avg_p50'),
          (eb) => eb.fn.max('response_time_p95_ms').as('max_p95'),
        ])
        .groupBy('period')
        .orderBy('period', 'desc');

      if (groupBy) {
        query = query.select(groupBy as any).groupBy(groupBy as any);
      }

      return query.execute();
    });
  }

  async getAnomalies(threshold: number = 2.0): Promise<MetricsTable[]> {
    return this.measure('metrics.getAnomalies', async () => {
      // Find metrics where GPU utilization deviates significantly from the mean
      return this.db
        .with('stats', (db) =>
          db
            .selectFrom('metrics')
            .select([
              (eb) => eb.fn.avg('gpu_utilization').as('mean'),
              (eb) => eb.fn('stdev', [eb.ref('gpu_utilization')]).as('stddev'),
            ])
        )
        .selectFrom('metrics')
        .crossJoin('stats')
        .selectAll('metrics')
        .where((eb) =>
          eb(
            eb.fn('abs', [
              eb(eb.ref('gpu_utilization'), '-', eb.ref('stats.mean')),
            ]),
            '>',
            eb(eb.ref('stats.stddev'), '*', threshold)
          )
        )
        .orderBy('timestamp', 'desc')
        .execute();
    });
  }

  async prune(olderThan: Date): Promise<number> {
    return this.measure('metrics.prune', async () => {
      const cutoffTimestamp = Math.floor(olderThan.getTime() / 1000);

      const result = await this.db
        .deleteFrom('metrics')
        .where('timestamp', '<', cutoffTimestamp)
        .executeTakeFirst();

      return Number(result.numDeletedRows);
    });
  }

  async export(start: Date, end: Date): Promise<MetricsTable[]> {
    return this.measure('metrics.export', async () => {
      const startTimestamp = Math.floor(start.getTime() / 1000);
      const endTimestamp = Math.floor(end.getTime() / 1000);

      return this.db
        .selectFrom('metrics')
        .selectAll()
        .where('timestamp', '>=', startTimestamp)
        .where('timestamp', '<=', endTimestamp)
        .orderBy('timestamp', 'asc')
        .execute();
    });
  }
}
```

### 5.4 Query Composition Example

```typescript
// Complex query: Provider performance dashboard
class PerformanceQuery {
  constructor(
    private jobs: JobRepository,
    private metrics: MetricsRepository
  ) {}

  async getDashboard(days: number = 7) {
    // Run queries in parallel
    const [jobStats, recentMetrics, aggregatedMetrics] = await Promise.all([
      this.jobs.getStats(),
      this.metrics.getRecent(days * 24),
      this.metrics.aggregate('day'),
    ]);

    // Calculate derived metrics
    const latestMetrics = recentMetrics[0];
    const totalJobs = jobStats.total;
    const avgResponseTime = jobStats.avgProcessingTime;

    return {
      overview: {
        totalJobs,
        avgResponseTime,
        currentGpuUtilization: latestMetrics?.gpu_utilization ?? 0,
        currentGpuMemory: latestMetrics?.gpu_memory_used_mb ?? 0,
      },
      jobDistribution: jobStats.byStatus,
      modelDistribution: jobStats.byModel,
      trends: aggregatedMetrics,
    };
  }
}
```

---

## 6. Cross-References

### 6.1 Related ADRs

| ADR | Title | Relationship |
|-----|-------|-------------|
| [ADR-001](./ADR-001-storage-engine.md) | Storage Engine Selection | Defines storage engines that query layer accesses |
| [ADR-002](./ADR-002-sync-strategy.md) | Offline Sync Strategy | Sync layer uses query repositories for state access |

### 6.2 Related Documents

| Document | Path | Relationship |
|----------|------|-------------|
| SOTA Research | `docs/research/LOCAL_DATABASES_SOTA.md` | Query patterns and database comparison |
| SPEC | `SPEC.md` | API specification with query requirements |

### 6.3 External References

1. [Kysely Documentation](https://kysely.dev/docs/)
2. [Kysely SQLite Dialect](https://kysely.dev/docs/dialects/sqlite)
3. [Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)
4. [Zod Schema Validation](https://zod.dev/)

---

*ADR Version: 1.0.0*  
*Status: Proposed*  
*Last Updated: 2026-04-03*
