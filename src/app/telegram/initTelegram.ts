/**
 * Telegram Mini App initialization
 * Handles WebApp SDK setup, viewport configuration, and CSS custom properties
 */

import WebApp from '@twa-dev/sdk';
import { applyTelegramRuntimeClasses } from './runtime';

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

  // Split Telegram Web from native mini app before applying layout tweaks.
  applyTelegramRuntimeClasses();

  // Expand to full height
  WebApp.expand();

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
