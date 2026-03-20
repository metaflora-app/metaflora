import React from 'react';
import { FigmaMainBackdrop } from './FigmaMainBackdrop';
import { Header, Footer, ThreeBg } from './ScreenLayout';

interface LegalDocumentScreenProps {
  title: string;
  content: string;
}

export const LegalDocumentScreen: React.FC<LegalDocumentScreenProps> = ({ title, content }) => {
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;

  return (
    <div style={{ position: 'relative', width: '100vw', minHeight: '100vh', background: '#020101', overflow: 'hidden' }}>
      <div style={{ position: 'relative', width: '1180px', minHeight: '2550px', transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <ThreeBg />
        <Header />

        <div style={{ position: 'absolute', left: '95px', top: '197px', width: '990px' }}>
          <p style={{
            margin: 0,
            fontFamily: 'Cygre',
            fontWeight: 700,
            fontSize: '80px',
            lineHeight: '1',
            color: 'white',
            whiteSpace: 'pre-wrap',
          }}>
            {title}
          </p>
        </div>

        <FigmaMainBackdrop style={{ left: '31px', top: '399px' }} />

        <div style={{ position: 'absolute', left: '141px', top: '616px', width: '898px', height: '1373px' }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            backdropFilter: 'blur(50px)',
            background: 'black',
            border: '4px solid rgba(255,255,255,0.3)',
            borderRadius: '30px',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute',
              inset: '2.15% 4.3% 10.75% 4.3%',
              overflowY: 'auto',
              overflowX: 'hidden',
            }}>
              <div style={{
                fontFamily: 'Cygre',
                fontWeight: 400,
                fontSize: '35px',
                lineHeight: '1.28',
                color: 'white',
                textAlign: 'center',
                whiteSpace: 'pre-wrap',
              }}>
                {content}
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
};
