import React from 'react';

interface InteractiveTiltCardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  baseTransform?: string;
  maxRotateX?: number;
  maxRotateY?: number;
  maxScale?: number;
  disabled?: boolean;
}

export const InteractiveTiltCard: React.FC<InteractiveTiltCardProps> = ({
  children,
  style,
  className,
  baseTransform,
  maxRotateX = 5,
  maxRotateY = 6,
  maxScale = 1.014,
  disabled = false,
}) => {
  const [tilt, setTilt] = React.useState({ rotateX: 0, rotateY: 0, scale: 1 });
  const shouldIgnoreTouchTilt = React.useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    return event.pointerType && event.pointerType !== 'mouse';
  }, []);

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || shouldIgnoreTouchTilt(event)) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    setTilt({
      rotateX: (0.5 - y) * maxRotateX,
      rotateY: (x - 0.5) * maxRotateY,
      scale: maxScale,
    });
  };

  const resetTilt = () => {
    if (disabled) {
      return;
    }
    setTilt({ rotateX: 0, rotateY: 0, scale: 1 });
  };

  return (
    <div
      className={className}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetTilt}
      onPointerUp={resetTilt}
      onPointerCancel={resetTilt}
      style={{
        transform: `${baseTransform ? `${baseTransform} ` : ''}perspective(1800px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) scale(${tilt.scale})`,
        transformStyle: 'preserve-3d',
        transition: 'transform 240ms cubic-bezier(0.22, 1, 0.36, 1)',
        willChange: 'transform',
        touchAction: 'manipulation',
        ...style,
      }}
    >
      {children}
    </div>
  );
};
