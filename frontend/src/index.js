import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

// Suppress hydration errors caused by browser extensions or injected scripts
const originalError = console.error;
console.error = (...args) => {
  if (args[0]?.includes?.('removeChild') || 
      args[0]?.includes?.('NotFoundError') ||
      args[0]?.includes?.('not a child')) {
    return;
  }
  originalError.apply(console, args);
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
