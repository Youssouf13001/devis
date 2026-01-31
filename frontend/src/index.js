import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

// Suppress ResizeObserver errors globally - this is a benign warning
const resizeObserverErr = window.ResizeObserver;
window.ResizeObserver = class ResizeObserver extends resizeObserverErr {
  constructor(callback) {
    super((entries, observer) => {
      window.requestAnimationFrame(() => {
        callback(entries, observer);
      });
    });
  }
};

// Suppress error overlay for benign errors (caused by Emergent badge injection)
const errorMessages = ['ResizeObserver', 'removeChild', 'NotFoundError', 'not a child'];

window.addEventListener('error', (e) => {
  if (errorMessages.some(msg => e.message?.includes(msg))) {
    e.stopImmediatePropagation();
    e.preventDefault();
    return false;
  }
}, true);

window.addEventListener('unhandledrejection', (e) => {
  if (errorMessages.some(msg => e.reason?.message?.includes(msg))) {
    e.preventDefault();
    return false;
  }
}, true);

// Patch console.error to suppress these messages
const originalConsoleError = console.error;
console.error = (...args) => {
  const message = args.join(' ');
  if (errorMessages.some(msg => message.includes(msg))) {
    return;
  }
  originalConsoleError.apply(console, args);
};

// Override the error overlay handler if it exists
if (typeof window.__REACT_ERROR_OVERLAY_GLOBAL_HOOK__ !== 'undefined') {
  window.__REACT_ERROR_OVERLAY_GLOBAL_HOOK__ = {
    ...window.__REACT_ERROR_OVERLAY_GLOBAL_HOOK__,
    handleRuntimeError: (error) => {
      if (errorMessages.some(msg => error.message?.includes(msg))) {
        return;
      }
    }
  };
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
