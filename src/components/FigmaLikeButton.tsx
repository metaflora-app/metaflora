import React from 'react';

const figmaLikeHeart = 'https://www.figma.com/api/mcp/asset/d1b1c1d3-1263-4906-9cc2-5d8f9b7a873a';

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
          width: '20px',
          height: '20px',
          margin: 'auto',
        }}
      >
        <img
          src={figmaLikeHeart}
          alt="лайк"
          style={{
            position: 'absolute',
            inset: '-30% -35% -30% -40%',
            width: 'calc(100% + 15px)',
            height: 'calc(100% + 12px)',
            maxWidth: 'none',
            display: 'block',
            opacity: active ? 1 : 0.3,
            filter: active
              ? 'drop-shadow(0 0 10px rgba(255, 76, 109, 0.46)) drop-shadow(0 0 18px rgba(255, 76, 109, 0.22))'
              : 'none',
          }}
        />
      </div>
    </button>
  );
};
