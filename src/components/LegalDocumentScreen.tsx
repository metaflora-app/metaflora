import React from 'react';
import { MainBackdropNew, SecondaryBlackBackdrop } from './MainBackdropNew';
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

        <MainBackdropNew />

        <SecondaryBlackBackdrop>
            <div style={{
              position: 'absolute',
              inset: '40px 35px 60px',
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
        </SecondaryBlackBackdrop>

        <Footer />
      </div>
    </div>
  );
};
