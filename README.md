# AI-Powered Enterprise Knowledge Platform

An enterprise knowledge platform that allows organizations to upload internal documents, process them asynchronously, search company knowledge, and ask an AI assistant questions grounded in those documents.

## Current Status

The project is in early development. What exists today:

| Area | Status |
| --- | --- |
| NestJS backend skeleton + Swagger docs | ✅ Done |
| PostgreSQL (pgvector) via Docker Compose + TypeORM | ✅ Done |
| Request validation with DTOs (`class-validator`) | ✅ Done |
| Auth: login, rotating refresh tokens, logout, change password, `/me` | ✅ Done |
| Roles (`admin`, `editor`, `viewer`) and admin user creation | ✅ Done |
| Documents API (`GET /api/v1/documents/:id`) | 🚧 Requires auth, still returns stub data |
| Document upload, S3 storage, async processing | ⏳ Planned |
| Redis, Kafka / SQS | ⏳ Planned |
| AI service (`ai-service/`), RAG | ⏳ Planned |
| Frontend (`frontend/`) | ⏳ Planned |

## Getting Started

### Prerequisites

- Node.js (recent LTS) and npm
- Docker and Docker Compose

### 1. Configure environment variables

Copy `.env.example` to `.env` in the **repository root**. Docker Compose and the backend both read it.

```bash
cp .env.example .env
```

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `DB_HOST` | No | `localhost` | Postgres host |
| `DB_PORT` | No | `5432` | Postgres port |
| `DB_USERNAME` | No | `app_user` | Postgres user |
| `DB_PASSWORD` | Yes | – | Postgres password (used by the container and the backend) |
| `DB_DATABASE` | No | `knowledge_platform` | Database name |
| `DB_SYNC` | No | `false` | `true` creates tables from entities on startup. Dev only. |
| `JWT_SECRET` | Yes | – | Secret used to sign access tokens. Use a long random string. |
| `REFRESH_TOKEN_TTL_DAYS` | No | `7` | Refresh token lifetime |

`.env` files are git-ignored. Never commit real secrets.

### 2. Start PostgreSQL

```bash
docker compose up -d
docker compose ps   # wait until postgres is "healthy"
```

Postgres is bound to `127.0.0.1:5432` only, and data persists in the `postgres_data` volume. The `vector` and `pgcrypto` extensions are enabled on first start.

### 3. Create the schema

There are no migrations yet. For local development set `DB_SYNC=true` and the backend creates the tables (`tenants`, `users`, `refresh_tokens`, `documents`) on startup.

> Upgrading from an older checkout? `users.tenant_id` is now a `uuid`. Reset the dev database with `docker compose down -v` before starting again.

### 4. Create the first admin

Users are created by admins, so seed one admin per tenant (company):

```bash
cd backend
SEED_TENANT_NAME='Acme Corp' \
SEED_ADMIN_EMAIL=admin@example.com \
SEED_ADMIN_PASSWORD='a-long-passphrase' \
npm run seed:admin
# → Created admin admin@example.com in tenant "Acme Corp" (<uuid>)
```

`SEED_TENANT_NAME` creates a new tenant. To add an admin to an existing tenant instead, set `SEED_TENANT_ID=<uuid>`. Running it again for an existing email does nothing.

### 5. Run the backend

```bash
cd backend
npm install
npm run start:dev
```

The API runs at <http://localhost:3000> and Swagger UI at <http://localhost:3000/api/docs>.

### Backend scripts

| Command | Description |
| --- | --- |
| `npm run start` | Start the app |
| `npm run start:dev` | Start in watch mode |
| `npm run build` | Compile to `dist/` |
| `npm run seed:admin` | Create a tenant admin (see above) |
| `npm test` | Run Jest unit tests (SWC, ESM) |

## API

Every route requires `Authorization: Bearer <accessToken>` unless marked public.

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/` | Public | Health / banner text |
| `POST` | `/api/v1/auth/login` | Public | Email + password → access and refresh tokens |
| `POST` | `/api/v1/auth/refresh` | Public | Refresh token → new token pair |
| `POST` | `/api/v1/auth/logout` | Public | Revoke a refresh token |
| `POST` | `/api/v1/auth/logout-all` | Bearer | Revoke every session of the current user |
| `PATCH` | `/api/v1/auth/password` | Bearer | Change password (ends other sessions) |
| `GET` | `/api/v1/auth/me` | Bearer | Current user's profile |
| `POST` | `/api/v1/users` | Bearer, admin | Create a user in the admin's tenant |
| `GET` | `/api/v1/documents/:id` | Bearer | Get a document by UUID (stub) |

### Authentication flow

```bash
# Log in
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"a-long-passphrase"}'
# → { "accessToken": "<jwt>", "refreshToken": "<opaque>", "tokenType": "Bearer", "expiresIn": 900 }

# Call a protected route
curl http://localhost:3000/api/v1/auth/me -H "Authorization: Bearer <jwt>"

# When the access token expires, get a new pair
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<opaque>"}'

