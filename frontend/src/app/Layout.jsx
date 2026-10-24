import { Outlet } from "react-router";
import { useLogoutMutation, useMeQuery } from "./api.js";

// Shell for every logged-in page; the page itself renders in <Outlet />.
function Layout() {
  const { data: user } = useMeQuery();
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();

  return (
    <>
      <header className="app-header">
        <span className="app-name">Knowledge Platform</span>
        <div className="app-user">
          {user && <span>{user.email}</span>}
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
