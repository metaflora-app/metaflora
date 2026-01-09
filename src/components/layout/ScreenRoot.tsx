/**
 * ScreenRoot - Root container for all screens
 * Handles Telegram Mini App viewport and safe area
 */

import React from 'react';

interface ScreenRootProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Root container that:
 * - Uses Telegram viewport height (--tg-vh fallback to 100vh)
 * - Applies safe-area padding ONLY as outer padding (no internal layout compression)
 */
export function ScreenRoot({ children, className = '' }: ScreenRootProps) {
  return (
    <div
      className={`w-full ${className}`}
      style={{
        minHeight: 'calc(var(--tg-vh, 1vh) * 100)',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {children}
    </div>
  );
}

export default ScreenRoot;
