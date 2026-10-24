import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useMeQuery } from "../../app/api.js";
import { formatDate } from "../../utils/format.js";
import { canEditDocuments } from "../auth/permissions.js";
import StatusBadge from "../documents/StatusBadge.jsx";
import { useDocuments } from "../documents/useDocuments.js";
import { MAX_QUERY_LENGTH } from "../search/terms.js";

const RECENT_COUNT = 5;

const STATUS_TILES = [
  { status: "ready", label: "Ready" },
  { status: "processing", label: "Processing" },
  { status: "pending", label: "Pending" },
  { status: "failed", label: "Failed" },
];

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function QuickSearch() {
  const navigate = useNavigate();
  const [text, setText] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    const q = text.trim();
    if (q) navigate(`/search?${new URLSearchParams({ q })}`);
  }

  return (
    <form className="search-form" role="search" onSubmit={handleSubmit}>
      <label className="visually-hidden" htmlFor="home-search">
        Search documents
      </label>
      <input
        id="home-search"
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={MAX_QUERY_LENGTH}
        placeholder="Search company documents…"
      />
      <button type="submit">Search</button>
    </form>
  );
}

function DocumentSummary({ canUpload }) {
  const { data: documents, isLoading, error, refetch } = useDocuments();

  if (isLoading) {
    return <p className="muted">Loading documents…</p>;
  }

  if (error) {
    return (
      <div className="callout-error" role="alert">
        <p>Could not load documents.</p>
        <button type="button" className="button-secondary" onClick={refetch}>
          Try again
        </button>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="empty-state">
        {canUpload ? (
          <>
            <p>Upload your first document.</p>
            <p className="muted">
              Once processed, it becomes searchable and the assistant can
              answer from it.
            </p>
            <Link
              to="/documents"
              state={{ openUpload: true }}
              className="button-link"
            >
              Upload a document
            </Link>
          </>
        ) : (
          <>
            <p>No documents yet.</p>
            <p className="muted">
              Documents uploaded by your team will appear here.
            </p>
          </>
        )}
      </div>
    );
  }

  const counts = Object.groupBy(documents, (doc) => doc.status);
  // The list comes back newest first.
  const recent = documents.slice(0, RECENT_COUNT);

  return (
    <>
      <ul className="stat-tiles" aria-label="Documents by status">
        {STATUS_TILES.map(({ status, label }) => (
          <li key={status}>
            <Link to="/documents" className={`stat-tile stat-${status}`}>
              <span className="stat-value">{counts[status]?.length ?? 0}</span>
              <span className="stat-label">{label}</span>
            </Link>
          </li>
        ))}
      </ul>

      <section className="panel">
        <div className="section-header">
          <h2>Recently uploaded</h2>
          <Link to="/documents" className="back-link">
            View all documents →
          </Link>
        </div>
        <ul className="recent-list">
          {recent.map((doc) => (
            <li key={doc.id}>
              <div>
                <Link to={`/documents/${doc.id}`} className="doc-title">
                  {doc.title}
                </Link>
                <div className="muted small">{formatDate(doc.createdAt)}</div>
              </div>
              <StatusBadge status={doc.status} />
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

function HomePage() {
  const { data: user } = useMeQuery();

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{greeting()}</h1>
          {user && <p className="muted page-subtitle">{user.email}</p>}
        </div>
        <Link to="/ask" className="button-link">
          Ask a question
        </Link>
      </div>

      <QuickSearch />

      <DocumentSummary canUpload={canEditDocuments(user)} />
    </>
  );
}

export default HomePage;
