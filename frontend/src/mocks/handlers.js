import { delay, http, HttpResponse } from "msw";
import { API_URL } from "../app/api.js";
import {
  MAX_TITLE_LENGTH,
  MAX_UPLOAD_BYTES,
  resolveMimeType,
  titleFromFilename,
} from "../features/documents/uploadRules.js";
import { documents } from "./db.js";

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
    const denied = unauthorized(request);
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
];
