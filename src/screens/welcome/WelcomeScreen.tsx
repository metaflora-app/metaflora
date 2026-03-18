import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrCreateUser } from '../../utils/supabase';
import { ThreeBg, Header, Footer } from '../../components/ScreenLayout';

import carouselCenter from '../../assets/figma-welcome/carousel-center.png';
import carouselLeft from '../../assets/figma-welcome/carousel-left.png';
import carouselRight from '../../assets/figma-welcome/carousel-right.png';
import btnTour from '../../assets/welcome-elements/кнопка экскурсия по платформе.png';
import btnFree from '../../assets/welcome-elements/кнопка попробовать бесплатно.png';

export const WelcomeScreen: React.FC = () => {
  const navigate = useNavigate();

  React.useEffect(() => {
    getOrCreateUser().then(user => {
      if (user?.subscription_type === 'premium') navigate('/main-dashboard-premium', { replace: true });
    });
  }, [navigate]);

  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;
  const imgs = [carouselLeft, carouselCenter, carouselRight];
  const [active, setActive] = React.useState(1);

  const getImg = (pos: number) => imgs[(active + (pos - 1) + 3) % 3];

  return (
    <div style={{ position: 'relative', width: '100vw', minHeight: '100vh', background: '#020101', overflow: 'hidden' }}>
      <div style={{ position: 'relative', width: '1180px', minHeight: '2550px', transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <ThreeBg />
        <Header />

        {/* Ссылки политик */}
        <div style={{ position: 'absolute', left: '101px', top: '78px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {[
            { text: 'публичная оферта', route: '/public-offer' },
            { text: 'политика конфиденциальности', route: '/privacy-policy' },
            { text: 'согласие на рассылку', route: '/marketing-consent' },
          ].map(l => (
            <span key={l.route} onClick={() => navigate(l.route)} style={{
              fontFamily: 'Cygre', fontWeight: 400, fontSize: '20px',
              color: 'rgba(255,255,255,0.6)', cursor: 'pointer', lineHeight: '1.5',
            }}>
              {l.text}
            </span>
          ))}
        </div>

        {/* Заголовок */}
        <div style={{ position: 'absolute', left: '94px', top: '197px' }}>
          <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 700, fontSize: '90px', lineHeight: '1', color: 'white' }}>
            добро пожаловать
          </p>
          <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 700, fontSize: '90px', lineHeight: '1', color: 'white' }}>
            в МЕТАФЛОРУ*
          </p>
        </div>

        {/* Подзаголовок */}
        <div style={{ position: 'absolute', left: '94px', top: '392px', width: '992px' }}>
          <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 400, fontSize: '40px', lineHeight: '1.2', color: 'white' }}>
            пожалуй, лучшее AI-powered мини-приложение — академия, лаба, цех и другие сервисы
          </p>
        </div>

        {/* Карусель */}
        <div style={{ position: 'absolute', left: 0, top: '639px', width: '1180px', height: '1000px', overflow: 'visible' }}>
          {/* Левая */}
          <div onClick={() => setActive((active - 1 + 3) % 3)} style={{ position: 'absolute', left: '-213px', top: 0, cursor: 'pointer' }}>
            <div style={{ width: '609px', height: '972px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ transform: 'rotate(-5deg)', width: '530px', height: '930px', borderRadius: '40px', overflow: 'hidden' }}>
                <img src={getImg(0)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            </div>
          </div>
          {/* Центральная */}
          <div style={{ position: 'absolute', left: '315px', top: 0 }}>
            <div style={{ width: '530px', height: '930px', borderRadius: '40px', overflow: 'hidden' }}>
              <img src={getImg(1)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </div>
          {/* Правая */}
          <div onClick={() => setActive((active + 1) % 3)} style={{ position: 'absolute', left: '764px', top: 0, cursor: 'pointer' }}>
            <div style={{ width: '609px', height: '972px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ transform: 'rotate(5deg)', width: '530px', height: '930px', borderRadius: '40px', overflow: 'hidden' }}>
                <img src={getImg(2)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Точки */}
        <div style={{ position: 'absolute', left: 'calc(50% + 0.5px)', top: '1650px', transform: 'translateX(-50%)', display: 'flex', gap: '11px', alignItems: 'center' }}>
          {[0,1,2].map(i => (
            <div key={i} onClick={() => setActive(i)} style={{
              width: active === i ? '63px' : '17px', height: '17px',
              backgroundColor: active === i ? '#fffdfe' : '#d6d6d6',
              borderRadius: '33px', transition: 'all 0.3s ease-out', cursor: 'pointer',
            }} />
          ))}
        </div>

        {/* Кнопка "экскурсия" */}
        <img src={btnTour} alt="экскурсия по платформе" onClick={() => navigate('/tour-video')} className="button-inner-glow" style={{
          position: 'absolute', left: '143px', top: '1744px', width: '894px', height: '139px', cursor: 'pointer',
        }} />

        {/* Кнопка "попробовать бесплатно" */}
        <img src={btnFree} alt="попробовать бесплатно" onClick={() => navigate('/demo-access')} className="button-inner-glow" style={{
          position: 'absolute', left: '143px', top: '1902px', width: '894px', height: '139px', cursor: 'pointer',
        }} />

        <Footer />
      </div>
    </div>
  );
};
