export type TelegramRuntimeMode =
  | 'telegram-miniapp'
  | 'telegram-webapp'
  | 'browser-preview';

const TELEGRAM_MINIAPP_PLATFORMS = new Set(['android', 'android_x', 'ios']);

function getTelegramWebApp() {
  if (typeof window === 'undefined') {
    return null;
  }

  return (window as any).Telegram?.WebApp ?? null;
}

export function getTelegramRuntimeMode(): TelegramRuntimeMode {
  const webApp = getTelegramWebApp();

  if (!webApp) {
    return 'browser-preview';
  }

  const platform = String(webApp.platform ?? '').toLowerCase();

  if (!platform) {
    return 'browser-preview';
  }

  if (TELEGRAM_MINIAPP_PLATFORMS.has(platform)) {
    return 'telegram-miniapp';
  }

  return 'telegram-webapp';
}

export function applyTelegramRuntimeClasses(): TelegramRuntimeMode {
  const runtimeMode = getTelegramRuntimeMode();

  if (typeof document === 'undefined') {
    return runtimeMode;
  }

  document.body.classList.remove(
    'telegram-miniapp-mode',
    'telegram-webapp-mode',
    'browser-preview-mode',
  );

  if (runtimeMode === 'telegram-webapp') {
    document.body.classList.add('telegram-webapp-mode');
    return runtimeMode;
  }

  if (runtimeMode === 'telegram-miniapp') {
    document.body.classList.add('telegram-miniapp-mode');
    return runtimeMode;
  }

  document.body.classList.add('browser-preview-mode');
  return runtimeMode;
}
