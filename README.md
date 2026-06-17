# SCI Analysis Platform

## Description

The Social Interconnectedness Index (SCI) platform analyses trade relationships and opportunities among African countries. It exposes a REST API for querying trade data, commodity breakdowns, country indices, and opportunity indices across 53 African nations.

## Tech Stack

### Backend
- **Node.js** (v15.x) with Express.js framework
- **FerretDB** — MongoDB-compatible layer (open-source, Apache 2.0)
- **PostgreSQL 16** — underlying storage for FerretDB
- **Mongoose** — ODM; connects to FerretDB over the standard MongoDB wire protocol
- **Redis** — caching and job queuing
- **Bull** — background job processing

> FerretDB replaces MongoDB as the datastore. It speaks the MongoDB wire protocol, so Mongoose and all aggregation pipelines work without modification. No MongoDB licence (SSPL) is required.

### Data
The trade dataset is shipped as static JSON files inside the repository under `app/modules/storage/`. A seed script populates the database from these files — no external API credentials are needed to run the platform.

| File | Contents |
|---|---|
| `comprehensive_dataset_wide.json` | Main trade dataset (53 countries × bilateral pairs) |
| `All Commodities, SCI & OppIndex.json` | Commodity list with SCI and Opportunity Index values |
| `Official exchange rate(2019).json` | Fixed exchange rates used as fallback |
| `online_foreign_exchange.json` | Cached live exchange rates |

### Document Generation
- **PDF Generation** — HTML-PDF, PDFKit, Hummus
- **EJS Templates** — dynamic report templating
- **Email Templates** — automated report distribution

### Infrastructure
- **Docker & Docker Compose** — fully containerised; one command to start everything
- **PM2** — process management
- **Winston** — structured logging
- **Swagger** — API documentation at `/api/docs`

## Quick Start

### Prerequisites
- Docker and Docker Compose

### Setup

1. **Environment configuration**
   ```bash
   cp .env.example .env
   # Edit .env and fill in the values (see Environment Variables below)
   ```

2. **Start all services and seed the database**
   ```bash
   docker-compose up -d --build
   ```
   The `seed` service runs automatically on first start. It reads from the local JSON files and populates FerretDB (via PostgreSQL). No external API calls are made.

3. **View logs**
   ```bash
   docker-compose logs -f app
   docker-compose logs -f seed   # see seed progress
   ```

### Seeding manually (outside Docker)

```bash
node scripts/seed.js
```

The script reads the `MONGODB_URI` environment variable, or falls back to `mongodb://root:root@localhost:27017/sci?authSource=admin`.

### API Endpoints
- **Base URL**: `http://localhost:8282/api`
- **Documentation**: `http://localhost:8282/api/docs`
- **Health Check**: `http://localhost:8282/api/health`

## Development

```bash
npm install
npm run start:development
```

### Testing
```bash
npm test
```

All 22 functional tests run against FerretDB. No MongoDB instance is required.

## Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Application port (default `8282`) |
| `NODE_ENV` | `development` or `production` |
| `MONGODB_HOST` | FerretDB host (default `localhost`) |
| `MONGODB_GUEST_PORT` | FerretDB port (default `27017`) |
| `MONGODB_INIT_DATABASE` | Database name (default `sci`) |
| `MONGODB_APP_USER` | Database user |
| `MONGODB_APP_PASSWORD` | Database password |
| `REDIS_HOST` | Redis host |
| `REDIS_PASSWORD` | Redis password |

## Architecture

```
Local JSON files
      │
      ▼
 scripts/seed.js
      │
      ▼
 FerretDB (MongoDB wire protocol)
      │
      ▼
 PostgreSQL 16  ◄──  persisted data
      │
      ▼
 Express API  ──►  REST endpoints
```

## Platform Independence

This project meets the [DPG platform independence requirement](https://github.com/DPGAlliance/dpg-resources/tree/main/docs/platform-independence):

- **Database**: FerretDB (Apache 2.0) + PostgreSQL 16 (PostgreSQL Licence) — both OSI-approved. No proprietary MongoDB dependency.
- **Data**: shipped as static files in the repository. No Google Sheets or Google Drive credentials are required to run or seed the platform.
- **All aggregation operators** used in the codebase (`$lookup`, `$unwind`, `$addFields`, `$group`, `$project`, `$sort`, `$match`, `$expr`, `$slice`, `$push`, `$sum`) are supported by FerretDB and verified by the test suite.
