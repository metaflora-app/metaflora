import React from 'react';
import likeActive from '../assets/лайк.png';
import likeInactive from '../assets/лайк не поставлен.png';

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
    <div
      style={{
        position: 'relative',
        width: '36px',
        height: '36px',
        margin: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <img
        src={active ? likeActive : likeInactive}
        alt="лайк"
        style={{
          width: '36px',
          height: '36px',
          objectFit: 'contain',
          display: 'block',
        }}
      />
    </div>
  </button>
);
