import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router";
import { selectAccessToken } from "./authSlice.js";

// Wrap any page that needs a logged-in user. Logging out clears the token,
// so this also sends the user to /login after logout.
function RequireAuth({ children }) {
  const accessToken = useSelector(selectAccessToken);
  const location = useLocation();

  if (!accessToken) {
    // Remember the page so LoginPage can send the user back after login.
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

export default RequireAuth;
