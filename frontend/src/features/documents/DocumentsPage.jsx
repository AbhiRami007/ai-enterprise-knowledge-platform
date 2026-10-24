import { useGetDocumentsQuery } from "../../app/api.js";
import { formatBytes, formatDate, formatFileType } from "../../utils/format.js";
import StatusBadge from "./StatusBadge.jsx";

function DocumentsPage() {
  const { data: documents, isLoading, error, refetch } = useGetDocumentsQuery();

  return (
    <>
      <h1>Documents</h1>

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
                    <div className="doc-title">{doc.title}</div>
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
