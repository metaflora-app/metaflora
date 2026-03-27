import React from 'react';

import likeInactive from '../assets/лайк не поставлен.png';
import likeActive from '../assets/лайк.png';

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
        src={active ? likeActive : likeInactive}
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
