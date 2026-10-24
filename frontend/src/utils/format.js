const UNITS = ["B", "KB", "MB", "GB"];

// sizeBytes arrives as a string (Postgres bigint), so convert first.
export function formatBytes(value) {
  let size = Number(value);
  let unit = 0;
  while (size >= 1024 && unit < UNITS.length - 1) {
    size /= 1024;
    unit += 1;
  }
  const digits = unit === 0 || size >= 10 ? 0 : 1;
  return `${size.toFixed(digits)} ${UNITS[unit]}`;
}

const dateFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatDate(iso) {
  return dateFormat.format(new Date(iso));
}

const FILE_TYPES = {
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "Word",
  "text/markdown": "Markdown",
  "text/plain": "Text",
};

export function formatFileType(mimeType) {
  return FILE_TYPES[mimeType] ?? mimeType;
}
