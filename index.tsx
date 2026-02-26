
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Global error handler for debugging blank screens
window.onerror = (message, source, lineno, colno, error) => {
  console.error("Global Error Caught:", { message, source, lineno, colno, error });
  const root = document.getElementById('root');
  if (root && root.innerHTML === '') {
    root.innerHTML = `<div style="padding: 20px; color: #f87171; background: #1e293b; border-radius: 8px; margin: 20px; font-family: sans-serif;">
      <h2 style="margin-top: 0;">Application Error</h2>
      <p>The application failed to load. This is often due to missing environment variables or a runtime crash.</p>
      <pre style="font-size: 12px; background: #0f172a; padding: 10px; border-radius: 4px; overflow: auto;">${message}</pre>
      <p style="font-size: 12px; color: #94a3b8;">Check the browser console for more details.</p>
    </div>`;
  }
};

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
