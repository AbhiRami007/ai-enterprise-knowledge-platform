import { useState } from "react";
import { useSelector } from "react-redux";
import { Link, Navigate } from "react-router";
import { useSignupMutation } from "../../app/api.js";
import { selectAccessToken } from "./authSlice.js";
import CompanyPicker from "./CompanyPicker.jsx";

// Same limits as the backend's SignupDto.
const MIN_PASSWORD_LENGTH = 12;
const MAX_PASSWORD_LENGTH = 72;

function validate({ company, password, confirmPassword }) {
  if (!company) return "Choose your company from the list, or create it.";
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `The password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (password !== confirmPassword) return "The passwords don’t match.";
  return null;
}

function serverErrorMessage(error) {
  if (error.status === 429) return "Too many sign-ups. Try again in a minute.";
  if (error.status === 404) return "That company no longer exists. Pick it again.";
  // 409: email already registered, or company name taken. Both messages
  // come from the backend and are safe to show.
  if (error.status === 409 && typeof error.data?.message === "string") {
    return `${error.data.message}.`;
  }
  if (error.status === 400) return "Check your details and try again.";
  return "Could not reach the server. Try again.";
}

function RequestSent({ tenantName }) {
  return (
    <div className="login-card" role="status">
      <h1>Request sent</h1>
      <p>
        An admin at <strong>{tenantName}</strong> needs to approve your account
        before you can log in.
      </p>
      <p className="muted small">
        Ask them to check the Users page if it takes a while.
      </p>
      <Link to="/login" className="button-link">
        Back to log in
      </Link>
    </div>
  );
}

function SignupPage() {
  const [company, setCompany] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState(null);
  const [pendingTenant, setPendingTenant] = useState(null);
  const [signup, { isLoading, error, reset }] = useSignupMutation();
  const accessToken = useSelector(selectAccessToken);

  function clearErrors() {
    setFormError(null);
    reset();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const problem = validate({ company, password, confirmPassword });
    if (problem) {
      setFormError(problem);
      return;
    }

    const body =
      company.type === "existing"
        ? { tenantId: company.tenant.id, email, password }
        : { companyName: company.name, email, password };

    try {
      const result = await signup(body).unwrap();
      // A new company logs in straight away (the redirect below runs);
      // joining one waits for an admin.
      if (result.status === "pending") setPendingTenant(result.tenant.name);
    } catch {
      // Shown below via `error`.
    }
  }

  // Logged in: already had a session, or just created a company.
  if (accessToken) {
    return <Navigate to="/" replace />;
  }

  if (pendingTenant) {
    return <RequestSent tenantName={pendingTenant} />;
  }

  const message = formError ?? (error && serverErrorMessage(error));

  return (
    <form className="login-card signup-card" onSubmit={handleSubmit}>
      <h1>Create an account</h1>

      <CompanyPicker
        value={company}
        onChange={(choice) => {
          setCompany(choice);
          clearErrors();
        }}
      />

      <label>
        Work email
        <input
          type="email"
          autoComplete="email"
          maxLength={254}
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            clearErrors();
          }}
        />
      </label>

      <label>
        Password
        <input
          type="password"
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          maxLength={MAX_PASSWORD_LENGTH}
          required
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            clearErrors();
          }}
          aria-describedby="signup-password-hint"
        />
      </label>
      <p id="signup-password-hint" className="muted small field-hint">
        At least {MIN_PASSWORD_LENGTH} characters.
      </p>

      <label>
        Confirm password
        <input
          type="password"
          autoComplete="new-password"
          maxLength={MAX_PASSWORD_LENGTH}
          required
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            clearErrors();
          }}
        />
      </label>

      {message && (
        <p className="form-error" role="alert">
          {message}
        </p>
      )}

      <button type="submit" disabled={isLoading}>
        {isLoading
          ? "Creating account…"
          : company?.type === "existing"
            ? "Request to join"
            : "Create account"}
      </button>

      <p className="muted small auth-switch">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </form>
  );
}

export default SignupPage;
