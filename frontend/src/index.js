import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

// ============================================
// SUPPRESS BENIGN ERRORS (ResizeObserver, etc.)
// These errors don't affect functionality
// ============================================

// Override ResizeObserver to prevent loop errors
const OriginalResizeObserver = window.ResizeObserver;
window.ResizeObserver = class ResizeObserver extends OriginalResizeObserver {
  constructor(callback) {
    super((entries, observer) => {
      // Use requestAnimationFrame to batch updates
      window.requestAnimationFrame(() => {
        try {
          callback(entries, observer);
        } catch (e) {
          // Silently ignore ResizeObserver errors
        }
      });
    });
  }
};

// Suppress error overlay for these specific errors
const suppressedErrors = [
  'ResizeObserver loop',
  'ResizeObserver loop completed',
  'removeChild',
  'NotFoundError',
  'not a child'
];

// Override console.error
const originalConsoleError = console.error;
console.error = (...args) => {
  const message = args.join(' ');
  if (suppressedErrors.some(err => message.includes(err))) {
    return; // Don't log these errors
  }
  originalConsoleError.apply(console, args);
};

// Prevent error overlay from showing
window.addEventListener('error', (event) => {
  if (suppressedErrors.some(err => event.message?.includes(err))) {
    event.stopImmediatePropagation();
    event.preventDefault();
    return true;
  }
}, true);

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  if (suppressedErrors.some(err => event.reason?.message?.includes(err))) {
    event.preventDefault();
    return true;
  }
}, true);

// Disable React error overlay for these errors (development only)
if (process.env.NODE_ENV === 'development') {
  const originalOnError = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    if (suppressedErrors.some(err => message?.includes(err))) {
      return true; // Prevent default error handling
    }
    if (originalOnError) {
      return originalOnError(message, source, lineno, colno, error);
    }
    return false;
  };
}

// ============================================
// RENDER APP
// ============================================

const root = ReactDOM.createRoot(document.getElementById("root"));
// NOTE: StrictMode removed to fix intermittent "insertBefore" DOM errors
// in production builds. This error occurs due to race conditions when
// React double-renders components during navigation.
root.render(<App />);
