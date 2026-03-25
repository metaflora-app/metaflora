import React from 'react';

const textFont = 'Cygre, sans-serif';

interface LabaSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  iconSrc: string;
  onEnter?: () => void;
  textRightInset?: string;
  style?: React.CSSProperties;
}

export const LabaSearchInput: React.FC<LabaSearchInputProps> = ({
  value,
  onChange,
  placeholder,
  iconSrc,
  onEnter,
  textRightInset = '28px',
  style,
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        width: '755px',
        height: '79px',
        borderRadius: '62px',
        border: '4px solid rgba(255,255,255,0.3)',
        background: '#000',
        backdropFilter: 'blur(50px)',
        ...style,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: '22px',
          top: '50%',
          width: '38px',
          height: '38px',
          transform: 'translateY(-50%)',
        }}
      >
        <img src={iconSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      </div>

      {!value ? (
        <div
          style={{
            position: 'absolute',
            left: '74px',
            right: textRightInset,
            top: 'calc(50% - 3.5px)',
            transform: 'translateY(-50%)',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            fontFamily: textFont,
            fontWeight: 400,
            fontSize: '35px',
            lineHeight: 'normal',
            color: 'rgba(255,255,255,0.3)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            pointerEvents: 'none',
          }}
        >
          {placeholder}
        </div>
      ) : null}

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') onEnter?.();
        }}
        placeholder=""
        spellCheck={false}
        autoCapitalize="none"
        autoCorrect="off"
        style={{
          position: 'absolute',
          left: '74px',
          right: textRightInset,
          top: 'calc(50% - 3.5px)',
          transform: 'translateY(-50%)',
          height: '44px',
          padding: 0,
          border: 'none',
          outline: 'none',
          background: 'transparent',
          fontFamily: textFont,
          fontWeight: 400,
          fontSize: '35px',
          lineHeight: 'normal',
          color: '#fff',
          caretColor: '#fff',
          display: 'flex',
          alignItems: 'center',
        }}
      />
    </div>
  );
};
