import { useSelector } from "react-redux";
import LoginPage from "./features/auth/LoginPage.jsx";
import { selectSessionChecked } from "./features/auth/authSlice.js";

function App() {
  const sessionChecked = useSelector(selectSessionChecked);

  // Avoids flashing the login form while the startup refresh runs.
  if (!sessionChecked) {
    return <p>Loading…</p>;
  }

  return <LoginPage />;
}

export default App;
