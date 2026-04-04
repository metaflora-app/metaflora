import React from 'react';

const figmaLikeInactive = 'https://www.figma.com/api/mcp/asset/c8310fa1-7e0d-4dc7-a30c-c005fd95bf6c';
const figmaLikeActive = 'https://www.figma.com/api/mcp/asset/54705681-a8db-43a0-89e6-c7054609697b';

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
          src={active ? figmaLikeActive : figmaLikeInactive}
          alt="лайк"
          style={{
            position: 'absolute',
            inset: '-30% -35% -30% -40%',
            width: 'calc(100% + 15px)',
            height: 'calc(100% + 12px)',
            maxWidth: 'none',
          }}
        />
      </div>
    </button>
  );
};
