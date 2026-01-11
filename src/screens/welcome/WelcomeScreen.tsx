import React from 'react';
import { useNavigate } from 'react-router-dom';

// Images
import logoSmall from '../../assets/figma-welcome/logo-small.png';
import logoFooter from '../../assets/figma-welcome/logo-footer.png';
import carouselCenter from '../../assets/figma-welcome/carousel-center.png';
import carouselLeft from '../../assets/figma-welcome/carousel-left.png';
import carouselRight from '../../assets/figma-welcome/carousel-right.png';
import pattern from '../../assets/figma-welcome/pattern.png';
import supportButton from '../../assets/welcome-elements/support-button.png';
import socialsIcons from '../../assets/welcome-elements/socials-icons.png';

export const WelcomeScreen: React.FC = () => {
  const navigate = useNavigate();

  // Calculate scale based on viewport width (design width: 1180px)
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;

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
        {/* Background pattern (фон точки) */}
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '1180px',
          height: '2550px',
          backgroundImage: `url(${pattern})`,
          backgroundRepeat: 'repeat',
          backgroundSize: 'auto',
        }} />

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

      {/* Левая карточка карусели (повёрнута -5°) */}
      <div style={{
        position: 'absolute',
        left: '-213px',
        top: '639px',
        display: 'flex',
        alignItems: 'center',
        padding: '10px',
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
                src={carouselLeft}
                alt="Левая карточка"
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

      {/* Центральная карточка карусели */}
      <div style={{
        position: 'absolute',
        left: '315px',
        top: '639px',
        display: 'flex',
        alignItems: 'center',
        padding: '10px',
      }}>
        <div style={{
          width: '530px',
          height: '930px',
          borderRadius: '40px',
          position: 'relative',
        }}>
          <img 
            src={carouselCenter}
            alt="Центральная карточка"
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

      {/* Правая карточка карусели (повёрнута +5°) */}
      <div style={{
        position: 'absolute',
        left: '764px',
        top: '639px',
        display: 'flex',
        alignItems: 'center',
        padding: '10px',
      }}>
        <div style={{
          width: '609.038px',
          height: '972.654px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{ transform: 'rotate(185deg) scaleY(-1)' }}>
            <div style={{
              width: '530px',
              height: '930px',
              borderRadius: '40px',
              position: 'relative',
            }}>
              <img 
                src={carouselRight}
                alt="Правая карточка"
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
        {/* Точка 1 - неактивная */}
        <div style={{
          width: '17px',
          height: '17px',
          backgroundColor: '#d6d6d6',
          borderRadius: '33px',
        }} />
        
        {/* Точка 2 - активная */}
        <div style={{
          width: '63px',
          height: '17px',
          backgroundColor: '#fffdfe',
          borderRadius: '33px',
        }} />
        
        {/* Точка 3 - неактивная */}
        <div style={{
          width: '17px',
          height: '17px',
          backgroundColor: '#d6d6d6',
          borderRadius: '33px',
        }} />
      </div>

      {/* Кнопка "экскурсия по платформе" */}
      <button
        onClick={() => navigate('/tour-video')}
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
          backdropFilter: 'blur(50px)',
          background: 'rgba(0, 0, 0, 0.9)',
          border: '4px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '62px',
          overflow: 'clip',
          cursor: 'pointer',
        }}
      >
        {/* Цветные блоки для градиента */}
        <div style={{
          position: 'absolute',
          left: '141px',
          top: '-207.51px',
        }}>
          {/* Голубой блок */}
          <div style={{
            position: 'absolute',
            width: '575.775px',
            height: '423.343px',
            left: '145px',
            top: '-189.57px',
            background: '#37ecf7',
            borderRadius: '1568.563px',
          }} />
          
          {/* Желтый блок (повернут) */}
          <div style={{
            position: 'absolute',
            left: '288.97px',
            top: '-203.51px',
            width: '511.029px',
            height: '309.527px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{
              transform: 'rotate(11.984deg) skewX(332.71deg)',
              width: '283.008px',
              height: '343.114px',
              background: '#f0d825',
              borderRadius: '1568.563px',
            }} />
          </div>
          
          {/* Салатовый блок */}
          <div style={{
            position: 'absolute',
            width: '317.086px',
            height: '286.961px',
            left: '403.64px',
            top: '73.04px',
            background: '#d5fc44',
            borderRadius: '1568.563px',
          }} />
        </div>
        
        {/* Текст кнопки */}
        <div style={{
          position: 'absolute',
          left: '193px',
          top: '40px',
          width: '521px',
          height: '60px',
          zIndex: 1,
        }}>
          <div style={{
            position: 'absolute',
            left: '10px',
            top: '10px',
            width: '501px',
            height: '40px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            fontFamily: 'Gotham Pro',
            fontWeight: 500,
            fontSize: '40px',
            lineHeight: '0',
            color: 'white',
            textAlign: 'center',
            whiteSpace: 'nowrap',
          }}>
            <p style={{ margin: 0, lineHeight: 'normal' }}>попробовать бесплатно</p>
          </div>
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
          <div style={{
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
      </div>
    </div>
  );
};
