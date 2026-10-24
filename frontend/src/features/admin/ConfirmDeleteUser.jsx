import { useDeleteUserMutation } from "../../app/api.js";

function errorMessage(error) {
  // 409 explains itself: deleting yourself, or the last admin.
  if (error.status === 409 && typeof error.data?.message === "string") {
    return `${error.data.message}.`;
  }
  if (error.status === 404) return "This user was already deleted.";
  return "Could not delete the user. Try again.";
}

// Shown above the users table once an admin picks someone to delete.
function ConfirmDeleteUser({ user, onDeleted, onCancel }) {
  const [deleteUser, { isLoading, error }] = useDeleteUserMutation();
  const isRequest = user.status !== "active";

  async function handleDelete() {
    try {
      await deleteUser(user.id).unwrap();
      onDeleted(user);
    } catch {
      // Shown below via `error`.
    }
  }

  return (
    <section
      className="panel danger-zone"
      role="alertdialog"
      aria-labelledby="confirm-delete-heading"
    >
      <h2 id="confirm-delete-heading" className="panel-heading">
        Delete {user.email}?
      </h2>
      <p>
        {isRequest
          ? "The request is removed and this email can sign up again."
          : "Their account is removed and they’re signed out everywhere. They can’t log in again unless they’re re-added."}{" "}
        This can’t be undone.
      </p>
      {error && (
        <p className="form-error" role="alert">
          {errorMessage(error)}
        </p>
      )}
      <div className="form-actions">
        <button
          type="button"
          className="button-danger"
          onClick={handleDelete}
          disabled={isLoading}
          autoFocus
        >
          {isLoading ? "Deleting…" : "Delete user"}
        </button>
        <button
          type="button"
          className="button-secondary"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </button>
      </div>
    </section>
  );
}

export default ConfirmDeleteUser;
