# AI-Powered Enterprise Knowledge Platform

An enterprise knowledge platform that allows organizations to upload internal documents, process them asynchronously, search company knowledge, and ask an AI assistant questions grounded in those documents.

## Current Status

The project is in active development. The full UI exists; the backend is real for accounts and companies, while documents, search and the AI assistant still run on mock data in the browser.

| Area | Status |
| --- | --- |
| NestJS backend + Swagger docs, PostgreSQL (pgvector) via Docker Compose + TypeORM | ✅ Done |
| Auth: login, refresh token in an httpOnly cookie (rotating, single-use), logout, change password, `/me` | ✅ Done |
| Multi-tenancy: companies (`tenants`), every user belongs to one, data scoped per tenant | ✅ Done |
| Roles (`admin`, `editor`, `viewer`) | ✅ Done |
| Signup: create a company, or ask to join one; admins approve, reject (and later re-approve) requests | ✅ Done |
| Admin user management: list, add, approve, reject, delete | ✅ Done |
| Frontend: React + Redux Toolkit app with every screen (see [Frontend](#frontend)) | ✅ Done |
| Documents API: list, detail, upload (S3/MinIO), delete | 🚧 UI done on mock data; `GET /api/v1/documents/:id` is still a stub |
| Async document processing (text extraction, chunking) | ⏳ Next after documents |
| Search (embeddings + pgvector) | 🚧 UI done on mock data |
| AI assistant (RAG, streamed answers with citations, `ai-service/`) | 🚧 UI done on mock data |
| Redis, Kafka / SQS | ⏳ Planned |

### Known limitations

To be addressed once the main features work:

- No email verification yet (admin approval covers people joining an existing company).
- A deleted user's access token keeps working until it expires (up to 15 minutes).
- Company-name uniqueness is checked in code, not by a database constraint.
- The public company search lets anyone see which companies use the platform.
- Admins can't change an existing user's role or disable them yet.
- `package-lock.json` files are git-ignored, so dependency versions aren't pinned.

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
| `FRONTEND_ORIGIN` | No | `http://localhost:5173` | The one origin allowed by CORS (with credentials, so the refresh cookie works) |

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

### 6. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

The app runs at <http://localhost:5173>. Log in with the admin from step 4, or use **Create an account** to sign up.

In development, [MSW](https://mswjs.io) answers the requests the backend can't serve yet (documents, search, `/ask`) with fake data from `frontend/src/mocks/`; everything else goes to the real backend. The browser console shows `[MSW] Mocking enabled.` Mock data lives in memory, so a reload resets it.

| Variable (frontend) | Default | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:3000/api/v1` | Backend base URL |

### Frontend scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server (with mocks) |
| `npm run build` | Production build to `dist/` (mocks are not included) |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint |

### Backend scripts

| Command | Description |
| --- | --- |
| `npm run start` | Start the app |
| `npm run start:dev` | Start in watch mode |
| `npm run build` | Compile to `dist/` |
| `npm run seed:admin` | Create a tenant admin (see above) |
| `npm test` | Run Jest unit tests (SWC, ESM) |

## API

Every route requires `Authorization: Bearer <accessToken>` unless marked public. Everything is scoped to the caller's tenant (taken from the token, never from the request): another company's records answer `404`.

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/` | Public | Health / banner text |
| `POST` | `/api/v1/auth/signup` | Public | Create a company (you become its admin) or ask to join one (pending until an admin approves) |
| `POST` | `/api/v1/auth/login` | Public | Email + password → access and refresh tokens |
| `POST` | `/api/v1/auth/refresh` | Public | Refresh token → new token pair |
| `POST` | `/api/v1/auth/logout` | Public | Revoke a refresh token |
| `POST` | `/api/v1/auth/logout-all` | Bearer | Revoke every session of the current user |
| `PATCH` | `/api/v1/auth/password` | Bearer | Change password (ends other sessions) |
| `GET` | `/api/v1/auth/me` | Bearer | Current user's profile |
| `GET` | `/api/v1/tenants/search?q=` | Public | Find companies by name for signup (min 2 characters, max 10 results) |
| `GET` | `/api/v1/users` | Bearer, admin | List the users in the admin's tenant, including join requests |
| `POST` | `/api/v1/users` | Bearer, admin | Create a user in the admin's tenant |
| `PATCH` | `/api/v1/users/:id/approve` | Bearer, admin | Approve a pending or rejected join request, with a role |
| `PATCH` | `/api/v1/users/:id/reject` | Bearer, admin | Reject a pending join request (kept, can be approved later) |
| `DELETE` | `/api/v1/users/:id` | Bearer, admin | Delete a user or join request and all their sessions (not yourself, not the last admin) |
| `GET` | `/api/v1/documents/:id` | Bearer | Get a document by UUID (stub; the frontend uses a mock for now) |

### Signup and join requests

- **New company:** `POST /auth/signup` with `companyName` creates the tenant and makes you its admin in one transaction, and logs you in (`201`). Company names are unique, ignoring case.
- **Existing company:** with `tenantId` instead, you get a `pending` account (`202`, no tokens). Logging in returns `403` with `code: "ACCOUNT_PENDING"` until an admin of that company approves you; after a rejection it's `ACCOUNT_REJECTED`. Rejected requests are kept, so the email can't re-apply, and an admin can still approve them later.
- `GET /tenants/search` is public so the signup page can offer a company picker. It only returns ids and names, needs 2+ characters, returns at most 10 results and is rate-limited, but it does let anyone look up which companies use the platform.
- There is no email verification yet: admin approval is the check for people joining a company.
- Deleting a user removes their account and refresh tokens. An access token issued before the delete keeps working until it expires (up to 15 minutes), because access tokens aren't checked against the database.

### Authentication flow

The refresh token never appears in a response body: it's set as an **httpOnly cookie** (`refresh_token`, `SameSite=Strict`, path `/api/v1/auth`, `Secure` in production), so page scripts can't read it. The access token is returned in the body and kept only in memory by the frontend.

```bash
# Log in (-c saves the refresh cookie)
curl -c cookies.txt -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"a-long-passphrase"}'
# → { "accessToken": "<jwt>", "tokenType": "Bearer", "expiresIn": 900 }  + Set-Cookie: refresh_token=…

# Call a protected route
curl http://localhost:3000/api/v1/auth/me -H "Authorization: Bearer <jwt>"

# When the access token expires, get a new one (-b sends the cookie, -c stores the rotated one)
curl -b cookies.txt -c cookies.txt -X POST http://localhost:3000/api/v1/auth/refresh

# Log out (revokes the token and clears the cookie)
curl -b cookies.txt -X POST http://localhost:3000/api/v1/auth/logout
```

In the browser, the frontend sends requests with `credentials: "include"`, refreshes on page load to restore the session, and on any `401` refreshes once and retries. All refreshes share one in-flight request, because a second parallel refresh would reuse the single-use token and end every session.

How it works:

- **Access tokens** are JWTs valid for **15 minutes**, carrying `sub` (user ID), `role` and `tenantId`. They are not stored, so they can't be revoked early; that's why they are short-lived.
- **Refresh tokens** are random 256-bit strings valid for 7 days. Only their SHA-256 hash is stored in `refresh_tokens`.
- Refresh tokens are **single-use**: each refresh revokes the old token and issues a new pair. If an already-used token is presented again, it's treated as stolen and **every session for that user is revoked**.
- **Logout** revokes the refresh token and always returns `204`. The current access token stays valid until it expires (at most 15 minutes).
- **Changing the password** revokes all refresh tokens and issues a new access token and cookie for the current session, so every other device is signed out.
- Login responses take the same time whether or not the email exists. Only users that are active and approved can log in, refresh or call `/me`; disabled, pending and rejected users can't.
- Login, password change and signup are limited to **5 attempts per minute per IP**, and company search to 30 per minute (`429` with `Retry-After`). Counts are kept in memory per instance; they'll move to Redis when the backend runs on multiple instances.
- Passwords are hashed with bcrypt (12 rounds). New passwords must be 12–72 characters (bcrypt ignores bytes past 72).

Common responses: `400` invalid input, `401` missing/invalid credentials or token, `403` wrong role or account not approved yet, `404` not found in your tenant, `409` conflict (email or company name taken, deleting yourself or the last admin), `429` too many attempts.

## Frontend

React (Vite, plain JavaScript) with Redux Toolkit: `authSlice` keeps the access token in memory, `chatSlice` keeps the assistant conversation, and RTK Query handles every other API call and its cache.

| Route | Who | What | Data |
| --- | --- | --- | --- |
| `/login`, `/signup` | Everyone | Log in; sign up by creating a company or picking one from a searchable list | Real |
| `/` | Logged in | Dashboard: quick search, document counts by status, recent uploads | Mock (documents) |
| `/documents`, `/documents/:id` | Logged in | List, detail, status polling while processing; upload and delete for editors and admins | Mock |
| `/search` | Logged in | Search passages with highlighted matches; the query is in the URL | Mock |
| `/ask` | Logged in | AI assistant: streamed answers with numbered sources, stop and retry | Mock |
| `/account` | Logged in | Profile with company, change password | Real |
| `/admin/users` | Admins | Members, pending and rejected join requests, add, approve, reject, delete | Real |

The header shows the company name, and admins see a badge with the number of pending join requests. Controls a role can't use are hidden, but the backend enforces every permission itself.

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
- React + Redux Toolkit frontend

## High-Level Architecture

```text
React + Redux Toolkit
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
│       ├── auth/            # Login, signup, refresh cookie, tokens, guards (JWT, roles, rate limit)
│       ├── tenants/         # Tenant (company) entity, public company search
│       ├── users/           # User entity, roles, statuses, admin user management
│       ├── scripts/         # seed-admin.ts
│       └── documents/       # Documents API (stub)
├── ai-service/              # Python / FastAPI AI service (planned)
├── frontend/                # React + Redux Toolkit UI (Vite, JavaScript)
│   ├── public/              # mockServiceWorker.js (generated by MSW)
│   └── src/
│       ├── app/             # Store, RTK Query API layer (with refresh-and-retry), layout
│       ├── features/        # auth, home, documents, search, ask, account, admin
│       ├── mocks/           # MSW handlers + fake data for endpoints not built yet
│       └── utils/           # Formatting, server-sent events parser
├── docs/                    # Design docs
├── docker-compose.yml       # Local PostgreSQL (pgvector)
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
