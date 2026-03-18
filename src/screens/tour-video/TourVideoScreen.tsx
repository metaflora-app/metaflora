import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrCreateUser } from '../../utils/supabase';

import bgBase from '../../assets/figma-welcome/фон для эксперимента.png';
import bgPattern from '../../assets/figma-welcome/pattern.png';
import logoSmall from '../../assets/figma-welcome/logo-small.png';
import logoFooter from '../../assets/figma-welcome/logo-footer.png';
import supportPlashka from '../../assets/figma-welcome/плашка поддержка.png';
import btnFree from '../../assets/welcome-elements/кнопка попробовать бесплатно.png';
import expandPlashka from '../../assets/tour-video/плашка развернуть видео.png';
import tourVideo from '../../assets/tour-video/мастерская в окошке флоры.mp4';

export const TourVideoScreen: React.FC = () => {
  const navigate = useNavigate();

  React.useEffect(() => {
    getOrCreateUser().then(user => {
      if (user?.subscription_type === 'premium') {
        navigate('/main-dashboard-premium', { replace: true });
      }
    });
  }, [navigate]);

  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;

  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      minHeight: '100vh',
      background: '#020101',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'relative',
        width: '1180px',
        minHeight: '2550px',
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
      }}>
        {/* Слой 1: базовый фон */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${bgBase})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }} />
        {/* Слой 2: паттерн точек */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${bgPattern})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'repeat',
        }} />
        {/* Слой 3: градиент */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(2,1,1,0) 0%, rgba(2,1,1,0.6) 100%)',
        }} />

        {/* Лого маленькое */}
        <div style={{ position: 'absolute', left: '500px', top: '61px', width: '186px', height: '131px' }}>
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
            <img src={logoSmall} alt="МЕТАФЛОРА*" style={{
              position: 'absolute',
              height: '131.84%',
              left: '-21.84%',
              top: '-16.38%',
              width: '143.34%',
              maxWidth: 'none',
            }} />
          </div>
        </div>

        {/* Поддержка */}
        <img src={supportPlashka} alt="написать в поддержку" style={{
          position: 'absolute',
          left: '829px',
          top: '97px',
          width: '247px',
          height: '78px',
          cursor: 'pointer',
        }} />

        {/* Заголовок */}
        <div style={{ position: 'absolute', left: '92px', top: '197px', width: '1000px' }}>
          <p style={{
            margin: 0,
            fontFamily: 'Cygre',
            fontWeight: 700,
            fontSize: '80px',
            lineHeight: '1',
            color: 'white',
          }}>
            экскурсия по платформе{'\n'}за 2 минуты
          </p>
        </div>

        {/* Видео фрейм */}
        <div style={{
          position: 'absolute',
          left: '143px',
          top: '410px',
          width: '894px',
          height: '1457px',
          borderRadius: '40px',
          overflow: 'hidden',
        }}>
          <video
            autoPlay
            loop
            muted
            playsInline
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          >
            <source src={tourVideo} type="video/mp4" />
          </video>

          {/* Стеклянный blur-оверлей снизу */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '200px',
            background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)',
          }} />

          {/* Плашка "развернуть видео" */}
          <img
            src={expandPlashka}
            alt="развернуть видео на полный экран"
            style={{
              position: 'absolute',
              bottom: '30px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '500px',
              height: 'auto',
              cursor: 'pointer',
            }}
          />
        </div>

        {/* Кнопка "попробовать бесплатно" */}
        <img
          src={btnFree}
          alt="попробовать бесплатно"
          onClick={() => navigate('/demo-access')}
          className="button-inner-glow"
          style={{
            position: 'absolute',
            left: '143px',
            top: '1902px',
            width: '894px',
            height: '139px',
            cursor: 'pointer',
          }}
        />

        {/* Футер */}
        <div style={{
          position: 'absolute',
          left: 'calc(50% - 5px)',
          top: '2071px',
          transform: 'translateX(-50%)',
          width: '888px',
          height: '124px',
        }}>
          <div style={{ position: 'absolute', width: '380px', height: '83px', left: '2px', top: '-16px' }}>
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
              <img src={logoFooter} alt="МЕТАФЛОРА*" style={{
                position: 'absolute',
                height: '526.54%',
                left: '-37.89%',
                top: '-202.47%',
                width: '170.37%',
                maxWidth: 'none',
              }} />
            </div>
          </div>
          <div style={{
            position: 'absolute',
            left: '2px',
            top: '56px',
            fontFamily: 'Cygre',
            fontWeight: 400,
            fontSize: '20px',
            color: 'rgba(255,255,255,0.6)',
          }}>
            Copyright © Все права защищены.
          </div>
          <img src={supportPlashka} alt="поддержка" style={{
            position: 'absolute',
            left: '641px',
            top: '-2px',
            width: '247px',
            height: '78px',
          }} />
        </div>
      </div>
    </div>
  );
};
