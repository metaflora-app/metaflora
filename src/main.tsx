import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initTelegram } from './app/telegram/initTelegram';
import { UIStateProvider } from './contexts/UIStateContext';

// Disable Service Worker to prevent caching issues
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    if (registrations.length > 0) {
      console.log('🔧 Unregistering Service Workers:', registrations.length);
      registrations.forEach(registration => {
        registration.unregister();
        console.log('✅ Service Worker unregistered');
      });
    }
  });
}

// Initialize Telegram Mini App
initTelegram();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <UIStateProvider>
      <App />
    </UIStateProvider>
  </React.StrictMode>,
);

