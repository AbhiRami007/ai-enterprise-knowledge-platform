# AI-Powered Enterprise Knowledge Platform

An enterprise knowledge platform that allows organizations to upload internal documents, process them asynchronously, search company knowledge, and ask an AI assistant questions grounded in those documents.

## Current Status

The project is in early development. What exists today:

| Area | Status |
| --- | --- |
| NestJS backend skeleton + Swagger docs | ✅ Done |
| PostgreSQL via Docker Compose + TypeORM | ✅ Done |
| Email/password login issuing a JWT (`POST /api/v1/auth/login`) | ✅ Done |
| Documents API (`GET /api/v1/documents/:id`) | 🚧 Stub data, not yet guarded by auth |
| Document upload, S3 storage, async processing | ⏳ Planned |
| Redis, Kafka / SQS | ⏳ Planned |
| AI service (`ai-service/`), RAG | ⏳ Planned |
| Frontend (`frontend/`) | ⏳ Planned |

## Getting Started

### Prerequisites

- Node.js (recent LTS) and npm
- Docker and Docker Compose

### 1. Configure environment variables

Create a `.env` file in the **repository root** (read by Docker Compose and, as a fallback, by the backend):

```env
POSTGRES_PASSWORD=change-me
```

Create `backend/.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=app_user
DB_PASSWORD=change-me          # must match POSTGRES_PASSWORD
DB_DATABASE=knowledge_platform
JWT_SECRET=a-long-random-string
```

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `POSTGRES_PASSWORD` | Yes | – | Password for the Postgres container's `app_user` |
| `DB_HOST` | No | `localhost` | Postgres host |
| `DB_PORT` | No | `5432` | Postgres port |
| `DB_USERNAME` | No | `app_user` | Postgres user |
| `DB_PASSWORD` | Yes | – | Postgres password used by the backend |
| `DB_DATABASE` | No | `knowledge_platform` | Database name |
| `JWT_SECRET` | Yes | – | Secret used to sign access tokens |

`.env` files are git-ignored. Never commit real secrets.

### 2. Start PostgreSQL

```bash
docker compose up -d
docker compose ps   # wait until postgres is "healthy"
```

Postgres is bound to `127.0.0.1:5432` only, and data persists in the `postgres_data` volume.

### 3. Create the schema

TypeORM runs with `synchronize: false` and there are no migrations yet, so create the `users` table manually:

```bash
docker exec -it knowledge-platform-postgres psql -U app_user -d knowledge_platform
```

```sql
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR NOT NULL UNIQUE,
  password_hash VARCHAR NOT NULL,
  role          VARCHAR NOT NULL,
  tenant_id     VARCHAR NOT NULL
);
```

To seed a test user, generate a bcrypt hash from the `backend/` directory:

```bash
node -e "import('bcryptjs').then(b => console.log(b.hashSync('Password123!', 10)))"
```

Then insert it:

```sql
INSERT INTO users (email, password_hash, role, tenant_id)
VALUES ('user@example.com', '<hash from above>', 'admin', 'tenant-1');
```

### 4. Run the backend

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
| `npm test` | Run Jest unit tests (SWC, ESM) |

## API

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/` | Health / banner text |
| `POST` | `/api/v1/auth/login` | Exchange email + password for a JWT |
| `GET` | `/api/v1/documents/:id` | Get a document by ID (stub) |

Example login:

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Password123!"}'
# → { "accessToken": "<jwt>" }
```

Responses: `200` with an access token, `400` if email or password is missing, `401` for invalid credentials. Tokens expire after **15 minutes** and carry `sub` (user ID), `role` and `tenantId` claims.

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
│       ├── auth/            # Login endpoint, JWT issuing
│       ├── users/           # User entity + repository
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
