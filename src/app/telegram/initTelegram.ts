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
  // Use safeAreaInset.top to detect if there's a system status bar
  const safeAreaTop = WebApp.safeAreaInset?.top || 0;
  
  // If safeAreaInset.top > 0, we're in web-app mode with status bar
  if (safeAreaTop > 0) {
    document.body.classList.add('webapp-mode');
    // Set CSS variable for dynamic padding
    document.documentElement.style.setProperty('--safe-area-top', `${safeAreaTop}px`);
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
