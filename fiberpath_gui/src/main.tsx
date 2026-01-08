import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ErrorNotificationProvider } from "./contexts/ErrorNotificationContext";
import { CliHealthProvider } from "./contexts/CliHealthContext";
import { ErrorNotificationToast } from "./components/ErrorNotificationToast";
import "./styles/index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ErrorNotificationProvider>
        <CliHealthProvider>
          <App />
          <ErrorNotificationToast />
        </CliHealthProvider>
      </ErrorNotificationProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
