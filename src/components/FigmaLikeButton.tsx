import React from 'react';

const figmaLikeInactive = 'https://www.figma.com/api/mcp/asset/c8310fa1-7e0d-4dc7-a30c-c005fd95bf6c';
const figmaLikeActive = 'https://www.figma.com/api/mcp/asset/54705681-a8db-43a0-89e6-c7054609697b';

interface FigmaLikeButtonProps {
  active: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  style?: React.CSSProperties;
  disabled?: boolean;
}

export const FigmaLikeButton: React.FC<FigmaLikeButtonProps> = ({
  active,
  onClick,
  style,
  disabled = false,
}) => {
  const [isPulsing, setIsPulsing] = React.useState(false);

  React.useEffect(() => {
    if (!isPulsing) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setIsPulsing(false), 520);
    return () => window.clearTimeout(timeout);
  }, [isPulsing]);

  return (
    <button
      type="button"
      onClick={(event) => {
        if (!disabled) {
          setIsPulsing(false);
          window.setTimeout(() => setIsPulsing(true), 0);
        }
        onClick?.(event);
      }}
      disabled={disabled}
      className={`motion-like-button motion-pressable motion-conic-border ${isPulsing ? 'is-pulsing' : ''}`}
      style={{
        width: '72px',
        height: '72px',
        border: 'none',
        background: 'rgba(4,22,39,0.1)',
        backdropFilter: 'blur(12px)',
        borderRadius: '32px',
        cursor: disabled ? 'default' : 'pointer',
        padding: '10px',
        overflow: 'hidden',
        ...style,
      }}
    >
      <span className="motion-like-ring" />
      <span className="motion-like-flash" />
      <div
        className="motion-halo-layer motion-halo-tight"
        style={{
          position: 'absolute',
          inset: '18px',
        }}
      />
      <div
        className="motion-like-icon"
        style={{
          position: 'relative',
          width: '20px',
          height: '20px',
          margin: 'auto',
          zIndex: 1,
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
