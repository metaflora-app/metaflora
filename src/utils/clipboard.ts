import { hapticNotification } from '../app/telegram/telegramHelpers';

/**
 * Copy text to clipboard with Telegram haptic feedback
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    hapticNotification('success');
    return true;
  } catch (error) {
    console.error('Failed to copy:', error);
    hapticNotification('error');
    return false;
  }
}
