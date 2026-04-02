import React from 'react';

const LENS_SIZE = 240;
const LENS_ZOOM = 1.38;

interface SelectionSnapshot {
  text: string;
  rect: DOMRect;
  style: React.CSSProperties;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function getSelectionRect(range: Range): DOMRect | null {
  const rect = range.getBoundingClientRect();
  if (rect.width > 0 || rect.height > 0) {
    return rect;
  }

  const firstRect = range.getClientRects()[0];
  return firstRect || null;
}

export const GlobalSelectionMagnifier: React.FC = () => {
  const [selection, setSelection] = React.useState<SelectionSnapshot | null>(null);
  const [pointer, setPointer] = React.useState<{ x: number; y: number } | null>(null);

  React.useEffect(() => {
    const readSelection = () => {
      const nextSelection = window.getSelection();
      if (!nextSelection || nextSelection.isCollapsed || nextSelection.rangeCount === 0) {
        setSelection(null);
        return;
      }

      const text = nextSelection.toString().trim();
      if (!text) {
        setSelection(null);
        return;
      }

      const range = nextSelection.getRangeAt(0);
      const rect = getSelectionRect(range);
      const anchorElement = nextSelection.anchorNode?.parentElement;
      if (!rect || !anchorElement) {
        setSelection(null);
        return;
      }

      const computed = window.getComputedStyle(anchorElement);
      setSelection({
        text,
        rect,
        style: {
          fontFamily: computed.fontFamily || 'Cygre, sans-serif',
          fontSize: computed.fontSize || '32px',
          fontWeight: computed.fontWeight as React.CSSProperties['fontWeight'],
          lineHeight: computed.lineHeight || '1.1',
          letterSpacing: computed.letterSpacing,
          color: computed.color || '#fff',
          textAlign: computed.textAlign as React.CSSProperties['textAlign'],
        },
      });
    };

    const handlePointer = (clientX: number, clientY: number) => {
      setPointer({ x: clientX, y: clientY });
    };

    const handleMouseMove = (event: MouseEvent) => {
      handlePointer(event.clientX, event.clientY);
    };

    const handleTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      handlePointer(touch.clientX, touch.clientY);
    };

    const clearSelection = () => {
      const activeSelection = window.getSelection();
      if (activeSelection?.isCollapsed) {
        setSelection(null);
      }
    };

    document.addEventListener('selectionchange', readSelection);
    document.addEventListener('mouseup', readSelection);
    document.addEventListener('touchend', readSelection, { passive: true });
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('resize', clearSelection);
    window.addEventListener('scroll', clearSelection, { passive: true });

    return () => {
      document.removeEventListener('selectionchange', readSelection);
      document.removeEventListener('mouseup', readSelection);
      document.removeEventListener('touchend', readSelection);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('resize', clearSelection);
      window.removeEventListener('scroll', clearSelection);
    };
  }, []);

  if (!selection) {
    return null;
  }

  const lensCenterX = clamp(
    pointer?.x ?? (selection.rect.left + selection.rect.width / 2),
    LENS_SIZE / 2 + 20,
    window.innerWidth - LENS_SIZE / 2 - 20,
  );
  const lensCenterY = clamp(
    (pointer?.y ?? selection.rect.top) - 96,
    LENS_SIZE / 2 + 20,
    window.innerHeight - LENS_SIZE / 2 - 20,
  );

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        left: `${lensCenterX}px`,
        top: `${lensCenterY}px`,
        width: `${LENS_SIZE}px`,
        height: `${LENS_SIZE}px`,
        transform: 'translate(-50%, -50%)',
        borderRadius: '50%',
        overflow: 'hidden',
        border: '2px solid rgba(255,255,255,0.34)',
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        boxShadow: '0 0 26px rgba(255,255,255,0.12)',
        pointerEvents: 'none',
        zIndex: 2147483646,
      }}
    >
      <div
        style={{
          ...selection.style,
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: '78%',
          transform: `translate(-50%, -50%) scale(${LENS_ZOOM})`,
          transformOrigin: 'center',
          textShadow: '0 0 6px rgba(255,255,255,0.08)',
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap',
        }}
      >
        {selection.text}
      </div>
    </div>
  );
};
