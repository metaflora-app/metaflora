import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initTelegram } from './app/telegram/initTelegram';
import { UIStateProvider } from './contexts/UIStateContext';
import { preloadAllImages, preloadCriticalFonts, preloadImageSources } from './utils/assetPreloader';
import splashBackground from './assets/figma-welcome/фон для эксперимента.png';
import splashLogo from './assets/figma-welcome/splash-logo.png';

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
async function bootstrapApp() {
  initTelegram();
  document.documentElement.style.background = '#020101';
  document.body.style.background = '#020101';

  await preloadImageSources([splashBackground, splashLogo]);

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <UIStateProvider>
        <App />
      </UIStateProvider>
    </React.StrictMode>,
  );

  const warmAssets = () => {
    void preloadCriticalFonts();
    void preloadAllImages();
  };

  const windowWithIdleCallback = window as Window & {
    requestIdleCallback?: (callback: () => void) => number;
  };

  if (typeof windowWithIdleCallback.requestIdleCallback === 'function') {
    windowWithIdleCallback.requestIdleCallback(warmAssets);
  } else {
    window.setTimeout(warmAssets, 800);
  }
}

void bootstrapApp();

