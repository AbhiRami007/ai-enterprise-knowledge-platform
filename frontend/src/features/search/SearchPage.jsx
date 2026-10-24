import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useSearchQuery } from "../../app/api.js";
import Highlight from "./Highlight.jsx";
import { MAX_QUERY_LENGTH, MIN_QUERY_LENGTH } from "./terms.js";

function SearchForm({ initialQuery, onSearch }) {
  const [text, setText] = useState(initialQuery);

  function handleSubmit(event) {
    event.preventDefault();
    onSearch(text.trim());
  }

  return (
    <form className="search-form" role="search" onSubmit={handleSubmit}>
      <label className="visually-hidden" htmlFor="search-input">
        Search documents
      </label>
      <input
        id="search-input"
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={MAX_QUERY_LENGTH}
        placeholder="Search company documents…"
        autoFocus
      />
      <button type="submit">Search</button>
    </form>
  );
}

function SearchPage() {
  // The query lives in the URL (/search?q=…), so reload, back and shared
  // links all show the same results.
  const [searchParams, setSearchParams] = useSearchParams();
  const query = (searchParams.get("q") ?? "").trim();
  const tooShort = query.length < MIN_QUERY_LENGTH;

  // currentData is only the result for *this* query, so results of the
  // previous search don't stay on screen while the new one loads.
  const { currentData, isFetching, error, refetch } = useSearchQuery(query, {
    skip: tooShort,
  });
  const results = currentData?.results;

  function handleSearch(text) {
    setSearchParams(text ? { q: text } : {});
  }

  return (
    <>
      <h1>Search</h1>
      {/* key: remount with the new text when the URL changes, e.g. on back. */}
      <SearchForm key={query} initialQuery={query} onSearch={handleSearch} />

      {query === "" && (
        <p className="muted">
          Search across all processed documents, for example “vacation” or
          “password”.
        </p>
      )}

      {query !== "" && tooShort && (
        <p className="muted">Type at least {MIN_QUERY_LENGTH} characters.</p>
      )}

      {isFetching && <p className="muted">Searching…</p>}

      {error && (
        <div className="callout-error" role="alert">
          <p>Search failed.</p>
          <button type="button" className="button-secondary" onClick={refetch}>
            Try again
          </button>
        </div>
      )}

      {results?.length === 0 && (
        <div className="empty-state">
          <p>No results for “{query}”.</p>
          <p className="muted">
            Try different words. Documents still processing aren’t searchable
            yet.
          </p>
        </div>
      )}

      {results?.length > 0 && (
        <>
          <p className="muted small" aria-live="polite">
            {results.length} {results.length === 1 ? "result" : "results"} for
            “{query}”
          </p>
          <ol className="search-results">
            {results.map((result) => (
              <li key={result.chunkId} className="search-result">
                <Link
                  to={`/documents/${result.documentId}`}
                  className="doc-title"
                >
                  {result.documentTitle}
                </Link>
                <p>
                  <Highlight text={result.snippet} query={query} />
                </p>
                <span className="muted small">
                  Relevance {Math.round(result.score * 100)}%
                </span>
              </li>
            ))}
          </ol>
        </>
      )}
    </>
  );
}

export default SearchPage;
