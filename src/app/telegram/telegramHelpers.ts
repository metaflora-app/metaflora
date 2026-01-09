/**
 * Telegram WebApp helper functions
 */

import WebApp from '@twa-dev/sdk';

/**
 * Open external Telegram link (user profile, channel, group)
 */
export function openTelegramLink(username: string) {
  const url = `https://t.me/${username}`;
  WebApp.openTelegramLink(url);
}

/**
 * Open link in external browser
 */
export function openLink(url: string) {
  WebApp.openLink(url);
}

/**
 * Show Telegram payment form (placeholder for now)
 */
export function showPayment(params: {
  title: string;
  description: string;
  amount: number; // in rubles
  currency?: string;
}) {
  // TODO: Integrate with Telegram Payments API
  console.log('Payment requested:', params);
  
  // For now, redirect to support
  WebApp.showAlert(
    `Оплата: ${params.title}\nСумма: ${params.amount} руб.\n\nПожалуйста, свяжитесь с @mishchenko_is для оплаты.`,
    () => {
      openTelegramLink('mishchenko_is');
    }
  );
}

/**
 * Download file via Telegram
 */
export function downloadFile(fileName: string) {
  // Telegram bot should handle file downloads
  // For now, show alert
  WebApp.showAlert(
    `Загрузка файла: ${fileName}\n\nФункция будет доступна после интеграции с ботом.`,
    () => {
      openTelegramLink('mishchenko_is');
    }
  );
}

/**
 * Show confirmation popup
 */
export function showConfirm(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    WebApp.showConfirm(message, resolve);
  });
}

/**
 * Show alert popup
 */
export function showAlert(message: string): Promise<void> {
  return new Promise((resolve) => {
    WebApp.showAlert(message, resolve);
  });
}

/**
 * Haptic feedback
 */
export function hapticImpact(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'medium') {
  if (WebApp.HapticFeedback) {
    WebApp.HapticFeedback.impactOccurred(style);
  }
}

/**
 * Haptic notification
 */
export function hapticNotification(type: 'error' | 'success' | 'warning') {
  if (WebApp.HapticFeedback) {
    WebApp.HapticFeedback.notificationOccurred(type);
  }
}
