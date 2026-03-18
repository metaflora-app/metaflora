import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrCreateUser } from '../../utils/supabase';

import logoSmall from '../../assets/figma-welcome/logo-small.png';
import logoFooter from '../../assets/figma-welcome/logo-footer.png';
import bgBase from '../../assets/figma-welcome/фон для эксперимента.png';
import bgPattern from '../../assets/figma-welcome/pattern.png';
import supportPlashka from '../../assets/figma-welcome/плашка поддержка.png';
import carouselCenter from '../../assets/figma-welcome/carousel-center.png';
import carouselLeft from '../../assets/figma-welcome/carousel-left.png';
import carouselRight from '../../assets/figma-welcome/carousel-right.png';
import btnTour from '../../assets/welcome-elements/кнопка экскурсия по платформе.png';
import btnFree from '../../assets/welcome-elements/кнопка попробовать бесплатно.png';

export const WelcomeScreen: React.FC = () => {
  const navigate = useNavigate();

  React.useEffect(() => {
    const checkPremium = async () => {
      const user = await getOrCreateUser();
      if (user && user.subscription_type === 'premium') {
        navigate('/main-dashboard-premium', { replace: true });
      }
    };
    checkPremium();
  }, [navigate]);

  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;
  const carouselImages = [carouselLeft, carouselCenter, carouselRight];
  const [activeSlide, setActiveSlide] = React.useState(1);

  const handleCardClick = (position: number) => {
    if (position === 0) setActiveSlide((activeSlide - 1 + 3) % 3);
    else if (position === 2) setActiveSlide((activeSlide + 1) % 3);
  };

  const handleDotClick = (index: number) => setActiveSlide(index);

  const getImageForPosition = (position: number) => {
    const offset = position - 1;
    const index = (activeSlide + offset + 3) % 3;
    return carouselImages[index];
  };

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
        <div style={{
          position: 'absolute',
          left: '500px',
          top: '61px',
          width: '186px',
          height: '131px',
        }}>
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

        {/* Кнопка поддержки */}
        <img
          src={supportPlashka}
          alt="написать в поддержку"
          style={{
            position: 'absolute',
            left: '829px',
            top: '97px',
            width: '247px',
            height: '78px',
            cursor: 'pointer',
          }}
        />

        {/* Политики — три ссылки */}
        <div style={{
          position: 'absolute',
          left: '101px',
          top: '78px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}>
          <span
            onClick={() => navigate('/public-offer')}
            style={{
              fontFamily: 'Cygre',
              fontWeight: 400,
              fontSize: '20px',
              color: 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
              lineHeight: '1.4',
            }}
          >
            публичная оферта
          </span>
          <span
            onClick={() => navigate('/privacy-policy')}
            style={{
              fontFamily: 'Cygre',
              fontWeight: 400,
              fontSize: '20px',
              color: 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
              lineHeight: '1.4',
            }}
          >
            политика конфиденциальности
          </span>
          <span
            onClick={() => navigate('/marketing-consent')}
            style={{
              fontFamily: 'Cygre',
              fontWeight: 400,
              fontSize: '20px',
              color: 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
              lineHeight: '1.4',
            }}
          >
            согласие на рассылку
          </span>
        </div>

        {/* Заголовок */}
        <div style={{
          position: 'absolute',
          left: '94px',
          top: '197px',
          width: '992px',
        }}>
          <div style={{
            fontFamily: 'Cygre',
            fontWeight: 700,
            fontSize: '90px',
            lineHeight: '1',
            color: 'white',
          }}>
            <p style={{ margin: 0 }}>добро пожаловать</p>
            <p style={{ margin: 0 }}>в МЕТАФЛОРУ*</p>
          </div>
        </div>

        {/* Подзаголовок */}
        <div style={{
          position: 'absolute',
          left: '94px',
          top: '392px',
          width: '992px',
        }}>
          <p style={{
            margin: 0,
            fontFamily: 'Cygre',
            fontWeight: 400,
            fontSize: '40px',
            lineHeight: '1.2',
            color: 'white',
          }}>
            пожалуй, лучшее AI-powered мини-приложение — академия, лаба, цех и другие сервисы
          </p>
        </div>

        {/* Карусель */}
        <div style={{
          position: 'absolute',
          left: 0,
          top: '639px',
          width: '1180px',
          height: '1000px',
          overflow: 'visible',
        }}>
          {/* Левая карточка */}
          <div onClick={() => handleCardClick(0)} style={{
            position: 'absolute',
            left: '-213px',
            top: '0px',
            cursor: 'pointer',
          }}>
            <div style={{ width: '609px', height: '972px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ transform: 'rotate(-5deg)' }}>
                <div style={{ width: '530px', height: '930px', borderRadius: '40px', position: 'relative' }}>
                  <img key={`left-${activeSlide}`} src={getImageForPosition(0)} alt="" className="carousel-image"
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: '40px' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Центральная карточка */}
          <div onClick={() => handleCardClick(1)} style={{ position: 'absolute', left: '315px', top: '0px', cursor: 'pointer' }}>
            <div style={{ width: '530px', height: '930px', borderRadius: '40px', position: 'relative' }}>
              <img key={`center-${activeSlide}`} src={getImageForPosition(1)} alt="" className="carousel-image"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: '40px' }} />
            </div>
          </div>

          {/* Правая карточка */}
          <div onClick={() => handleCardClick(2)} style={{ position: 'absolute', left: '764px', top: '0px', cursor: 'pointer' }}>
            <div style={{ width: '609px', height: '972px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ transform: 'rotate(5deg)' }}>
                <div style={{ width: '530px', height: '930px', borderRadius: '40px', position: 'relative' }}>
                  <img key={`right-${activeSlide}`} src={getImageForPosition(2)} alt="" className="carousel-image"
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: '40px' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Пагинация */}
        <div style={{
          position: 'absolute',
          left: 'calc(50% + 0.5px)',
          top: '1650px',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '11px',
          alignItems: 'center',
        }}>
          {[0, 1, 2].map(i => (
            <div key={i} onClick={() => handleDotClick(i)} style={{
              width: activeSlide === i ? '63px' : '17px',
              height: '17px',
              backgroundColor: activeSlide === i ? '#fffdfe' : '#d6d6d6',
              borderRadius: '33px',
              transition: 'all 0.3s ease-out',
              cursor: 'pointer',
            }} />
          ))}
        </div>

        {/* Кнопка "экскурсия по платформе" — PNG */}
        <img
          src={btnTour}
          alt="экскурсия по платформе"
          onClick={() => navigate('/tour-video')}
          className="button-inner-glow"
          style={{
            position: 'absolute',
            left: '143px',
            top: '1744px',
            width: '894px',
            height: '139px',
            cursor: 'pointer',
          }}
        />

        {/* Кнопка "попробовать бесплатно" — PNG */}
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
          <img
            src={supportPlashka}
            alt="поддержка"
            style={{
              position: 'absolute',
              left: '641px',
              top: '-2px',
              width: '247px',
              height: '78px',
            }}
          />
        </div>
      </div>
    </div>
  );
};
