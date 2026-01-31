import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

// Suppress benign errors caused by browser extensions or UI components
const originalError = console.error;
console.error = (...args) => {
  const message = args[0]?.toString?.() || '';
  if (message.includes('removeChild') || 
      message.includes('NotFoundError') ||
      message.includes('not a child') ||
      message.includes('ResizeObserver')) {
    return;
  }
  originalError.apply(console, args);
};

// Suppress ResizeObserver errors globally
window.addEventListener('error', (e) => {
  if (e.message?.includes('ResizeObserver')) {
    e.stopPropagation();
    e.preventDefault();
  }
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
