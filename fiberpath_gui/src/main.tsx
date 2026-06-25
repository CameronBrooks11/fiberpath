import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { CliHealthProvider } from "./contexts/CliHealthContext";
import "./styles/index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <CliHealthProvider>
        <App />
      </CliHealthProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
