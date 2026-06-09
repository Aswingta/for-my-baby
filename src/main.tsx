import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Silence benign sandbox-specific web socket / HMR unhandled promise rejections
if (typeof window !== "undefined") {
  // Direct patch for read-only fetch write errors
  try {
    const originalFetch = window.fetch;
    Object.defineProperty(window, "fetch", {
      get() { return originalFetch; },
      set(val) { console.warn("Silenced write to window.fetch:", val); },
      configurable: true,
      enumerable: true
    });
  } catch (e) {
    console.warn("Could not patch window.fetch setter in main.tsx:", e);
  }

  // Intercept uncaught fetch property descriptor exceptions
  window.addEventListener("error", (event) => {
    const msg = event?.message || "";
    if (msg.includes("Cannot set property fetch") || msg.includes("only a getter")) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason?.message || event.reason || "";
    if (
      String(reason).includes("WebSocket") ||
      String(reason).includes("vite") ||
      String(reason).includes("HMR")
    ) {
      event.preventDefault();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
