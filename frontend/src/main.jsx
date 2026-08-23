import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";

// Development-only bypass: `?dev=<role>` auto-login, test credentials, and
// offline API fixtures. `import.meta.env.DEV` is replaced with the literal
// `false` at build time, so this branch — and everything under src/dev/ —
// is removed from production bundles rather than merely skipped at runtime.
// Awaited before render so a `?dev=` session exists when AuthContext hydrates.
if (import.meta.env.DEV) {
  const { installDevMode } = await import("./dev/installDevMode.js");
  await installDevMode();
}

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);
