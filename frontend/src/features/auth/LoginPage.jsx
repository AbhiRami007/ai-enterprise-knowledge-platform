import { useState } from "react";
import { useSelector } from "react-redux";
import { useLoginMutation } from "../../app/api.js";
import { selectAccessToken } from "./authSlice.js";

function errorMessage(error) {
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

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      await login({ email, password }).unwrap();
      setPassword("");
    } catch {
      // Shown below via `error`.
    }
  }

  // Temporary until we add routing and a home page.
  if (accessToken) {
    return <p>Logged in.</p>;
  }

  return (
    <form onSubmit={handleSubmit}>
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

      {error && <p role="alert">{errorMessage(error)}</p>}

      <button type="submit" disabled={isLoading}>
        {isLoading ? "Logging in…" : "Log in"}
      </button>
    </form>
  );
}

export default LoginPage;
