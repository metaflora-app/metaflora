import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrCreateUser } from '../../utils/supabase';
import { ThreeBg, Header, Footer } from '../../components/ScreenLayout';

import btnTour from '../../assets/welcome-elements/кнопка экскурсия по платформе.png';
import btnFree from '../../assets/welcome-elements/кнопка попробовать бесплатно.png';
import welcomeCard1 from '../../assets/welcome-redesign/заглушка-1.png';
import welcomeCard2 from '../../assets/welcome-redesign/заглушка-2.png';
import welcomeCard3 from '../../assets/welcome-redesign/заглушка-3.png';
import welcomeCard4 from '../../assets/welcome-redesign/заглушка-4.png';

export const WelcomeScreen: React.FC = () => {
  const navigate = useNavigate();

  React.useEffect(() => {
    getOrCreateUser().then(user => {
      if (user?.subscription_type === 'premium') navigate('/main-dashboard-premium', { replace: true });
    });
  }, [navigate]);

  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;

  return (
    <div style={{ position: 'relative', width: '100vw', minHeight: '100vh', background: '#020101', overflow: 'hidden' }}>
      <div style={{ position: 'relative', width: '1180px', minHeight: '2550px', transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <ThreeBg />
        <Header />

        {/* Ссылки политик */}
        <div style={{ position: 'absolute', left: '101px', top: '78px', display: 'flex', flexDirection: 'column', gap: '1px', width: '410px' }}>
          {[
            { text: 'публичная оферта', route: '/public-offer' },
            { text: 'политика конфиденциальности', route: '/privacy-policy' },
            { text: 'согласие на рассылку', route: '/marketing-consent' },
          ].map(l => (
            <span key={l.route} onClick={() => navigate(l.route)} style={{
              fontFamily: 'Cygre', fontWeight: 400, fontSize: '20px',
              color: 'rgba(255,255,255,0.6)', cursor: 'pointer', lineHeight: '1',
            }}>
              {l.text}
            </span>
          ))}
        </div>

        {/* Заголовок */}
        <div style={{ position: 'absolute', left: '94px', top: '207px' }}>
          <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 700, fontSize: '90px', lineHeight: '1', color: 'white' }}>
            добро пожаловать
          </p>
          <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 700, fontSize: '90px', lineHeight: '1', color: 'white' }}>
            в МЕТАФЛОРУ*
          </p>
        </div>

        <div style={{ position: 'absolute', left: '94px', top: '398px', width: '929px' }}>
          <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 400, fontSize: '40px', lineHeight: '1', color: 'white' }}>
            пожалуй, лучшее AI-powered мини-приложение
          </p>
          <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 400, fontSize: '40px', lineHeight: '1', color: 'white' }}>
            — академия, лаба, цех и другие сервисы
          </p>
        </div>

        <div style={{ position: 'absolute', left: '94px', top: '485px', width: '929px' }}>
          <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 400, fontSize: '40px', lineHeight: '1', color: 'rgba(255,255,255,0.6)' }}>
            попробуйте демо-курс для погружения
          </p>
          <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 400, fontSize: '40px', lineHeight: '1', color: 'rgba(255,255,255,0.6)' }}>
            или сразу оформите подписку
          </p>
          <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 400, fontSize: '40px', lineHeight: '1', color: 'rgba(255,255,255,0.6)' }}>
            и получите полный доступ
          </p>
        </div>

        <img
          src={welcomeCard2}
          alt=""
          style={{ position: 'absolute', left: '80px', top: '803px', width: '674px', height: '826px', objectFit: 'cover', borderRadius: '62px', transform: 'rotate(-5deg)', zIndex: 1, pointerEvents: 'none' }}
        />
        <img
          src={welcomeCard3}
          alt=""
          style={{ position: 'absolute', left: '543px', top: '745px', width: '639px', height: '822px', objectFit: 'cover', borderRadius: '62px', transform: 'rotate(5deg)', zIndex: 1, pointerEvents: 'none' }}
        />
        <img
          src={welcomeCard4}
          alt=""
          style={{ position: 'absolute', left: '427px', top: '803px', width: '674px', height: '826px', objectFit: 'cover', borderRadius: '62px', transform: 'rotate(5deg)', zIndex: 2, pointerEvents: 'none' }}
        />
        <img
          src={welcomeCard1}
          alt=""
          style={{ position: 'absolute', left: '243px', top: '700px', width: '700px', height: '957px', objectFit: 'cover', borderRadius: '62px', zIndex: 3, pointerEvents: 'none' }}
        />

        {/* Кнопка "экскурсия" */}
        <img src={btnTour} alt="экскурсия по платформе" onClick={() => navigate('/tour-video')} className="button-inner-glow motion-press-grow" style={{
          position: 'absolute', left: '143px', top: '1744px', width: '894px', height: '139px', cursor: 'pointer',
        }} />

        {/* Кнопка "попробовать бесплатно" */}
        <img src={btnFree} alt="попробовать бесплатно" onClick={() => navigate('/demo-access')} className="button-inner-glow motion-press-grow" style={{
          position: 'absolute', left: '143px', top: '1902px', width: '894px', height: '139px', cursor: 'pointer',
        }} />

        <Footer />
      </div>
    </div>
  );
};
