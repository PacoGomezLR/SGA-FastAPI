import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { ConfirmProvider } from "./context/ConfirmContext";

// Listener global (preparado para futuras mejoras UX)
function setupGlobalEvents() {
  window.addEventListener("unhandledrejection", (event) => {
    console.error("Error no controlado:", event.reason);
  });
}

setupGlobalEvents();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <ConfirmProvider>
        <App />
      </ConfirmProvider>
    </AuthProvider>
  </React.StrictMode>
);