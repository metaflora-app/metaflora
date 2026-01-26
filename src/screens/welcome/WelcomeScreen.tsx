import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrCreateUser } from '../../utils/supabase';

// Images
import logoSmall from '../../assets/figma-welcome/logo-small.png';
import logoFooter from '../../assets/figma-welcome/logo-footer.png';
import carouselCenter from '../../assets/figma-welcome/carousel-center.png';
import carouselLeft from '../../assets/figma-welcome/carousel-left.png';
import carouselRight from '../../assets/figma-welcome/carousel-right.png';
import pattern from '../../assets/figma-welcome/pattern.png';
import supportButton from '../../assets/welcome-elements/support-button.png';
import socialsIcons from '../../assets/welcome-elements/socials-icons.png';
import tryButtonBg from '../../assets/tour-video/try-button-bg.png';
import policyInfoIcon from '../../assets/figma-welcome/policy-info-icon.png';

export const WelcomeScreen: React.FC = () => {
  const navigate = useNavigate();

  // Check if user is premium and redirect IMMEDIATELY
  React.useEffect(() => {
    const checkPremium = async () => {
      const user = await getOrCreateUser();
      if (user && user.subscription_type === 'premium') {
        console.log('✅ Premium user detected, redirecting to dashboard');
        navigate('/main-dashboard-premium', { replace: true });
      }
    };
    checkPremium();
  }, [navigate]);

  // Calculate scale based on viewport width (design width: 1180px)
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;

  // Carousel images array
  const carouselImages = [carouselLeft, carouselCenter, carouselRight];
  
  // Carousel state - start at 1 (center card is active)
  const [activeSlide, setActiveSlide] = React.useState(1);

  // NO AUTO-SCROLL - only manual interaction

  // Click on card to change slide
  // Position: 0=left, 1=center, 2=right
  // When clicking left card (position 0), move carousel left (activeSlide - 1)
  // When clicking right card (position 2), move carousel right (activeSlide + 1)
  const handleCardClick = (position: number) => {
    if (position === 0) {
      // Click on left card - move carousel left
      setActiveSlide((activeSlide - 1 + 3) % 3);
    } else if (position === 2) {
      // Click on right card - move carousel right
      setActiveSlide((activeSlide + 1) % 3);
    }
    // Position 1 (center) - already active, do nothing
  };

  // Click on dot to change slide
  const handleDotClick = (index: number) => {
    setActiveSlide(index);
  };

  // Get image for each position based on active slide
  // Center position shows the active slide image
  const getImageForPosition = (position: number) => {
    // position: 0=left, 1=center, 2=right
    // Center (position 1) should show activeSlide image
    const offset = position - 1; // -1, 0, +1
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
      {/* Scaled container */}
      <div style={{
        position: 'relative',
        width: '1180px',
        minHeight: '2550px',
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
      }}>
        {/* Background pattern - full screen */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${pattern})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'repeat',
          }}
        />

      {/* Логотип маленький (верхний) */}
      <div style={{
        position: 'absolute',
        left: '500px',
        top: '61px',
        width: '186px',
        height: '131px',
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
        }}>
          <img 
            src={logoSmall}
            alt="МЕТАФЛОРА*"
            style={{
              position: 'absolute',
              height: '131.84%',
              left: '-21.84%',
              top: '-16.38%',
              width: '143.34%',
              maxWidth: 'none',
            }}
          />
        </div>
      </div>

      {/* Кнопка "написать в поддержку" */}
      <img 
        src={supportButton}
        alt="написать в поддержку"
        style={{
          position: 'absolute',
          left: '829px',
          top: '97px',
          width: '205px',
          height: '78px',
          cursor: 'pointer',
        }}
      />

      {/* Заголовок "добро пожаловать в МЕТАФЛОРУ*" */}
      <div style={{
        position: 'absolute',
        left: '94px',
        top: '197px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'Inter',
          fontWeight: 800,
          fontSize: '80px',
          lineHeight: '80px',
          color: 'white',
          whiteSpace: 'nowrap',
        }}>
          <p style={{ marginBottom: 0 }}>добро пожаловать</p>
          <p style={{ marginBottom: 0 }}>в МЕТАФЛОРУ*</p>
        </div>
      </div>

      {/* Подзаголовок "обучайтесь AI прямо в Telegram..." */}
      <div style={{
        position: 'absolute',
        left: '94px',
        top: '382px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'Gotham Pro',
          fontSize: '40px',
          lineHeight: '40px',
          color: 'white',
          whiteSpace: 'nowrap',
        }}>
          <p style={{ marginBottom: 0 }}>обучайтесь AI прямо в Telegram</p>
          <p style={{ marginBottom: 0 }}>
            <span style={{ fontWeight: 700 }}>с МЕТАФЛОРОЙ*:</span>
            {' '}академия, лаба, цех
          </p>
          <p style={{ marginBottom: 0 }}>и другие сервисы</p>
        </div>
      </div>

      {/* Carousel container */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: '639px',
          width: '1180px',
          height: '1000px',
          overflow: 'visible',
        }}
      >
        {/* Левая карточка (повёрнута -5°) */}
        <div 
          onClick={() => handleCardClick(0)}
          className="carousel-slide"
          style={{
            position: 'absolute',
            left: '-213px',
            top: '0px',
            display: 'flex',
            alignItems: 'center',
            padding: '10px',
            cursor: 'pointer',
          }}>
          <div style={{
            width: '609.038px',
            height: '972.654px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{ transform: 'rotate(-5deg)' }}>
              <div style={{
                width: '530px',
                height: '930px',
                borderRadius: '40px',
                position: 'relative',
              }}>
                <img 
                  key={`left-${activeSlide}`}
                  src={getImageForPosition(0)}
                  alt="Левая карточка"
                  className="carousel-image"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '40px',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Центральная карточка */}
        <div 
          onClick={() => handleCardClick(1)}
          className="carousel-slide"
          style={{
            position: 'absolute',
            left: '315px',
            top: '0px',
            display: 'flex',
            alignItems: 'center',
            padding: '10px',
            cursor: 'pointer',
          }}>
          <div style={{
            width: '530px',
            height: '930px',
            borderRadius: '40px',
            position: 'relative',
          }}>
            <img 
              key={`center-${activeSlide}`}
              src={getImageForPosition(1)}
              alt="Центральная карточка"
              className="carousel-image"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '40px',
              }}
            />
          </div>
        </div>

        {/* Правая карточка (повёрнута +5°) */}
        <div 
          onClick={() => handleCardClick(2)}
          className="carousel-slide"
          style={{
            position: 'absolute',
            left: '764px',
            top: '0px',
            display: 'flex',
            alignItems: 'center',
            padding: '10px',
            cursor: 'pointer',
          }}>
          <div style={{
            width: '609.038px',
            height: '972.654px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{ transform: 'rotate(5deg)' }}>
              <div style={{
                width: '530px',
                height: '930px',
                borderRadius: '40px',
                position: 'relative',
              }}>
                <img 
                  key={`right-${activeSlide}`}
                  src={getImageForPosition(2)}
                  alt="Правая карточка"
                  className="carousel-image"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '40px',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Пагинация (3 точки) */}
      <div style={{
        position: 'absolute',
        left: 'calc(50% + 0.5px)',
        top: '1650px',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '11px',
        alignItems: 'center',
      }}>
        {/* Точка 1 */}
        <div 
          onClick={() => handleDotClick(0)}
          style={{
            width: activeSlide === 0 ? '63px' : '17px',
            height: '17px',
            backgroundColor: activeSlide === 0 ? '#fffdfe' : '#d6d6d6',
            borderRadius: '33px',
            transition: 'all 0.3s ease-out',
            cursor: 'pointer',
          }} 
        />
        
        {/* Точка 2 */}
        <div 
          onClick={() => handleDotClick(1)}
          style={{
            width: activeSlide === 1 ? '63px' : '17px',
            height: '17px',
            backgroundColor: activeSlide === 1 ? '#fffdfe' : '#d6d6d6',
            borderRadius: '33px',
            transition: 'all 0.3s ease-out',
            cursor: 'pointer',
          }} 
        />
        
        {/* Точка 3 */}
        <div 
          onClick={() => handleDotClick(2)}
          style={{
            width: activeSlide === 2 ? '63px' : '17px',
            height: '17px',
            backgroundColor: activeSlide === 2 ? '#fffdfe' : '#d6d6d6',
            borderRadius: '33px',
            transition: 'all 0.3s ease-out',
            cursor: 'pointer',
          }} 
        />
      </div>

      {/* Кнопка "экскурсия по платформе" */}
      <button
        onClick={() => navigate('/tour-video')}
        className="blur-wave"
        style={{
          position: 'absolute',
          left: '143px',
          top: '1744px',
          width: '892px',
          height: '139px',
          backdropFilter: 'blur(50px)',
          border: '4px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '62px',
          overflow: 'clip',
          background: 'transparent',
          cursor: 'pointer',
        }}
      >
        <div style={{
          position: 'absolute',
          left: '442px',
          top: '66px',
          transform: 'translate(-50%, -50%)',
          fontFamily: 'Gotham Pro',
          fontWeight: 500,
          fontSize: '40px',
          lineHeight: '0',
          color: 'white',
          textAlign: 'center',
          whiteSpace: 'nowrap',
        }}>
          <p style={{ margin: 0, lineHeight: 'normal' }}>экскурсия по платформе</p>
        </div>
      </button>

      {/* Кнопка "попробовать бесплатно" (с градиентом) */}
      <button
        onClick={() => navigate('/tour-video')}
        style={{
          position: 'absolute',
          left: '143px',
          top: '1902px',
          width: '892px',
          height: '140px',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
        }}
      >
        {/* PNG кнопка с градиентом под текстом */}
        <img 
          src={tryButtonBg}
          alt=""
          className="button-inner-glow"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'fill',
            pointerEvents: 'none',
          }}
        />

        {/* Текст кнопки - поверх градиента */}
        <div style={{
          position: 'relative',
          zIndex: 1,
          fontFamily: 'Gotham Pro',
          fontWeight: 500,
          fontSize: '40px',
          color: 'white',
          textAlign: 'center',
        }}>
          попробовать бесплатно
        </div>
      </button>

      {/* Хэдер и подвал - новая структура из Figma */}
      <div style={{
        position: 'absolute',
        left: '141px',
        top: '2071px',
        width: '888px',
        height: '124px',
      }}>
          {/* Логотип в подвале */}
          <div style={{
            position: 'absolute',
            width: '380px',
            height: '83px',
            left: '2px',
            top: '-16px',
          }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              overflow: 'hidden',
              pointerEvents: 'none',
            }}>
              <img 
                src={logoFooter}
                alt="МЕТАФЛОРА*"
                style={{
                  position: 'absolute',
                  height: '526.54%',
                  left: '-37.89%',
                  top: '-202.47%',
                  width: '170.37%',
                  maxWidth: 'none',
                }}
              />
            </div>
          </div>
          
          {/* Copyright текст */}
          <div style={{
            position: 'absolute',
            left: '2px',
            top: '56px',
            width: '433px',
            height: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            fontFamily: 'Gotham Pro',
            fontWeight: 300,
            fontSize: '20px',
            lineHeight: '0',
            color: 'white',
          }}>
            <p style={{ 
              margin: 0,
              lineHeight: 'normal',
              whiteSpace: 'pre-wrap',
            }}>
              Copyright © Все права защищены.
            </p>
          </div>
          
          {/* Подложка под соцсети */}
          <div className="blur-wave" style={{
            position: 'absolute',
            left: '664px',
            top: '-2px',
            backdropFilter: 'blur(50px)',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '62px',
            height: '78px',
            width: '230px',
          }} />
          
          {/* Иконки соцсетей */}
          <div style={{
            position: 'absolute',
            left: '681px',
            top: '13px',
            width: '196px',
            height: '51px',
          }}>
            {/* Первая иконка */}
            <div style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '50px',
              height: '51px',
            }}>
              <div style={{
                position: 'absolute',
                inset: 0,
                opacity: 0.6,
                overflow: 'hidden',
                pointerEvents: 'none',
              }}>
                <img 
                  src={socialsIcons}
                  alt="Telegram"
                  style={{
                    position: 'absolute',
                    height: '339.84%',
                    left: '-377.92%',
                    top: '-118.33%',
                    width: '517.92%',
                    maxWidth: 'none',
                  }}
                />
              </div>
            </div>
            
            {/* Группа иконок */}
            <div style={{
              position: 'absolute',
              left: '54px',
              top: 0,
              width: '142px',
              height: '51px',
            }}>
              <div style={{
                position: 'absolute',
                inset: 0,
                opacity: 0.6,
                overflow: 'hidden',
                pointerEvents: 'none',
              }}>
                <img 
                  src={socialsIcons}
                  alt="Соцсети"
                  style={{
                    position: 'absolute',
                    height: '339.84%',
                    left: '-16.64%',
                    top: '-118.33%',
                    width: '183.64%',
                    maxWidth: 'none',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Политики */}
        <div style={{
          position: 'absolute',
          left: '101px',
          top: '78px',
          width: '214px',
          height: '119px',
        }}>
          {/* Иконка "i" */}
          <img 
            src={policyInfoIcon}
            alt="info"
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '41px',
              height: '41px',
              objectFit: 'contain',
            }}
          />

          {/* Текст "политика конфиденциальности" */}
          <div style={{
            position: 'absolute',
            left: '0px',
            top: '40px',
            width: '345px',
            height: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            fontFamily: 'Gotham Pro',
            fontWeight: 300,
            fontSize: '20px',
            lineHeight: '0',
            color: 'white',
            whiteSpace: 'pre-wrap',
          }}>
            <p style={{ margin: 0, lineHeight: 'normal' }}>политика конфиденциальности</p>
          </div>

          {/* Текст "рекламная рассылка" */}
          <div style={{
            position: 'absolute',
            left: '0px',
            top: '60px',
            width: '362px',
            height: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            fontFamily: 'Gotham Pro',
            fontWeight: 300,
            fontSize: '20px',
            lineHeight: '0',
            color: 'white',
            whiteSpace: 'pre-wrap',
          }}>
            <p style={{ margin: 0, lineHeight: 'normal' }}>рекламная рассылка</p>
          </div>

          {/* Кликабельная область на "политика конфиденциальности" */}
          <div
            onClick={() => navigate('/privacy-policy')}
            style={{
              position: 'absolute',
              left: 0,
              top: '40px',
              width: '345px',
              height: '20px',
              cursor: 'pointer',
            }}
          />
          {/* Кликабельная область на "рекламная рассылка" */}
          <div
            onClick={() => navigate('/marketing-consent')}
            style={{
              position: 'absolute',
              left: 0,
              top: '60px',
              width: '362px',
              height: '20px',
              cursor: 'pointer',
            }}
          />
        </div>
      </div>
    </div>
  );
};
