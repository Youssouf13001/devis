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

// Suppress error overlay for benign errors
window.addEventListener('error', (e) => {
  if (e.message?.includes('ResizeObserver') || 
      e.message?.includes('removeChild') ||
      e.message?.includes('NotFoundError')) {
    e.stopImmediatePropagation();
    e.preventDefault();
    return false;
  }
});

window.addEventListener('unhandledrejection', (e) => {
  if (e.reason?.message?.includes('ResizeObserver')) {
    e.preventDefault();
    return false;
  }
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
