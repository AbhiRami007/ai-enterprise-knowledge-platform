import { useState } from "react";
import { useChangePasswordMutation, useMeQuery } from "../../app/api.js";
import { formatDate } from "../../utils/format.js";

// Same limits as the backend's ChangePasswordDto (bcrypt uses 72 bytes).
const MIN_PASSWORD_LENGTH = 12;
const MAX_PASSWORD_LENGTH = 72;

const ROLE_LABELS = { admin: "Admin", editor: "Editor", viewer: "Viewer" };

function validate({ currentPassword, newPassword, confirmPassword }) {
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return `The new password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (newPassword === currentPassword) {
    return "The new password must differ from the current one.";
  }
  if (newPassword !== confirmPassword) {
    return "The new passwords don’t match.";
  }
  return null;
}

function serverErrorMessage(error) {
  if (error.status === 429) {
    return "Too many attempts. Try again in a minute.";
  }
  // NestJS sends a string for our own checks ("Current password is
  // incorrect") and an array for DTO validation errors.
  if (error.status === 400 && typeof error.data?.message === "string") {
    return `${error.data.message}.`;
  }
  return "Could not change the password. Try again.";
}

const EMPTY_FORM = { currentPassword: "", newPassword: "", confirmPassword: "" };

function ChangePasswordForm() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);
  const [changed, setChanged] = useState(false);
  const [changePassword, { isLoading, error, reset }] =
    useChangePasswordMutation();

  function update(field) {
    return (event) => {
      setForm({ ...form, [field]: event.target.value });
      setFormError(null);
      setChanged(false);
      reset();
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const problem = validate(form);
    if (problem) {
      setFormError(problem);
      return;
    }
    try {
      await changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      }).unwrap();
      setForm(EMPTY_FORM);
      setChanged(true);
    } catch {
      // Shown below via `error`.
    }
  }

  const message = formError ?? (error && serverErrorMessage(error));

  return (
    <form className="stacked-form" onSubmit={handleSubmit}>
      <label>
        Current password
        <input
          type="password"
          autoComplete="current-password"
          maxLength={MAX_PASSWORD_LENGTH}
          required
          value={form.currentPassword}
          onChange={update("currentPassword")}
        />
      </label>

      <label>
        New password
        <input
          type="password"
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          maxLength={MAX_PASSWORD_LENGTH}
          required
          value={form.newPassword}
          onChange={update("newPassword")}
          aria-describedby="password-hint"
        />
      </label>
      <p id="password-hint" className="muted small">
        At least {MIN_PASSWORD_LENGTH} characters. A few random words make a
        strong, memorable password.
      </p>

      <label>
        Confirm new password
        <input
          type="password"
          autoComplete="new-password"
          maxLength={MAX_PASSWORD_LENGTH}
          required
          value={form.confirmPassword}
          onChange={update("confirmPassword")}
        />
      </label>

      {message && (
        <p className="form-error" role="alert">
          {message}
        </p>
      )}

      {changed && (
        <p className="callout-success" role="status">
          Password changed. You’ve been signed out on all other devices.
        </p>
      )}

      <div className="form-actions">
        <button type="submit" disabled={isLoading}>
          {isLoading ? "Changing…" : "Change password"}
        </button>
      </div>
    </form>
  );
}

function AccountPage() {
  const { data: user } = useMeQuery();

  return (
    <>
      <h1>Account</h1>

      {user && (
        <section className="panel" aria-labelledby="profile-heading">
          <h2 id="profile-heading" className="panel-heading">
            Profile
          </h2>
          <dl className="details">
            <dt>Email</dt>
            <dd>{user.email}</dd>
            <dt>Role</dt>
            <dd>{ROLE_LABELS[user.role] ?? user.role}</dd>
            {user.tenant && (
              <>
                <dt>Company</dt>
                <dd>{user.tenant.name}</dd>
              </>
            )}
            <dt>Member since</dt>
            <dd>{formatDate(user.createdAt)}</dd>
          </dl>
        </section>
      )}

      <section className="panel" aria-labelledby="password-heading">
        <h2 id="password-heading" className="panel-heading">
          Change password
        </h2>
        <p className="muted small">
          Changing your password signs you out everywhere else.
        </p>
        <ChangePasswordForm />
      </section>
    </>
  );
}

export default AccountPage;
