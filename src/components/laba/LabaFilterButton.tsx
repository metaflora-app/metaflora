import React from 'react';
import activeFilterShell from '../../assets/laba-main/active-filter-pill-template.png';

const textFont = 'Cygre, sans-serif';

interface LabaFilterButtonProps {
  label: string;
  left: number;
  top: number;
  width: number;
  active?: boolean;
  onClick: () => void;
}

export const LabaFilterButton: React.FC<LabaFilterButtonProps> = ({
  label,
  left,
  top,
  width,
  active = false,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={active ? undefined : 'blur-wave'}
    style={{
      position: 'absolute',
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: '79px',
      borderRadius: '62px',
      border: active ? 'none' : '4px solid rgba(255,255,255,0.3)',
      background: active ? 'transparent' : 'rgba(0,0,0,0.9)',
      backdropFilter: active ? undefined : 'blur(50px)',
      color: '#fff',
      fontFamily: textFont,
      fontWeight: 700,
      fontSize: '27px',
      lineHeight: '1',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: 0,
      overflow: 'hidden',
    }}
  >
    {active ? (
      <img
        src={activeFilterShell}
        alt=""
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }}
      />
    ) : null}
    <span
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        transform: 'translateY(-5px)',
      }}
    >
      {label}
    </span>
  </button>
);
