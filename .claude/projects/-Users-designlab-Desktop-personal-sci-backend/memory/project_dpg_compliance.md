---
name: project-dpg-compliance
description: DPG platform independence compliance status — FerretDB, seeding, what changed and why
metadata:
  type: project
---

The project is being reviewed for DPG (Digital Public Goods) compliance under the platform independence requirement. MongoDB uses SSPL (not OSI-approved), so the project must run on an open alternative.

**What was done:**
- `docker-compose.yml` uses `ghcr.io/ferretdb/ferretdb:latest` (Apache 2.0) backed by PostgreSQL 16 — no proprietary MongoDB
- A `seed` service in docker-compose auto-runs `scripts/seed.js` on startup, seeding FerretDB from local JSON files under `app/modules/storage/`
- All 22 functional tests pass against FerretDB
- Google Sheets and Google Drive are no longer the data source — data is shipped as static JSON files in the repo

**Why:** DPG reviewers kept asking for evidence of FerretDB/PostgreSQL being used and for the project to not depend on Google APIs to run.

**How to apply:** When suggesting any data-layer changes, assume FerretDB + PostgreSQL is the target, not MongoDB. Seeding is done via `node scripts/seed.js` or `docker-compose up` (seed service). Do not re-introduce Google Sheets/Drive as a required data source.
