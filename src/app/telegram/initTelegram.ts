/**
 * Telegram Mini App initialization
 * Handles WebApp SDK setup, viewport configuration, and CSS custom properties
 */

import WebApp from '@twa-dev/sdk';

/**
 * Initialize Telegram WebApp
 * - Expands the app to full viewport height
 * - Sets up CSS custom property --tg-vh based on viewportHeight
 * - Listens to viewport changes and updates --tg-vh dynamically
 * - Detects webapp mode and adds CSS class for top padding
 */
export function initTelegram(): void {
  // Ready the WebApp
  WebApp.ready();

  // Expand to full height
  WebApp.expand();

  // Detect if running as webapp (not mini-app) and add CSS class
  detectWebAppMode();

  // Set initial viewport height as CSS custom property
  updateViewportHeight();

  // Listen for viewport changes (e.g., when keyboard appears/disappears)
  WebApp.onEvent('viewportChanged', updateViewportHeight);

  // Set header color to match app background
  WebApp.setHeaderColor('#020101');
  
  // Set background color to match app background
  WebApp.setBackgroundColor('#020101');
  
  // Show back button
  WebApp.BackButton.show();
  
  // Handle back button click
  WebApp.BackButton.onClick(() => {
    window.history.back();
  });
}

/**
 * Detect if running as webapp (not mini-app) and add CSS class
 * WebApp mode: opened via direct link, not embedded in Telegram
 */
function detectWebAppMode(): void {
  // Check if platform is not 'tdesktop', 'android', 'ios', 'macos', 'web' (mini-app)
  // or if viewportStableHeight is significantly different from window.innerHeight
  const platform = WebApp.platform;
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isMiniApp = platform !== 'unknown' && WebApp.initData !== '';
  
  // If not running as mini-app, add webapp-mode class
  if (!isMiniApp || isStandalone) {
    document.body.classList.add('webapp-mode');
  }
}

/**
 * Update --tg-vh CSS custom property based on Telegram's viewportHeight
 */
function updateViewportHeight(): void {
  const viewportHeight = WebApp.viewportHeight;
  
  if (viewportHeight) {
    // Calculate 1% of viewport height
    const vh = viewportHeight / 100;
    
    // Set CSS custom property
    document.documentElement.style.setProperty('--tg-vh', `${vh}px`);
  }
}

/**
 * Get Telegram WebApp instance
 */
export function getTelegramWebApp() {
  return WebApp;
}
