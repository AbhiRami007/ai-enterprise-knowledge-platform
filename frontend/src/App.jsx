import { useSelector } from "react-redux";
import LoginPage from "./features/auth/LoginPage.jsx";
import HomePage from "./features/home/HomePage.jsx";
import {
  selectAccessToken,
  selectSessionChecked,
} from "./features/auth/authSlice.js";

function App() {
  const sessionChecked = useSelector(selectSessionChecked);
  const accessToken = useSelector(selectAccessToken);

  // Avoids flashing the login form while the startup refresh runs.
  if (!sessionChecked) {
    return <p>Loading…</p>;
  }

  return accessToken ? <HomePage /> : <LoginPage />;
}

export default App;
