import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrCreateUser } from '../../utils/supabase';
import { Footer, Header, ThreeBg } from '../../components/ScreenLayout';

import payButtonBg from '../../assets/demo-access-elements/кнопка оплатить полный доступ.png';
import demoVideoGif from '../../assets/demo-access-redesign/видео в экране что входит в демо.gif';

export const DemoAccessScreen: React.FC = () => {
  const navigate = useNavigate();
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;

  React.useEffect(() => {
    getOrCreateUser().then((user) => {
      if (user?.subscription_type === 'premium') {
        navigate('/main-dashboard-premium', { replace: true });
      }
    });
  }, [navigate]);

  return (
    <div style={{ position: 'relative', width: '100vw', minHeight: '100vh', background: '#020101', overflow: 'hidden' }}>
      <div style={{ position: 'relative', width: '1180px', minHeight: '2550px', transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <ThreeBg />
        <Header onLogoClick={() => navigate('/main-dashboard-free')} />

        <div style={{ position: 'absolute', left: '99px', top: '207px', width: '1020px' }}>
          <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 700, fontSize: '80px', lineHeight: '1', color: 'white', whiteSpace: 'pre-wrap' }}>
            попробуйте
          </p>
          <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 700, fontSize: '80px', lineHeight: '1', color: 'white', whiteSpace: 'pre-wrap' }}>
            в свободном доступе
          </p>
        </div>

        <div style={{ position: 'absolute', left: '99px', top: '359px', width: '804px' }}>
          <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 400, fontSize: '40px', lineHeight: '1', color: 'white', whiteSpace: 'pre-wrap' }}>
            курс «демо» включает в себя 4 урока
          </p>
          <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 400, fontSize: '40px', lineHeight: '1', color: 'white', whiteSpace: 'pre-wrap' }}>
            по темам «система», «промптинг», «искусство»
          </p>
          <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 400, fontSize: '40px', lineHeight: '1', color: 'white', whiteSpace: 'pre-wrap' }}>
            и «автоматизация»
          </p>
        </div>

        <div style={{ position: 'absolute', left: '101px', top: '507px', width: '935px' }}>
          <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 400, fontSize: '40px', lineHeight: '1', color: 'rgba(255,255,255,0.6)', whiteSpace: 'pre-wrap' }}>
            без доступа к основным сервисам
          </p>
          <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 400, fontSize: '40px', lineHeight: '1', color: 'rgba(255,255,255,0.6)', whiteSpace: 'pre-wrap' }}>
            МЕТАФЛОРЫ*: академия, лаба, цех, полигон
          </p>
        </div>

        <div style={{ position: 'absolute', left: '143px', top: '646px', width: '894px', height: '1057px', border: '4px solid rgba(255,255,255,0.3)', borderRadius: '30px', overflow: 'hidden', boxSizing: 'border-box' }}>
          <img src={demoVideoGif} alt="демо видео" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>

        <button
          type="button"
          onClick={() => navigate('/main-dashboard-free')}
          className="button-inner-glow"
          style={{ position: 'absolute', left: '143px', top: '1744px', width: '894px', height: '139px', border: '4px solid rgba(255,255,255,0.3)', borderRadius: '62px', background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(50px)', color: 'white', fontFamily: 'Cygre', fontWeight: 700, fontSize: '40px', lineHeight: '1', cursor: 'pointer' }}
        >
          продолжить
        </button>

        <button
          type="button"
          onClick={() => navigate('/pricing')}
          style={{ position: 'absolute', left: '143px', top: '1902px', width: '894px', height: '139px', border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}
        >
          <img src={payButtonBg} alt="оплатить доступ" className="button-inner-glow" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cygre', fontWeight: 700, fontSize: '40px', lineHeight: '1', color: 'white' }}>
            оплатить доступ
          </div>
        </button>

        <Footer />
      </div>
    </div>
  );
};
