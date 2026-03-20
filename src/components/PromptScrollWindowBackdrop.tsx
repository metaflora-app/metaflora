import React from 'react';
import promptScrollWindowPeopleBackdrop from '../assets/prompt-redesign/окошко скролла промпта люди.png';
import promptScrollWindowLargeLogo from '../assets/prompt-redesign/лого большое в экране демо новое.png';

interface PromptScrollWindowBackdropProps {
  style?: React.CSSProperties;
}

export const PromptScrollWindowBackdrop: React.FC<PromptScrollWindowBackdropProps> = ({ style }) => (
  <div
    style={{
      position: 'absolute',
      left: '113px',
      top: '836px',
      width: '997px',
      height: '1335px',
      pointerEvents: 'none',
      ...style,
    }}
  >
    <div style={{ position: 'absolute', left: '69px', top: '91px', width: '832px', height: '1116px', overflow: 'hidden' }}>
      <img
        src={promptScrollWindowPeopleBackdrop}
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

    <div style={{ position: 'absolute', left: '164.44px', top: '114.29px', width: '740.55px', height: '1035.86px', overflow: 'hidden' }}>
      <img src={promptScrollWindowLargeLogo} alt="" style={{ width: '100%', height: '100%', objectFit: 'fill', display: 'block' }} />
    </div>

    <div
      style={{
        position: 'absolute',
        left: '38px',
        top: '84px',
        width: '884px',
        height: '1121px',
        backdropFilter: 'blur(50px)',
        background: 'rgba(255,255,255,0.1)',
        border: '4px solid rgba(255,255,255,0.3)',
        borderRadius: '30px',
        boxSizing: 'border-box',
      }}
    />
  </div>
);
