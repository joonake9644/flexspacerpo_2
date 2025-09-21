import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './globals.css';
import { NotificationProvider } from './hooks/use-notification';

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <NotificationProvider>
        <App />
      </NotificationProvider>
    </React.StrictMode>
  );
} else {
  console.error('Failed to find the root element');
}
