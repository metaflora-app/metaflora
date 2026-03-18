import React from 'react';
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

        <div style={{
          position: 'absolute',
          left: '88px',
          top: '560px',
          width: '1004px',
          height: '1482px',
          backdropFilter: 'blur(50px)',
          background: 'rgba(255,255,255,0.1)',
          border: '4px solid rgba(255,255,255,0.3)',
          borderRadius: '30px',
        }} />

        <div style={{ position: 'absolute', left: '144px', top: '613px', width: '892px', height: '1373px' }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            backdropFilter: 'blur(50px)',
            background: 'black',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '30px',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute',
              inset: '2.15% 3.83% 10.75% 3.7%',
              overflowY: 'auto',
              overflowX: 'hidden',
            }}>
              <div style={{
                fontFamily: 'Cygre',
                fontWeight: 400,
                fontSize: '35px',
                lineHeight: '1.28',
                color: 'white',
                textAlign: 'left',
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
