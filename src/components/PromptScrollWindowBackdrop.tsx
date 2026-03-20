import React from 'react';
import promptScrollWindow from '../assets/prompt-redesign/окошко скролла промпта.png';

interface PromptScrollWindowBackdropProps {
  style?: React.CSSProperties;
}

export const PromptScrollWindowBackdrop: React.FC<PromptScrollWindowBackdropProps> = ({ style }) => (
  <img
    src={promptScrollWindow}
    alt=""
    style={{
      position: 'absolute',
      left: '113px',
      top: '836px',
      width: '997px',
      height: '1335px',
      objectFit: 'fill',
      pointerEvents: 'none',
      ...style,
    }}
  />
);
