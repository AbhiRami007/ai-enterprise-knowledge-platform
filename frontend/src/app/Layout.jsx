import { NavLink, Outlet } from "react-router";
import { useGetUsersQuery, useLogoutMutation, useMeQuery } from "./api.js";

const REQUESTS_POLL_MS = 60_000;

// Shell for every logged-in page; the page itself renders in <Outlet />.
function Layout() {
  const { data: user } = useMeQuery();
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();
  // Admins only: checks for new join requests every minute for the badge.
  const isAdmin = user?.role === "admin";
  const { data: users } = useGetUsersQuery(undefined, {
    skip: !isAdmin,
    pollingInterval: REQUESTS_POLL_MS,
    skipPollingIfUnfocused: true,
  });
  const pendingCount = users?.filter((u) => u.status === "pending").length ?? 0;

  return (
    <>
      <header className="app-header">
        <div className="app-header-start">
          <span className="app-name">
            Knowledge Platform
            {/* The company the user is signed in to, from GET /auth/me. */}
            {user?.tenant && (
              <span className="tenant-name"> · {user.tenant.name}</span>
            )}
          </span>
          {/* NavLink adds class="active" to the link for the current page. */}
          <nav className="app-nav" aria-label="Main">
            <NavLink to="/" end>
              Home
            </NavLink>
            <NavLink to="/documents">Documents</NavLink>
            <NavLink to="/search">Search</NavLink>
            <NavLink to="/ask">Ask</NavLink>
            {user?.role === "admin" && (
              <NavLink to="/admin/users">
                Users
                {pendingCount > 0 && (
                  <span className="nav-badge">
                    {pendingCount}
                    <span className="visually-hidden">
                      {pendingCount === 1 ? " pending request" : " pending requests"}
                    </span>
                  </span>
                )}
              </NavLink>
            )}
          </nav>
        </div>
        <div className="app-user">
          {user && (
            <NavLink to="/account" title="Account settings">
              {user.email}
            </NavLink>
          )}
          <button
            type="button"
            className="button-secondary"
            onClick={() => logout()}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? "Logging out…" : "Log out"}
          </button>
        </div>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </>
  );
}

export default Layout;
