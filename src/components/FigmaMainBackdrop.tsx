import React from 'react';
import backdropPeople from '../assets/shared-redesign/главная подложка фигма люди.png';
import backdropLogo from '../assets/shared-redesign/главная подложка фигма лого.png';

interface FigmaMainBackdropProps {
  style?: React.CSSProperties;
}

export const FigmaMainBackdrop: React.FC<FigmaMainBackdropProps> = ({ style }) => (
  <div
    style={{
      position: 'absolute',
      width: '1162px',
      height: '1646px',
      pointerEvents: 'none',
      ...style,
    }}
  >
    <div style={{ position: 'absolute', left: '110px', top: 0, width: '912px', height: '1643px', overflow: 'hidden' }}>
      <img
        src={backdropPeople}
        alt=""
        style={{
          position: 'absolute',
          height: '105.83%',
          left: '-10.74%',
          top: '-0.86%',
          width: '113.22%',
          maxWidth: 'none',
        }}
      />
    </div>

    <div style={{ position: 'absolute', left: 0, right: 0, top: '90px', height: '1162px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'relative', width: '1556px', height: '1162px', transform: 'rotate(-90deg)', flex: 'none' }}>
        <div style={{ position: 'absolute', left: '191.64px', top: '133.17px', width: '1203.13px', height: '864.26px', overflow: 'hidden' }}>
          <img
            src={backdropLogo}
            alt=""
            style={{
              position: 'absolute',
              height: '252.58%',
              left: '-46.02%',
              top: '-71.61%',
              width: '188.85%',
              maxWidth: 'none',
            }}
          />
        </div>
      </div>
    </div>

    <div
      style={{
        position: 'absolute',
        left: '110px',
        top: 0,
        width: '894px',
        height: '1643px',
        backdropFilter: 'blur(50px)',
        background: 'rgba(255,255,255,0.1)',
        border: '4px solid rgba(255,255,255,0.3)',
        borderRadius: '30px',
        boxSizing: 'border-box',
      }}
    />
  </div>
);
