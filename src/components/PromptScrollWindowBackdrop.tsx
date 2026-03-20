import React from 'react';
import promptScrollWindowPeopleBackdrop from '../assets/prompt-redesign/окошко скролла промпта люди.png';
import promptScrollWindowLogoBackdrop from '../assets/prompt-redesign/окошко скролла промпта лого.png';

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

    <div style={{ position: 'absolute', left: 0, top: 0, width: '997px', height: '1335px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <div style={{ position: 'relative', width: '1335px', height: '997px', transform: 'rotate(-90deg)' }}>
        <div style={{ position: 'absolute', left: '164.44px', top: '114.29px', width: '740.55px', height: '1035.86px', overflow: 'hidden' }}>
          <img
            src={promptScrollWindowLogoBackdrop}
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
