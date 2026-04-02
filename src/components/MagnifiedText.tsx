import React from 'react';

interface MagnifiedTextProps {
  text: string;
  style?: React.CSSProperties;
  lensSize?: number;
  zoom?: number;
}

export const MagnifiedText: React.FC<MagnifiedTextProps> = ({
  text,
  style,
  lensSize = 150,
  zoom = 1.25,
}) => {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [isActive, setIsActive] = React.useState(false);
  const [position, setPosition] = React.useState({ x: lensSize / 2, y: lensSize / 2 });

  const updatePosition = React.useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const nextX = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
    const nextY = Math.max(0, Math.min(rect.height, event.clientY - rect.top));
    setPosition({ x: nextX, y: nextY });
  }, []);

  return (
    <div
      ref={containerRef}
      onPointerDown={(event) => {
        updatePosition(event);
        setIsActive(true);
      }}
      onPointerMove={(event) => {
        updatePosition(event);
        if (event.pointerType === 'mouse') {
          setIsActive(true);
        }
      }}
      onPointerLeave={() => setIsActive(false)}
      onPointerUp={() => setIsActive(false)}
      onPointerCancel={() => setIsActive(false)}
      style={{
        position: 'relative',
        display: 'inline-block',
        touchAction: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <div style={style}>{text}</div>

      {isActive ? (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: `${position.x}px`,
            top: `${position.y}px`,
            width: `${lensSize}px`,
            height: `${lensSize}px`,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            overflow: 'hidden',
            border: '2px solid rgba(255,255,255,0.38)',
            background: 'rgba(0,0,0,0.48)',
            boxShadow: '0 0 24px rgba(255,255,255,0.18)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            pointerEvents: 'none',
            zIndex: 5,
          }}
        >
          <div
            style={{
              ...style,
              position: 'absolute',
              left: `${lensSize / 2 - position.x * zoom}px`,
              top: `${lensSize / 2 - position.y * zoom}px`,
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
              width: 'max-content',
              minWidth: '100%',
            }}
          >
            {text}
          </div>
        </div>
      ) : null}
    </div>
  );
};
