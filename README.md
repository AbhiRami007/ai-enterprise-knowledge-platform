# AI-Powered Enterprise Knowledge Platform

An enterprise knowledge platform that allows organizations to upload internal documents, process them asynchronously, search company knowledge, and ask an AI assistant questions grounded in those documents.

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
├── frontend/
├── backend/
├── ai-service/
├── docs/
├── README.md
└── .gitignore
```

## Current Progress

- [x] Repository initialized
- [x] Project structure created
- [ ] Document validation
- [ ] Document upload API
- [ ] Document persistence
- [ ] Asynchronous document processing
- [ ] Authentication and authorization
- [ ] Search
- [ ] RAG pipeline
- [ ] AI assistant
- [ ] Testing
- [ ] Observability
- [ ] AWS deployment
- [ ] CI/CD

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
