// Matches the backend's DocumentStatus enum.
const LABELS = {
  pending: "Pending",
  processing: "Processing",
  ready: "Ready",
  failed: "Failed",
};

function StatusBadge({ status }) {
  return (
    <span className={`status-badge status-${status}`}>
      {LABELS[status] ?? status}
    </span>
  );
}

export default StatusBadge;
