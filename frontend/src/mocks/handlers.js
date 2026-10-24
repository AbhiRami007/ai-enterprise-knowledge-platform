import { delay, http, HttpResponse } from "msw";
import { API_URL } from "../app/api.js";
import {
  MAX_TITLE_LENGTH,
  MAX_UPLOAD_BYTES,
  resolveMimeType,
  titleFromFilename,
} from "../features/documents/uploadRules.js";
import {
  MAX_QUERY_LENGTH,
  MIN_QUERY_LENGTH,
  searchTerms,
  termsPattern,
} from "../features/search/terms.js";
import { chunks, documents } from "./db.js";

// Same JSON shape as NestJS's built-in HTTP exceptions.
function errorResponse(status, message) {
  return HttpResponse.json({ statusCode: status, message }, { status });
}

// Mirrors the backend's JwtAuthGuard, so the 401-refresh logic gets exercised.
function unauthorized(request) {
  return request.headers.get("Authorization")
    ? null
    : errorResponse(401, "Unauthorized");
}

// Reads the role claim from the real access token (no signature check: the
// mock only needs to behave like the backend's RolesGuard, not secure it).
function roleFrom(request) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(payload)).role;
  } catch {
    return null;
  }
}

function forbiddenUnlessEditor(request) {
  return ["admin", "editor"].includes(roleFrom(request))
    ? null
    : errorResponse(403, "Forbidden resource");
}

const notFound = () => errorResponse(404, "Document not found");

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Keyword stand-in for the real semantic search: score = share of the query
// terms found in the chunk, so 1.0 means every term matched.
function searchChunks(query, limit) {
  const terms = searchTerms(query);
  if (terms.length === 0) return [];

  const ready = new Map(
    documents.filter((d) => d.status === "ready").map((d) => [d.id, d])
  );

  return chunks
    .filter((chunk) => ready.has(chunk.documentId))
    .map((chunk) => {
      const found = new Set(
        [...chunk.text.matchAll(termsPattern(terms))].map((m) =>
          m[0].toLowerCase()
        )
      );
      const matched = terms.filter((term) =>
        [...found].some((word) => word.startsWith(term))
      );
      return { chunk, score: matched.length / terms.length };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ chunk, score }) => ({
      documentId: chunk.documentId,
      documentTitle: ready.get(chunk.documentId).title,
      chunkId: chunk.id,
      snippet: chunk.text,
      score: Math.round(score * 100) / 100,
    }));
}

// Fakes the background worker: pending -> processing -> ready (or failed
// when the filename contains "fail", to try the error state).
function simulateProcessing(doc) {
  const update = (fields) => {
    Object.assign(doc, fields, { updatedAt: new Date().toISOString() });
  };
  setTimeout(() => update({ status: "processing" }), 3000);
  setTimeout(() => {
    if (doc.originalFilename.toLowerCase().includes("fail")) {
      update({
        status: "failed",
        errorMessage: "Could not extract text from the file.",
      });
    } else {
      update({ status: "ready" });
    }
  }, 9000);
}

// Only endpoints the backend doesn't have yet. Delete a handler once the
// real endpoint exists; everything else goes to the real backend.
export const handlers = [
  http.get(`${API_URL}/documents`, async ({ request }) => {
    await delay();
    const denied = unauthorized(request);
    if (denied) return denied;

    const newestFirst = [...documents].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    );
    return HttpResponse.json(newestFirst);
  }),

  // multipart/form-data with "file" and an optional "title".
  http.post(`${API_URL}/documents`, async ({ request }) => {
    await delay(800);
    const denied = unauthorized(request) ?? forbiddenUnlessEditor(request);
    if (denied) return denied;

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return errorResponse(400, "file is required");
    }

    const mimeType = resolveMimeType(file);
    if (!mimeType) {
      return errorResponse(415, "Unsupported file type");
    }
    if (file.size === 0) {
      return errorResponse(400, "file must not be empty");
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return errorResponse(413, "File too large");
    }

    const title = (form.get("title") ?? "").trim();
    if (title.length > MAX_TITLE_LENGTH) {
      return errorResponse(400, "title must be at most 255 characters");
    }

    const now = new Date().toISOString();
    const doc = {
      id: crypto.randomUUID(),
      title: title || titleFromFilename(file.name),
      originalFilename: file.name,
      mimeType,
      sizeBytes: String(file.size),
      status: "pending",
      errorMessage: null,
      createdAt: now,
      updatedAt: now,
    };
    documents.push(doc);
    simulateProcessing(doc);

    return HttpResponse.json(doc, { status: 201 });
  }),

  // GET /search?q=…&limit=…: best-matching passages of ready documents.
  http.get(`${API_URL}/search`, async ({ request }) => {
    await delay();
    const denied = unauthorized(request);
    if (denied) return denied;

    const url = new URL(request.url);
    const q = (url.searchParams.get("q") ?? "").trim();
    if (q.length < MIN_QUERY_LENGTH || q.length > MAX_QUERY_LENGTH) {
      return errorResponse(400, "q must be 2-200 characters");
    }
    const limit = Math.min(Number(url.searchParams.get("limit")) || 20, 50);

    return HttpResponse.json({ query: q, results: searchChunks(q, limit) });
  }),

  // POST /ask { question } -> text/event-stream of "token" events, then
  // "citations" and "done". Answers only from document passages.
  http.post(`${API_URL}/ask`, async ({ request }) => {
    const denied = unauthorized(request);
    if (denied) return denied;

    const { question } = await request.json().catch(() => ({}));
    const text = typeof question === "string" ? question.trim() : "";
    if (text.length === 0 || text.length > 2000) {
      return errorResponse(400, "question must be 1-2000 characters");
    }

    const sources = searchChunks(text, 3).map((result, i) => ({
      index: i + 1,
      documentId: result.documentId,
      documentTitle: result.documentTitle,
      chunkId: result.chunkId,
      snippet: result.snippet,
    }));

    const answer =
      sources.length === 0
        ? "I couldn't find anything about that in your documents. Try rephrasing, or check that the relevant document has been uploaded and processed."
        : [
            "Here is what your documents say.",
            ...sources.map((s) => `${s.snippet} [${s.index}]`),
          ].join(" ");

    const encoder = new TextEncoder();
    const send = (controller, event, data) =>
      controller.enqueue(
        encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
      );

    let cancelled = false;
    const stream = new ReadableStream({
      async start(controller) {
        await delay(700); // "Thinking…" before the first word.
        for (const word of answer.split(/(?<= )/)) {
          if (cancelled) return;
          send(controller, "token", { text: word });
          await delay(30);
        }
        if (cancelled) return;
        send(controller, "citations", sources);
        send(controller, "done", {});
        controller.close();
      },
      // The client pressed Stop or left: stop producing words.
      cancel() {
        cancelled = true;
      },
    });

    return new HttpResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  }),

  // Overrides the backend's stub GET /documents/:id until it reads Postgres.
  http.get(`${API_URL}/documents/:id`, async ({ request, params }) => {
    await delay();
    const denied = unauthorized(request);
    if (denied) return denied;
    if (!UUID.test(params.id)) {
      return errorResponse(400, "id must be a UUID");
    }

    const doc = documents.find((d) => d.id === params.id);
    return doc ? HttpResponse.json(doc) : notFound();
  }),

  http.delete(`${API_URL}/documents/:id`, async ({ request, params }) => {
    await delay(600);
    const denied = unauthorized(request) ?? forbiddenUnlessEditor(request);
    if (denied) return denied;

    const index = documents.findIndex((d) => d.id === params.id);
    if (index === -1) return notFound();
    documents.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
