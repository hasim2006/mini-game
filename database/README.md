# 🗄️ Database Architecture & Storage Engine

This directory contains the database design, schemas, local-first IndexedDB engines, and SQL relational migrations for the Mini Game Arcade platform.

---

## 🏛️ Storage Strategy: Local-First Architecture

Mini Game Arcade uses a **hybrid local-first persistence model**:
1. **Primary Layer**: `IndexedDB` (`ArcadeStorageDB`, v1) for non-blocking asynchronous storage of rich game telemetry and inquiries.
2. **Fallback Layer**: `localStorage` JSON serialized queues ensuring data resilience even when IndexedDB is restricted or disabled in strict private windows.
3. **Relational Target**: Pre-configured SQL schema migration scripts (`migrations/001_initial_schema.sql`) for PostgreSQL/SQLite when deploying external server backends.

---

## 📊 Entity Schemas

* [`schema.json`](./schema.json): Machine-readable JSON Schema (Draft 2020-12) defining constraints, types, and required fields.
* **Entities**:
  * `game_sessions`: Session UUID, game ID, scores, move counts, duration, difficulty, star ratings, timestamps.
  * `high_scores`: Historical all-time records indexed by game identifier.
  * `contact_inquiries`: Inbound support tickets, email, subject, user message body, and review state.

---

## 🚀 Migrations

To apply relational schema to a remote PostgreSQL or CockroachDB instance:

```bash
psql -U your_user -d arcade_db -f database/migrations/001_initial_schema.sql
```
