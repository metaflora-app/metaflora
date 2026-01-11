import React from 'react';
import { useNavigate } from 'react-router-dom';

// Images
import logoSmall from '../../assets/figma-welcome/logo-small.png';
import logoFooter from '../../assets/figma-welcome/logo-footer.png';
import socials from '../../assets/figma-welcome/socials.png';
import carouselCenter from '../../assets/figma-welcome/carousel-center.png';
import carouselLeft from '../../assets/figma-welcome/carousel-left.png';
import carouselRight from '../../assets/figma-welcome/carousel-right.png';
import pattern from '../../assets/figma-welcome/pattern.png';

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
        left: '492px',
        top: '28px',
        width: '189px',
        height: '137px',
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
          }}
        />
      </div>

      {/* Кнопка "написать в поддержку" */}
      <button style={{
        position: 'absolute',
        left: 'calc(50% + 336.5px)',
        top: '97px',
        width: '205px',
        height: '78px',
        backdropFilter: 'blur(50px)',
        background: 'rgba(255, 255, 255, 0.1)',
        border: '4px solid rgba(255, 255, 255, 0.3)',
        borderRadius: '62px',
        overflow: 'hidden',
        transform: 'translateX(-50%)',
        cursor: 'pointer',
      }}>
        <div style={{
          position: 'absolute',
          bottom: 'calc(25.64% - 4px)',
          top: 'calc(23.08% - 4px)',
          left: 'calc(50% - 68.5px)',
          width: '145px',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'Gotham Pro',
          fontSize: '20px',
          lineHeight: '20px',
          color: 'white',
        }}>
          <p style={{ marginBottom: 0, fontWeight: 300 }}>написать</p>
          <p style={{ marginBottom: 0, fontWeight: 700 }}>в поддержку</p>
        </div>
      </button>

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
      <button style={{
        position: 'absolute',
        left: 'calc(50% + 3px)',
        top: '1759px',
        transform: 'translateX(-50%)',
        width: '892px',
        height: '139px',
        backdropFilter: 'blur(50px)',
        border: '4px solid rgba(255, 255, 255, 0.3)',
        borderRadius: '62px',
        overflow: 'hidden',
        background: 'transparent',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          fontFamily: 'Gotham Pro',
          fontWeight: 500,
          fontSize: '40px',
          lineHeight: '40px',
          color: 'white',
          textAlign: 'center',
          padding: '10px',
        }}>
          <p style={{ margin: 0 }}>экскурсия по платформе</p>
        </div>
      </button>

      {/* Кнопка "попробовать бесплатно" (с градиентом) */}
      <button
        onClick={() => navigate('/tour-video')}
        style={{
          position: 'absolute',
          left: 'calc(50% + 3px)',
          top: '1917px',
          transform: 'translateX(-50%)',
          width: '892px',
          height: '139px',
          backdropFilter: 'blur(50px)',
          background: 'rgba(0, 0, 0, 0.9)',
          border: '4px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '62px',
          overflow: 'hidden',
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
          fontFamily: 'Gotham Pro',
          fontWeight: 500,
          fontSize: '40px',
          lineHeight: '40px',
          color: 'white',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
        }}>
          <p style={{ margin: 0 }}>попробовать бесплатно</p>
        </div>
      </button>

      {/* Футер (подвал) */}
      <div style={{
        position: 'absolute',
        left: '125px',
        top: '2085px',
        width: '904px',
        height: '195px',
      }}>
        {/* Левый дисклеймер */}
        <div style={{
          position: 'absolute',
          inset: '0 53.43% 69.23% 2.43%',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'Gotham Pro',
          fontSize: '20px',
          lineHeight: '20px',
          color: 'white',
        }}>
          <p style={{ marginBottom: 0, fontWeight: 300 }}>нажимая на кнопку, вы соглашаетесь</p>
          <p style={{ marginBottom: 0 }}>
            <span style={{ fontWeight: 700 }}>с политикой конфиденциальности </span>
            <span style={{ fontWeight: 700 }}>МЕТАФЛОРА*</span>
          </p>
        </div>
        
        {/* Правый дисклеймер */}
        <div style={{
          position: 'absolute',
          inset: '0 0 69.23% 52.65%',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'Gotham Pro',
          fontSize: '20px',
          lineHeight: '20px',
          textAlign: 'right',
          color: 'white',
        }}>
          <p style={{ marginBottom: 0, fontWeight: 300 }}>нажимая на кнопку, вы соглашаетесь</p>
          <p style={{ marginBottom: 0, fontWeight: 700 }}>на получение информационной</p>
          <p style={{ marginBottom: 0 }}>
            <span style={{ fontWeight: 700 }}>и рекламной рассылки </span>
            <span style={{ fontWeight: 700 }}>МЕТАФЛОРА*</span>
          </p>
        </div>
        
        {/* Хэдер и подвал - новая структура из Figma */}
        <div style={{
          position: 'absolute',
          left: '125px',
          top: '2155px',
          display: 'flex',
          gap: '89px',
          alignItems: 'center',
        }}>
          {/* Логотип в подвале */}
          <div style={{
            width: '569px',
            height: '124px',
            position: 'relative',
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
          
          {/* Подложка под соцсети */}
          <div style={{
            backdropFilter: 'blur(50px)',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '62px',
            height: '78px',
            width: '230px',
            position: 'relative',
          }}>
            {/* Иконки соцсетей */}
            <div style={{
              position: 'absolute',
              left: '76.01%',
              right: '1.91%',
              top: '36px',
            }}>
              <div style={{
                position: 'absolute',
                aspectRatio: '697/251',
                left: '82.09%',
                right: '1.91%',
                top: '36px',
              }}>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: 0.6,
                  overflow: 'hidden',
                  pointerEvents: 'none',
                }}>
                  <img 
                    src={socials}
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
              <div style={{
                position: 'absolute',
                aspectRatio: '50/51',
                left: '76.01%',
                right: '18.36%',
                top: '36px',
              }}>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: 0.6,
                  overflow: 'hidden',
                  pointerEvents: 'none',
                }}>
                  <img 
                    src={socials}
                    alt="Соцсети"
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
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};
