# DocBuilder Enterprise - PostgreSQL Migration & Architecture Guide

## Overview

DocBuilder has been transitioned from a file-based JSON storage (`data/db.json`) to a production-grade **PostgreSQL** database architecture (Architecture A). Next.js connects directly to PostgreSQL via `pg.Pool`, with Zero Data Loss Two-Way Safe Merge and binary asset extraction.

---

## 🚀 Environment Configuration

Configuration is controlled via `.env` (or `.env.local`):

```bash
# Database Adapter Selection ('postgres' or 'json')
DB_ADAPTER=postgres

# PostgreSQL Connection String
DATABASE_URL=postgres://wawa:S0lut!0n@192.168.3.164:5432/docbuilder?sslmode=disable

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Switching Adapters
- **PostgreSQL Mode (Default / Production):** `DB_ADAPTER=postgres`
- **Fallback JSON Mode (Offline / Emergency):** `DB_ADAPTER=json`

No code modification is required to switch adapters. Changing this variable in `.env` instantly toggles all 17 repositories.

---

## 🏥 Health Check Endpoint

Check the health and latency of the database connection:

```bash
curl http://localhost:3000/api/health
```

### Sample Response:
```json
{
  "status": "ok",
  "timestamp": "2026-09-29T09:42:00.000Z",
  "adapter": "postgres",
  "database": {
    "connected": true,
    "latencyMs": 4,
    "details": {
      "database": "docbuilder",
      "user": "wawa",
      "tableCount": 25
    }
  },
  "totalResponseMs": 6
}
```

---

## 📦 Data Migration Tool

To migrate or merge records from `data/db.json` into PostgreSQL:

```bash
# 1. Preview changes (Dry Run - no database writes)
node scripts/migrate-json-to-pg.mjs --dry-run

# 2. Execute migration (Live Upsert & Asset Extraction)
node scripts/migrate-json-to-pg.mjs
```

### Features of Migration:
- **Two-Way Safe Merge:** Records are merged using `ON CONFLICT (id) DO UPDATE SET ...`. Postgres records are never deleted.
- **Asset Extraction:** Large base64 image URIs are extracted to physical binary files in `storage/assets/` and registered in the `assets` table.
- **Values Integrity:** 100% preservation of template canvas pages and document form values in JSONB columns.

---

## 🛠️ Tech Stack & Architecture

- **Framework:** Next.js 14+ (App Router)
- **Database:** PostgreSQL (with `pg.Pool` connection pooling)
- **Document Engine:** Fabric.js Canvas + Dynamic Token Interpolation + React Server/Client Components
- **Storage:** Local binary storage (`storage/assets/`) with HTTP proxy route (`/api/assets/[id]`)
