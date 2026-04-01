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
  document.documentElement.style.background = '#7a7a7a';
  document.body.style.background = '#7a7a7a';

  await Promise.all([
    preloadImageSources([splashBackground, splashLogo]),
    preloadCriticalFonts(),
  ]);

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <UIStateProvider>
        <App />
      </UIStateProvider>
    </React.StrictMode>,
  );

  const warmAssets = () => {
    void preloadAllImages();
  };

  window.requestAnimationFrame(() => {
    warmAssets();
  });
}

void bootstrapApp();

