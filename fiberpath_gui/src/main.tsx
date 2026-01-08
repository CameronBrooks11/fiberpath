import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ErrorNotificationProvider } from "./contexts/ErrorNotificationContext";
import { ErrorNotificationToast } from "./components/ErrorNotificationToast";
import "./styles/index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ErrorNotificationProvider>
        <App />
        <ErrorNotificationToast />
      </ErrorNotificationProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
