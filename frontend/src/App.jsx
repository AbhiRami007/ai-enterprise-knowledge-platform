import { useSelector } from "react-redux";
import { Navigate, Route, Routes } from "react-router";
import LoginPage from "./features/auth/LoginPage.jsx";
import RequireAuth from "./features/auth/RequireAuth.jsx";
import HomePage from "./features/home/HomePage.jsx";
import { selectSessionChecked } from "./features/auth/authSlice.js";

function App() {
  const sessionChecked = useSelector(selectSessionChecked);

  // Before any route renders: otherwise a reload on a protected page would
  // redirect to /login before the startup refresh has restored the session.
  if (!sessionChecked) {
    return <p>Loading…</p>;
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <HomePage />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
