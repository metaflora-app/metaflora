import React from 'react';

interface FigmaLikeButtonProps {
  active: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  style?: React.CSSProperties;
  disabled?: boolean;
  effectVariant?: 'default' | 'tiktok';
}

export const FigmaLikeButton: React.FC<FigmaLikeButtonProps> = ({
  active,
  onClick,
  style,
  disabled = false,
  effectVariant = 'default',
}) => {
  const [isBursting, setIsBursting] = React.useState(false);

  React.useEffect(() => {
    if (!isBursting) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setIsBursting(false), 720);
    return () => window.clearTimeout(timeoutId);
  }, [isBursting]);

  return (
    <button
      type="button"
      onClick={(event) => {
        if (!disabled && effectVariant === 'tiktok') {
          setIsBursting(false);
          requestAnimationFrame(() => setIsBursting(true));
        }
        onClick?.(event);
      }}
      disabled={disabled}
      className={effectVariant === 'tiktok' ? `tiktok-like-button ${isBursting ? 'is-bursting' : ''}` : undefined}
      style={{
        width: '72px',
        height: '72px',
        border: 'none',
        background: 'rgba(4,22,39,0.1)',
        backdropFilter: 'blur(12px)',
        borderRadius: '32px',
        cursor: disabled ? 'default' : 'pointer',
        padding: '10px',
        overflow: 'visible',
        ...style,
      }}
    >
      {effectVariant === 'tiktok' ? (
        <>
          <span className="tiktok-like-wave" />
          <span className="tiktok-like-wave tiktok-like-wave-delayed" />
          <span className="tiktok-like-flash" />
        </>
      ) : null}
      <div
        className={effectVariant === 'tiktok' ? 'tiktok-like-icon' : undefined}
        style={{
          position: 'relative',
          width: '34px',
          height: '34px',
          margin: 'auto',
        }}
      >
        <svg
          viewBox="0 0 36 36"
          aria-hidden="true"
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
          }}
        >
          <path
            d="M18 30L6 18C3 15 3 9 6 6C9 3 15 3 18 6C21 3 27 3 30 6C33 9 33 15 30 18L18 30Z"
            stroke={active ? '#FF4D6D' : '#FFFFFF'}
            strokeWidth="2.6"
            fill={active ? '#FF4D6D' : 'none'}
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </button>
  );
};
