import { useState } from "react";
import {
  useCreateUserMutation,
  useGetUsersQuery,
  useMeQuery,
} from "../../app/api.js";
import { formatDate } from "../../utils/format.js";
import ConfirmDeleteUser from "./ConfirmDeleteUser.jsx";
import JoinRequests from "./JoinRequests.jsx";

// Same limits as the backend's CreateUserDto.
const MIN_PASSWORD_LENGTH = 12;
const MAX_PASSWORD_LENGTH = 72;

const ROLES = [
  { value: "viewer", label: "Viewer", hint: "Can search, ask and read" },
  { value: "editor", label: "Editor", hint: "Can also upload and delete" },
  { value: "admin", label: "Admin", hint: "Can also manage users" },
];

const ROLE_LABELS = Object.fromEntries(ROLES.map((r) => [r.value, r.label]));

function serverErrorMessage(error) {
  if (error.status === 409) return "A user with this email already exists.";
  if (error.status === 403) return "Only admins can add users.";
  if (error.status === 400) return "Check the email, password and role.";
  return "Could not add the user. Try again.";
}

const EMPTY_FORM = { email: "", password: "", role: "viewer" };

function AddUserForm({ onCreated }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [createUser, { isLoading, error, reset }] = useCreateUserMutation();

  function update(field) {
    return (event) => {
      setForm({ ...form, [field]: event.target.value });
      reset();
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      const user = await createUser({
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      }).unwrap();
      setForm(EMPTY_FORM);
      onCreated(user);
    } catch {
      // Shown below via `error`.
    }
  }

  return (
    <form className="stacked-form" onSubmit={handleSubmit}>
      <label>
        Email
        <input
          type="email"
          autoComplete="off"
          maxLength={254}
          required
          value={form.email}
          onChange={update("email")}
        />
      </label>

      <label>
        Starting password
        <input
          type="text"
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          maxLength={MAX_PASSWORD_LENGTH}
          required
          value={form.password}
          onChange={update("password")}
          aria-describedby="start-password-hint"
        />
      </label>
      <p id="start-password-hint" className="muted small">
        At least {MIN_PASSWORD_LENGTH} characters. Share it securely; they can
        change it under Account.
      </p>

      <label>
        Role
        <select value={form.role} onChange={update("role")}>
          {ROLES.map((role) => (
            <option key={role.value} value={role.value}>
              {role.label} — {role.hint}
            </option>
          ))}
        </select>
      </label>

      {error && (
        <p className="form-error" role="alert">
          {serverErrorMessage(error)}
        </p>
      )}

      <div className="form-actions">
        <button type="submit" disabled={isLoading}>
          {isLoading ? "Adding…" : "Add user"}
        </button>
      </div>
    </form>
  );
}

function AdminUsersPage() {
  const { data: me } = useMeQuery();
  const { data: users, isLoading, error, refetch } = useGetUsersQuery();
  const [showForm, setShowForm] = useState(false);
  // One success message for the whole page: added, approved, deleted…
  const [notice, setNotice] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  // Join requests are listed separately, above the members table.
  const members = users?.filter((user) => user.status === "active") ?? [];

  function handleCreated(user) {
    setShowForm(false);
    setNotice(`${user.email} was added. They can log in with the starting password.`);
  }

  function handleDeleted(user) {
    setToDelete(null);
    setNotice(`${user.email} was deleted.`);
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Users</h1>
          {me?.tenant && (
            <p className="muted page-subtitle">People in {me.tenant.name}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            setShowForm((open) => !open);
            setNotice(null);
          }}
          aria-expanded={showForm}
        >
          {showForm ? "Cancel" : "Add user"}
        </button>
      </div>

      {showForm && (
        <section className="panel" aria-label="Add a user">
          <AddUserForm onCreated={handleCreated} />
        </section>
      )}

      {notice && (
        <p className="callout-success" role="status">
          {notice}
        </p>
      )}

      {toDelete && (
        <ConfirmDeleteUser
          // key: a fresh dialog (and error state) for each user picked.
          key={toDelete.id}
          user={toDelete}
          onDeleted={handleDeleted}
          onCancel={() => setToDelete(null)}
        />
      )}

      {users && (
        <JoinRequests
          users={users}
          onNotice={setNotice}
          onDelete={setToDelete}
        />
      )}

      {isLoading && <p className="muted">Loading users…</p>}

      {error && (
        <div className="callout-error" role="alert">
          <p>Could not load users.</p>
          <button type="button" className="button-secondary" onClick={refetch}>
            Try again
          </button>
        </div>
      )}

      {members.length > 0 && (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Email</th>
                <th scope="col">Role</th>
                <th scope="col">Status</th>
                <th scope="col">Added</th>
                <th scope="col">
                  <span className="visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {members.map((user) => (
                <tr key={user.id}>
                  <td>
                    {user.email}
                    {user.id === me?.id && (
                      <span className="muted small"> (you)</span>
                    )}
                  </td>
                  <td>
                    <span className={`role-badge role-${user.role}`}>
                      {ROLE_LABELS[user.role] ?? user.role}
                    </span>
                  </td>
                  <td>{user.isActive ? "Active" : "Disabled"}</td>
                  <td className="nowrap">{formatDate(user.createdAt)}</td>
                  <td className="numeric">
                    {/* Admins can't delete themselves; the backend agrees. */}
                    {user.id !== me?.id && (
                      <button
                        type="button"
                        className="button-secondary button-small"
                        onClick={() => {
                          setNotice(null);
                          setToDelete(user);
                        }}
                        aria-label={`Delete ${user.email}`}
                      >
                        Delete…
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default AdminUsersPage;
