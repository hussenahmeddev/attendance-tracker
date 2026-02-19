import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AuthProvider } from "./contexts/AuthContext.tsx";
import { initializeCounters } from "./lib/userUtils.ts";

// Initialize counters on app start
initializeCounters().catch(console.error);

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);

// PWA service worker is auto-registered by vite-plugin-pwa
