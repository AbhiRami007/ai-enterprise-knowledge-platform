import { useState } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router";
import {
  api,
  useDeleteDocumentMutation,
  useGetDocumentQuery,
  useMeQuery,
} from "../../app/api.js";
import { formatBytes, formatDate, formatFileType } from "../../utils/format.js";
import { canEditDocuments } from "../auth/permissions.js";
import StatusBadge from "./StatusBadge.jsx";

const POLL_MS = 3000;

const STATUS_HINTS = {
  pending: "Waiting to be processed.",
  processing: "Extracting text and building the search index…",
  ready: "Processed and available in search.",
};

function DocumentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: user } = useMeQuery();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteDocument, { isLoading: isDeleting, error: deleteError }] =
    useDeleteDocumentMutation();

  // Poll only while the document is still being processed.
  const cached = useSelector(api.endpoints.getDocument.select(id));
  const status = cached.data?.status;
  const polling = status === "pending" || status === "processing";

  const {
    data: doc,
    isLoading,
    error,
    refetch,
  } = useGetDocumentQuery(id, {
    pollingInterval: polling ? POLL_MS : 0,
    skipPollingIfUnfocused: true,
  });

  async function handleDelete() {
    try {
      await deleteDocument(id).unwrap();
      navigate("/documents", { state: { deletedTitle: doc.title } });
    } catch {
      // Shown below via `deleteError`.
    }
  }

  const backLink = (
    <Link to="/documents" className="back-link">
      ← All documents
    </Link>
  );

  if (isLoading) {
    return (
      <>
        {backLink}
        <p className="muted">Loading document…</p>
      </>
    );
  }

  // 400 is what the backend returns for an id that isn't a UUID.
  if (error?.status === 404 || error?.status === 400) {
    return (
      <>
        {backLink}
        <div className="empty-state">
          <p>Document not found.</p>
          <p className="muted">It may have been deleted.</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        {backLink}
        <div className="callout-error" role="alert">
          <p>Could not load the document.</p>
          <button type="button" className="button-secondary" onClick={refetch}>
            Try again
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      {backLink}

      <div className="page-header">
        <h1>{doc.title}</h1>
        <StatusBadge status={doc.status} />
      </div>

      {doc.status === "failed" ? (
        <div className="callout-error" role="alert">
          <p>
            Processing failed
            {doc.errorMessage ? `: ${doc.errorMessage}` : "."}
          </p>
        </div>
      ) : (
        <p className="muted">{STATUS_HINTS[doc.status]}</p>
      )}

      <section className="panel">
        <dl className="details">
          <dt>File name</dt>
          <dd>{doc.originalFilename}</dd>
          <dt>Type</dt>
          <dd>{formatFileType(doc.mimeType)}</dd>
          <dt>Size</dt>
          <dd>{formatBytes(doc.sizeBytes)}</dd>
          <dt>Uploaded</dt>
          <dd>{formatDate(doc.createdAt)}</dd>
          <dt>Last updated</dt>
          <dd>{formatDate(doc.updatedAt)}</dd>
        </dl>
      </section>

      {canEditDocuments(user) && (
        <section className="panel danger-zone" aria-label="Delete document">
          {confirmingDelete ? (
            <>
              <p>
                Delete “{doc.title}”? It will be removed from search. This
                can’t be undone.
              </p>
              {deleteError && (
                <p className="form-error" role="alert">
                  {deleteError.status === 403
                    ? "You don’t have permission to delete documents."
                    : "Could not delete the document. Try again."}
                </p>
              )}
              <div className="form-actions">
                <button
                  type="button"
                  className="button-danger"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting…" : "Delete document"}
                </button>
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => setConfirmingDelete(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <button
              type="button"
              className="button-secondary"
              onClick={() => setConfirmingDelete(true)}
            >
              Delete…
            </button>
          )}
        </section>
      )}
    </>
  );
}

export default DocumentDetailPage;
