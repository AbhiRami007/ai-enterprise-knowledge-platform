import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router";
import { store } from "./app/store.js";
import { api } from "./app/api.js";

// Dev only: fakes the endpoints the backend doesn't have yet. The dynamic
// import keeps MSW out of the production bundle.
async function enableMocking() {
  if (!import.meta.env.DEV) return;
  const { worker } = await import("./mocks/browser.js");
  // "bypass": requests without a mock, like /auth/*, go to the real backend.
  await worker.start({ onUnhandledFrame: "bypass" });
}

enableMocking().then(() => {
  // Once, outside React: StrictMode runs effects twice in dev, and a second
  // refresh with the same single-use cookie would revoke every session.
  store.dispatch(api.endpoints.refresh.initiate());

  createRoot(document.getElementById("root")).render(
    <StrictMode>
      <Provider store={store}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </Provider>
    </StrictMode>
  );
});
