// Checked in the browser for quick feedback; the backend must enforce the
// same rules, since anyone can call the API directly.
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
export const MAX_TITLE_LENGTH = 255;

export const ACCEPTED_TYPES = {
  "application/pdf": ".pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    ".docx",
  "text/markdown": ".md",
  "text/plain": ".txt",
};

// For <input accept>: extensions too, because browsers often report
// Markdown files with an empty or generic type.
export const ACCEPT_ATTRIBUTE = [
  ...Object.keys(ACCEPTED_TYPES),
  ...Object.values(ACCEPTED_TYPES),
].join(",");

function extensionOf(filename) {
  const dot = filename.lastIndexOf(".");
  return dot === -1 ? "" : filename.slice(dot).toLowerCase();
}

// Falls back to the extension when the browser doesn't know the type.
export function resolveMimeType(file) {
  if (ACCEPTED_TYPES[file.type]) return file.type;
  const extension = extensionOf(file.name);
  return (
    Object.keys(ACCEPTED_TYPES).find(
      (type) => ACCEPTED_TYPES[type] === extension
    ) ?? null
  );
}

// Returns an error message, or null if the file is acceptable.
export function validateFile(file) {
  if (!resolveMimeType(file)) {
    return "Only PDF, Word (.docx), Markdown and text files are supported.";
  }
  if (file.size === 0) {
    return "The file is empty.";
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return "The file is larger than 20 MB.";
  }
  return null;
}

export function titleFromFilename(filename) {
  const dot = filename.lastIndexOf(".");
  const base = dot > 0 ? filename.slice(0, dot) : filename;
  return base.replace(/[-_]+/g, " ").trim().slice(0, MAX_TITLE_LENGTH);
}
