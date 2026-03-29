import { hapticNotification } from '../app/telegram/telegramHelpers';

/**
 * Copy text to clipboard with Telegram haptic feedback
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.top = '-9999px';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      textarea.setSelectionRange(0, textarea.value.length);

      const copied = document.execCommand('copy');
      document.body.removeChild(textarea);

      if (!copied) {
        throw new Error('execCommand copy failed');
      }
    }

    hapticNotification('success');
    return true;
  } catch (error) {
    console.error('Failed to copy:', error);
    hapticNotification('error');
    return false;
  }
}
