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
 */
export function initTelegram(): void {
  // Ready the WebApp
  WebApp.ready();

  // Expand to full height
  WebApp.expand();

  // Set initial viewport height as CSS custom property
  updateViewportHeight();

  // Listen for viewport changes (e.g., when keyboard appears/disappears)
  WebApp.onEvent('viewportChanged', updateViewportHeight);

  // Optional: Set header color if needed
  // WebApp.setHeaderColor('#000000');
  
  // Optional: Set background color if needed
  // WebApp.setBackgroundColor('#000000');
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
