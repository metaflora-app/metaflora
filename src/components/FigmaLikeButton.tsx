import React from 'react';

const figmaLikeInactive = 'https://www.figma.com/api/mcp/asset/c914514e-0b54-4b1b-8ce2-5473d0d1671f';
const figmaLikeActive = 'https://www.figma.com/api/mcp/asset/9706fd0a-d277-4e19-abed-e80b0990d5eb';

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
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    style={{
      width: '72px',
      height: '72px',
      border: 'none',
      background: 'rgba(4,22,39,0.1)',
      backdropFilter: 'blur(12px)',
      borderRadius: '32px',
      cursor: disabled ? 'default' : 'pointer',
      padding: '10px',
      ...style,
    }}
  >
    <div style={{ position: 'relative', width: '20px', height: '20px', margin: 'auto' }}>
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
