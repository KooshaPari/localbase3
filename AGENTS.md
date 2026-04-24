# AGENTS.md — localbase3

## Project Overview

- **Name**: localbase3 (Local Database & Storage)
- **Description**: Local-first database with sync capabilities and offline support
- **Location**: `/Users/kooshapari/CodeProjects/Phenotype/repos/localbase3`
- **Language Stack**: TypeScript, IndexedDB, SQLite
- **Published**: Private (Phenotype org)

## Quick Start

```bash
# Navigate to project
cd /Users/kooshapari/CodeProjects/Phenotype/repos/localbase3

# Install dependencies
npm install

# Run tests
npm test
```

## Architecture

### Local-First Database

```
┌─────────────────────────────────────────────────────────────────┐
│                     Client Application                             │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                    localbase3 API                             │ │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐         │ │
│  │  │ CRUD       │  │ Query      │  │ Sync       │         │ │
│  │  │ Operations │  │ Engine     │  │ Manager    │         │ │
│  │  └────────────┘  └────────────┘  └────────────┘         │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   IndexedDB     │  │   SQLite        │  │   LocalStorage  │ │
│  │   (Browser)     │  │   (Node/Electron)│  │   (Meta)        │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
            │
            ▼ (when online)
┌─────────────────────────────────────────────────────────────────┐
│                     Sync Server                                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐│
│  │   Conflict      │  │   Change        │  │   Backup        ││
│  │   Resolution    │  │   Feed          │  │   Service       ││
│  └─────────────────┘  └─────────────────┘  └─────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## Quality Standards

### TypeScript Quality

- **Formatter**: Prettier
- **Linter**: ESLint
- **Tests**: Jest >80%
- **Browser**: Playwright tests

## Git Workflow

### Branch Naming

Format: `<type>/<feature>/<description>`

Examples:
- `feat/sync/add-crdt-support`
- `fix/queries/handle-null-values`
- `perf/indexing/add-btree`

## CLI Commands

```bash
npm run build
npm test
npm run test:e2e
```

## Resources

- [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [CRDTs](https://crdt.tech/)
- [Phenotype Registry](https://github.com/KooshaPari/phenotype-registry)

## Agent Notes

**Critical Details:**
- Offline-first design
- Conflict-free replicated data types
- Transaction support
- Index for performance

**Known Gotchas:**
- IndexedDB has complex API
- Storage quotas vary by browser
- Sync conflicts need resolution
- Migration between versions
