import { useState } from "react";
import { useSelector } from "react-redux";
import { Link, Navigate, useLocation } from "react-router";
import { useLoginMutation } from "../../app/api.js";
import { selectAccessToken } from "./authSlice.js";

function errorMessage(error) {
  // Only sent after a correct password, for accounts that aren't approved.
  if (error.data?.code === "ACCOUNT_PENDING") {
    return "Your account is waiting for approval by your company’s admin.";
  }
  if (error.data?.code === "ACCOUNT_REJECTED") {
    return "Your request to join was declined. Contact your company’s admin.";
  }
  if (error.status === 401) return "Invalid email or password.";
  if (error.status === 429) return "Too many attempts. Try again in a minute.";
  if (error.status === 400) return "Enter a valid email and password.";
  // FETCH_ERROR: the backend is down or CORS blocked the request.
  return "Could not reach the server. Try again.";
}

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [login, { isLoading, error }] = useLoginMutation();
  const accessToken = useSelector(selectAccessToken);
  const location = useLocation();

  // Set by RequireAuth when it redirected here.
  const from = location.state?.from?.pathname ?? "/";

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      // On success the token lands in Redux and the redirect below runs.
      await login({ email, password }).unwrap();
    } catch {
      // Shown below via `error`.
    }
  }

  // Already logged in, e.g. /login opened from a bookmark.
  if (accessToken) {
    return <Navigate to={from} replace />;
  }

  return (
    <form className="login-card" onSubmit={handleSubmit}>
      <h1>Log in</h1>

      <label>
        Email
        <input
          type="email"
          autoComplete="email"
          maxLength={254}
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>

      <label>
        Password
        <input
          type="password"
          autoComplete="current-password"
          maxLength={72}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>

      {error && (
        <p className="form-error" role="alert">
          {errorMessage(error)}
        </p>
      )}

      <button type="submit" disabled={isLoading}>
        {isLoading ? "Logging in…" : "Log in"}
      </button>

      <p className="muted small auth-switch">
        New here? <Link to="/signup">Create an account</Link>
      </p>
    </form>
  );
}

export default LoginPage;
