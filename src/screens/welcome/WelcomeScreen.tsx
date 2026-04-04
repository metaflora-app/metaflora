import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrCreateUser } from '../../utils/supabase';
import { ThreeBg, Header, Footer } from '../../components/ScreenLayout';

import btnTour from '../../assets/welcome-elements/кнопка экскурсия по платформе.png';
import btnFree from '../../assets/welcome-elements/кнопка попробовать бесплатно.png';
import welcomeCard1 from '../../assets/welcome-redesign/заглушка-1.png';
import welcomeCard2 from '../../assets/welcome-redesign/заглушка-2.png';
import welcomeCard3 from '../../assets/welcome-redesign/заглушка-3.png';
import welcomeCard4 from '../../assets/welcome-redesign/новая-заглушка-4.png';

export const WelcomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const [activeCard, setActiveCard] = React.useState(0);

  React.useEffect(() => {
    getOrCreateUser().then(user => {
      if (user?.subscription_type === 'premium') navigate('/main-dashboard-premium', { replace: true });
    });
  }, [navigate]);

  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;
  const cards = [
    { src: welcomeCard1, width: 700, height: 957 },
    { src: welcomeCard2, width: 674, height: 826 },
    { src: welcomeCard3, width: 639, height: 822 },
    { src: welcomeCard4, width: 674, height: 826 },
  ];

  const getCardSlot = (index: number) => {
    const order = (index - activeCard + cards.length) % cards.length;

    if (order === 0) {
      return {
        left: 198,
        top: 700,
        zIndex: 4,
        className: 'welcome-stack-front',
      };
    }

    if (order === 1) {
      return {
        left: 498,
        top: 745,
        zIndex: 1,
        className: 'welcome-stack-back-right',
      };
    }

    if (order === 2) {
      return {
        left: 382,
        top: 803,
        zIndex: 2,
        className: 'welcome-stack-mid',
      };
    }

    return {
      left: 35,
      top: 803,
      zIndex: 1,
      className: 'welcome-stack-back-left',
    };
  };

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

        {cards.map((card, index) => {
          const slot = getCardSlot(index);

          return (
            <button
              key={card.src}
              type="button"
              onClick={() => setActiveCard(index)}
              className={`welcome-stack-card ${slot.className}`}
              style={{
                position: 'absolute',
                left: `${slot.left}px`,
                top: `${slot.top}px`,
                width: `${card.width}px`,
                height: `${card.height}px`,
                zIndex: slot.zIndex,
                border: 'none',
                background: 'transparent',
                padding: 0,
                cursor: 'pointer',
                transition:
                  'left 920ms cubic-bezier(0.22, 1, 0.36, 1), top 920ms cubic-bezier(0.22, 1, 0.36, 1), z-index 320ms ease',
              }}
            >
              <img
                src={card.src}
                alt=""
                style={{ width: `${card.width}px`, height: `${card.height}px`, objectFit: 'cover', borderRadius: '62px', display: 'block', pointerEvents: 'none' }}
              />
            </button>
          );
        })}

        {/* Кнопка "экскурсия" */}
        <button
          type="button"
          onClick={() => navigate('/tour-video')}
          className="premium-button-shell button-inner-glow motion-press-grow"
          style={{
            position: 'absolute',
            left: '143px',
            top: '1744px',
            width: '894px',
            height: '139px',
            cursor: 'pointer',
            border: 'none',
            background: 'transparent',
            padding: 0,
            borderRadius: '62px',
            overflow: 'hidden',
          }}
        >
          <img
            src={btnTour}
            alt="экскурсия по платформе"
            className="button-inner-glow"
            style={{ position: 'absolute', inset: '2px', width: 'calc(100% - 4px)', height: 'calc(100% - 4px)', objectFit: 'contain', pointerEvents: 'none', zIndex: 2 }}
          />
        </button>

        {/* Кнопка "попробовать бесплатно" */}
        <img src={btnFree} alt="попробовать бесплатно" onClick={() => navigate('/demo-access')} className="button-inner-glow motion-press-grow" style={{
          position: 'absolute', left: '143px', top: '1902px', width: '894px', height: '139px', cursor: 'pointer',
        }} />

        <Footer />
      </div>
    </div>
  );
};
