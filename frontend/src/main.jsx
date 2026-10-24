import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { Provider } from "react-redux";
import { store } from "./app/store.js";
import { api } from "./app/api.js";

// Once, outside React: StrictMode runs effects twice in dev, and a second
// refresh with the same single-use cookie would revoke every session.
store.dispatch(api.endpoints.refresh.initiate());

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>
);
