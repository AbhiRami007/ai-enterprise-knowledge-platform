import { useState } from "react";
import { Link, useLocation } from "react-router";
import { useMeQuery } from "../../app/api.js";
import { formatBytes, formatDate, formatFileType } from "../../utils/format.js";
import { canEditDocuments } from "../auth/permissions.js";
import StatusBadge from "./StatusBadge.jsx";
import UploadForm from "./UploadForm.jsx";
import { useDocuments } from "./useDocuments.js";

function DocumentsPage() {
  const location = useLocation();
  // openUpload: set by the home page's "Upload your first document" button.
  const [showUpload, setShowUpload] = useState(
    location.state?.openUpload ?? false
  );
  const [uploadedTitle, setUploadedTitle] = useState(null);
  const { data: user } = useMeQuery();
  // Set by DocumentDetailPage after a delete.
  const deletedTitle = location.state?.deletedTitle;

  const { data: documents, isLoading, error, refetch } = useDocuments();

  function handleUploaded(document) {
    setShowUpload(false);
    setUploadedTitle(document.title);
  }

  return (
    <>
      <div className="page-header">
        <h1>Documents</h1>
        {canEditDocuments(user) && (
          <button
            type="button"
            onClick={() => {
              setShowUpload((open) => !open);
              setUploadedTitle(null);
            }}
            aria-expanded={showUpload}
          >
            {showUpload ? "Cancel" : "Upload document"}
          </button>
        )}
      </div>

      {deletedTitle && !uploadedTitle && (
        <p className="callout-success" role="status">
          “{deletedTitle}” was deleted.
        </p>
      )}

      {showUpload && (
        <section className="panel" aria-label="Upload a document">
          <UploadForm onUploaded={handleUploaded} />
        </section>
      )}

      {uploadedTitle && (
        <p className="callout-success" role="status">
          “{uploadedTitle}” uploaded. It will be ready to search once
          processing finishes.
        </p>
      )}

      {isLoading && <p className="muted">Loading documents…</p>}

      {error && (
        <div className="callout-error" role="alert">
          <p>Could not load documents.</p>
          <button type="button" className="button-secondary" onClick={refetch}>
            Try again
          </button>
        </div>
      )}

      {documents?.length === 0 && (
        <div className="empty-state">
          <p>No documents yet.</p>
          <p className="muted">Uploaded documents will appear here.</p>
        </div>
      )}

      {documents?.length > 0 && (
        // Scrolls sideways on narrow screens instead of squashing columns.
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Title</th>
                <th scope="col">Status</th>
                <th scope="col">Type</th>
                <th scope="col" className="numeric">
                  Size
                </th>
                <th scope="col">Uploaded</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td>
                    <Link to={`/documents/${doc.id}`} className="doc-title">
                      {doc.title}
                    </Link>
                    <div className="muted small">{doc.originalFilename}</div>
                  </td>
                  <td>
                    <StatusBadge status={doc.status} />
                  </td>
                  <td>{formatFileType(doc.mimeType)}</td>
                  <td className="numeric">{formatBytes(doc.sizeBytes)}</td>
                  <td className="nowrap">{formatDate(doc.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default DocumentsPage;
