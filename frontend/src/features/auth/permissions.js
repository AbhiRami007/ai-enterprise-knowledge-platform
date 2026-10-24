// Only hides controls the user can't use. The backend must still check the
// role on every request, since the UI can be bypassed.
const DOCUMENT_EDITOR_ROLES = ["admin", "editor"];

export function canEditDocuments(user) {
  return DOCUMENT_EDITOR_ROLES.includes(user?.role);
}
