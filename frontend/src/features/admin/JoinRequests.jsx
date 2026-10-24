import { useState } from "react";
import {
  useApproveUserMutation,
  useRejectUserMutation,
} from "../../app/api.js";
import { formatDate } from "../../utils/format.js";

const ROLE_OPTIONS = [
  { value: "viewer", label: "Viewer" },
  { value: "editor", label: "Editor" },
  { value: "admin", label: "Admin" },
];

function actionErrorMessage(error) {
  // 404: someone else already handled it, e.g. another admin.
  if (error.status === 404) return "This request was already handled.";
  return "Something went wrong. Try again.";
}

// One request: pick a role, then approve. Pending ones can also be
// rejected; rejected ones can only be approved (re-accepted).
function RequestRow({ user, canReject, onDone }) {
  const [role, setRole] = useState("viewer");
  const [approve, approveState] = useApproveUserMutation();
  const [reject, rejectState] = useRejectUserMutation();
  const busy = approveState.isLoading || rejectState.isLoading;
  const error = approveState.error ?? rejectState.error;

  async function handleApprove() {
    try {
      await approve({ id: user.id, role }).unwrap();
      onDone(`${user.email} can now log in as ${role}.`);
    } catch {
      // Shown below via `error`.
    }
  }

  async function handleReject() {
    try {
      await reject(user.id).unwrap();
      onDone(`${user.email} was declined. You can still approve them later.`);
    } catch {
      // Shown below via `error`.
    }
  }

  return (
    <li className="request-row">
      <div className="request-who">
        <div className="doc-title">{user.email}</div>
        <div className="muted small">
          {user.status === "rejected"
            ? `Declined ${formatDate(user.rejectedAt)}`
            : `Asked ${formatDate(user.createdAt)}`}
        </div>
        {error && (
          <p className="form-error" role="alert">
            {actionErrorMessage(error)}
          </p>
        )}
      </div>
      <div className="request-actions">
        <label className="visually-hidden" htmlFor={`role-${user.id}`}>
          Role for {user.email}
        </label>
        <select
          id={`role-${user.id}`}
          value={role}
          onChange={(e) => setRole(e.target.value)}
          disabled={busy}
        >
          {ROLE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button type="button" onClick={handleApprove} disabled={busy}>
          {approveState.isLoading ? "Approving…" : "Approve"}
        </button>
        {canReject && (
          <button
            type="button"
            className="button-secondary"
            onClick={handleReject}
            disabled={busy}
          >
            {rejectState.isLoading ? "Declining…" : "Reject"}
          </button>
        )}
      </div>
    </li>
  );
}

// Pending requests stay visible at the top; rejected ones are collapsed but
// can still be approved later.
function JoinRequests({ users }) {
  const [notice, setNotice] = useState(null);
  const pending = users.filter((u) => u.status === "pending");
  const rejected = users.filter((u) => u.status === "rejected");

  return (
    <>
      {notice && (
        <p className="callout-success" role="status">
          {notice}
        </p>
      )}

      {pending.length > 0 && (
        <section className="panel" aria-labelledby="pending-heading">
          <h2 id="pending-heading" className="panel-heading">
            Pending requests ({pending.length})
          </h2>
          <p className="muted small">
            These people signed up to join your company. Choose a role and
            approve them, or reject the request.
          </p>
          <ul className="request-list">
            {pending.map((user) => (
              <RequestRow
                key={user.id}
                user={user}
                canReject
                onDone={setNotice}
              />
            ))}
          </ul>
        </section>
      )}

      {rejected.length > 0 && (
        <details className="panel rejected-panel">
          <summary>Rejected requests ({rejected.length})</summary>
          <ul className="request-list">
            {rejected.map((user) => (
              <RequestRow
                key={user.id}
                user={user}
                canReject={false}
                onDone={setNotice}
              />
            ))}
          </ul>
        </details>
      )}
    </>
  );
}

export default JoinRequests;
