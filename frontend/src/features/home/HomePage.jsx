import { useMeQuery } from "../../app/api.js";

// Temporary until we add routing and real pages.
function HomePage() {
  const { data: user, isLoading, error, refetch } = useMeQuery();

  if (isLoading) {
    return <p>Loading…</p>;
  }

  if (error) {
    return <p role="alert">Could not load your profile.</p>;
  }

  return (
    <>
      <p>Logged in as {user.email}</p>
      <button type="button" onClick={refetch}>
        Reload profile
      </button>
    </>
  );
}

export default HomePage;
