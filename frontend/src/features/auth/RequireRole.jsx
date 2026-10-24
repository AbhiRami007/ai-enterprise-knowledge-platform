import { Navigate } from "react-router";
import { useMeQuery } from "../../app/api.js";

// For pages only some roles may open, e.g. <RequireRole role="admin">.
// Used inside RequireAuth, so the user is already logged in. This only
// keeps the page out of the way: the backend still checks the role.
function RequireRole({ role, children }) {
  const { data: user, isLoading } = useMeQuery();

  if (isLoading) {
    return <p className="muted">Loading…</p>;
  }

  if (user?.role !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default RequireRole;
