import { useMeQuery } from "../../app/api.js";

function HomePage() {
  // Same cached request as the header, so this doesn't fetch twice.
  const { data: user } = useMeQuery();

  return (
    <>
      <h1>Welcome</h1>
      {user && <p>You are signed in as {user.role}.</p>}
    </>
  );
}

export default HomePage;
