export {};

declare global {
  interface TelegramWebAppUser {
    id: number;
  }

  interface TelegramWebAppInitDataUnsafe {
    user?: TelegramWebAppUser;
  }

  interface TelegramWebApp {
    initDataUnsafe?: TelegramWebAppInitDataUnsafe;
    showPopup?: (params: { message: string }, callback?: () => void) => void;
    showAlert?: (message: string, callback?: () => void) => void;
    showConfirm?: (message: string, callback?: (confirmed: boolean) => void) => void;
  }

  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}
