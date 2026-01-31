import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

// Suppress ResizeObserver loop error - this is a known benign warning
// that occurs with animation libraries and doesn't affect functionality
if (typeof window !== 'undefined') {
  const originalError = console.error;
  console.error = (...args) => {
    if (args[0]?.includes?.('ResizeObserver') || 
        args.join(' ').includes('ResizeObserver')) {
      return;
    }
    originalError.apply(console, args);
  };

  // Handle the error at window level to prevent overlay
  window.addEventListener('error', (event) => {
    if (event.message?.includes('ResizeObserver') ||
        event.message?.includes('removeChild') ||
        event.message?.includes('NotFoundError')) {
      event.stopImmediatePropagation();
      event.preventDefault();
      return true;
    }
  }, true);
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