# Log out
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<opaque>"}'
```

How it works:

- **Access tokens** are JWTs valid for **15 minutes**, carrying `sub` (user ID), `role` and `tenantId`. They are not stored, so they can't be revoked early; that's why they are short-lived.
- **Refresh tokens** are random 256-bit strings valid for 7 days. Only their SHA-256 hash is stored in `refresh_tokens`.
- Refresh tokens are **single-use**: each refresh revokes the old token and issues a new pair. If an already-used token is presented again, it's treated as stolen and **every session for that user is revoked**.
- **Logout** revokes the refresh token and always returns `204`. The current access token stays valid until it expires (at most 15 minutes).
- **Changing the password** revokes all refresh tokens and returns a new pair for the current session.
- Login responses take the same time whether or not the email exists, and disabled users (`is_active = false`) can't log in or refresh.
- Login and password change are limited to **5 attempts per minute per IP** (`429` with `Retry-After`). Counts are kept in memory per instance; they'll move to Redis when the backend runs on multiple instances.
- Passwords are hashed with bcrypt (12 rounds). New passwords must be 12–72 characters (bcrypt ignores bytes past 72).

Common responses: `400` invalid input, `401` missing/invalid credentials or token, `403` wrong role, `409` email already in use, `429` too many attempts.

## Project Goal

Build a production-oriented full-stack system demonstrating:

- Backend engineering
- REST API design
- PostgreSQL and data modeling
- Redis and caching
- Kafka / SQS and asynchronous processing
- Distributed systems concepts
- AWS cloud deployment
- Docker and CI/CD
- Testing and observability
- AI engineering and RAG
- React + TypeScript frontend

## High-Level Architecture

```text
React + TypeScript
        ↓
Node.js / NestJS Backend
        ↓
PostgreSQL + Redis
        ↓
Kafka / SQS
        ↓
Document Processing
        ↓
Python / FastAPI AI Service
        ↓
Embeddings + Vector Database
        ↓
LLM / RAG
        ↓
Answer + Source Citations
```

## Document Lifecycle

Documents will move through a defined processing lifecycle:

```text
pending → processing → ready
                  ↘ failed
```

The document status allows the system to track where each document is in the processing pipeline.

A document enters `pending` after successful upload and persistence.
When a background worker begins processing the document, its status changes to `processing`.

### Failure Recovery

Document processing must account for server crashes and interrupted jobs.
A document should not remain permanently stuck in `processing` if its processing job fails or the worker crashes.

### Asynchronous Processing

Document processing is handled asynchronously rather than blocking the upload request.

The upload API accepts the document, persists the necessary information, and creates a processing job. Background workers perform expensive operations such as text extraction, chunking, and embedding.

### Idempotency

Client retries can result in duplicate requests, especially when a client times out without knowing whether the server completed the operation.

The system will use idempotency mechanisms for operations where duplicate execution could create incorrect state or duplicate side effects.

### Idempotency Key Integrity

An idempotency key represents a single logical operation.

If the same key is reused with different request data, the request should be rejected rather than treated as an update. This prevents accidental or malicious reuse of an idempotency key from causing unexpected side effects.

### Concurrent Idempotent Requests

If an idempotency key is already associated with an in-progress operation, subsequent requests must not execute the operation again.

They should observe the existing operation state and receive the final result only after the original operation completes.

### File Storage

Original documents are stored in Amazon S3.
PostgreSQL stores document metadata and the S3 object key rather than storing the binary file itself.

## Repository Structure

```text
ai-enterprise-knowledge-platform/
├── backend/                 # NestJS API (TypeScript, ESM)
│   └── src/
│       ├── main.ts          # Bootstrap + Swagger setup
│       ├── app.module.ts    # Config + TypeORM wiring
│       ├── auth/            # Login, tokens, guards (JWT + roles), decorators
│       ├── users/           # User entity, roles, admin user creation
│       ├── scripts/         # seed-admin.ts
│       └── documents/       # Documents API (stub)
├── ai-service/              # Python / FastAPI AI service (planned)
├── frontend/                # React + TypeScript UI (planned)
├── docs/                    # Design docs
├── docker-compose.yml       # Local PostgreSQL
├── README.md
└── .gitignore
```

## Engineering Principles

This project is being built with a production-first mindset.

For each major feature, we consider:

1. Correctness
2. Failure handling
3. Security
4. Testing
5. Observability
6. Scalability
7. Maintainability
8. Engineering trade-offs

## Runtime & Operations

The backend runs as a Node.js process and uses runtime configuration rather than hard-coded environment-specific values.

Key operational concepts:

- Node.js process can be inspected using process-level information.
- Environment variables are used for runtime configuration.
- Secrets should not be hard-coded in source code.
- Linux CLI commands can be used to inspect files, processes, and logs.
- `grep` can be used to search logs for specific errors.
- `tail -f` can be used to follow logs as they are written.
- As the system scales to multiple backend instances, centralized logging becomes useful for troubleshooting across instances.

### Troubleshooting approach

1. Check whether the backend process is running.
2. Inspect application logs.
3. Search logs for relevant errors.
4. Check runtime configuration/environment variables.
5. For multiple instances, use centralized logging to investigate across instances.
