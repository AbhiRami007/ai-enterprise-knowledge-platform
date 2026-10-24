import { delay, http, HttpResponse } from "msw";
import { API_URL } from "../app/api.js";
import { documents } from "./db.js";

// Mirrors the backend's JwtAuthGuard, so the 401-refresh logic gets exercised.
function unauthorized(request) {
  if (!request.headers.get("Authorization")) {
    return HttpResponse.json(
      { statusCode: 401, message: "Unauthorized" },
      { status: 401 }
    );
  }
  return null;
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
];
