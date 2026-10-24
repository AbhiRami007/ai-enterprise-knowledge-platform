import { useSelector } from "react-redux";
import { Navigate, Route, Routes } from "react-router";
import Layout from "./app/Layout.jsx";
import LoginPage from "./features/auth/LoginPage.jsx";
import RequireAuth from "./features/auth/RequireAuth.jsx";
import HomePage from "./features/home/HomePage.jsx";
import DocumentsPage from "./features/documents/DocumentsPage.jsx";
import DocumentDetailPage from "./features/documents/DocumentDetailPage.jsx";
import SearchPage from "./features/search/SearchPage.jsx";
import AskPage from "./features/ask/AskPage.jsx";
import AccountPage from "./features/account/AccountPage.jsx";
import AdminUsersPage from "./features/admin/AdminUsersPage.jsx";
import RequireRole from "./features/auth/RequireRole.jsx";
import { selectSessionChecked } from "./features/auth/authSlice.js";

function App() {
  const sessionChecked = useSelector(selectSessionChecked);

  // Before any route renders: otherwise a reload on a protected page would
  // redirect to /login before the startup refresh has restored the session.
  if (!sessionChecked) {
    return <p className="app-loading">Loading…</p>;
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      {/* Every route nested here is protected and gets the header. */}
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="documents/:id" element={<DocumentDetailPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="ask" element={<AskPage />} />
        <Route path="account" element={<AccountPage />} />
        <Route
          path="admin/users"
          element={
            <RequireRole role="admin">
              <AdminUsersPage />
            </RequireRole>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
