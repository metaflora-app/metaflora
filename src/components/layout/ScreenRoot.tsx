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
 * - Scales content to fit viewport width (from Figma 1180px design)
 */
export function ScreenRoot({ children, className = '' }: ScreenRootProps) {
  const DESIGN_WIDTH = 1180;
  const scale = typeof window !== 'undefined' ? window.innerWidth / DESIGN_WIDTH : 1;

  return (
    <div
      className={`w-screen overflow-x-hidden ${className}`}
      style={{
        minHeight: 'calc(var(--tg-vh, 1vh) * 100)',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: DESIGN_WIDTH,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default ScreenRoot;
