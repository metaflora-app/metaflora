import React from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/jetbrains-mono/600.css";
import { App } from "./App.jsx";
import { PolzaAuthorizationWindow } from "./features/finance/PolzaAuthorizationPanel.jsx";
import "./styles.css";
import "./features/providers/ProviderOperations.css";

const isPolzaAuthorizationWindow = window.location.pathname === "/polza-authorization";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {isPolzaAuthorizationWindow ? <PolzaAuthorizationWindow /> : <App />}
  </React.StrictMode>,
);
