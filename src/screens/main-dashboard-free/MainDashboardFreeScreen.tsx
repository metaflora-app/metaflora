import React from 'react';
import { useNavigate } from 'react-router-dom';

// Images
import bgPattern from '../../assets/figma-welcome/pattern.png';
import logoSmall from '../../assets/figma-welcome/logo-small.png';
import logoFooter from '../../assets/figma-welcome/logo-footer.png';
import socialsIcons from '../../assets/welcome-elements/socials-icons.png';
import supportButton from '../../assets/tour-video/support-button.png';
import payButtonBg from '../../assets/demo-access-elements/кнопка оплатить полный доступ.png';

export const MainDashboardFreeScreen: React.FC = () => {
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
          backgroundImage: `url(${bgPattern})`,
          backgroundRepeat: 'repeat',
          backgroundSize: 'auto',
        }} />

        {/* Header - Маленькое лого */}
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

        {/* Header - Кнопка написать в поддержку */}
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

        {/* Приветствие */}
        <div style={{
          position: 'absolute',
          left: '80px',
          top: '197px',
          width: '1020px',
          height: '160px',
          display: 'flex',
          alignItems: 'center',
          fontFamily: 'Inter',
          fontWeight: 800,
          fontSize: '80px',
          color: 'white',
        }}>
          привет, Имя!
        </div>

        {/* Блок баланса и метакоины */}
        <div style={{
          position: 'absolute',
          left: '80px',
          top: '327px',
          width: '1020px',
          height: '200px',
        }}>
          {/* Аватар бобёр */}
          <div style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '159px',
            height: '159px',
          }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '79.5px',
              overflow: 'hidden',
              border: '2px solid rgba(255, 255, 255, 0.3)',
            }}>
              {/* Placeholder for beaver image - will be replaced with actual asset */}
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              }} />
            </div>
          </div>

          {/* Текст "гость" */}
          <div style={{
            position: 'absolute',
            left: '193px',
            top: '37px',
            width: '135px',
            height: '40px',
            fontFamily: 'Gotham Pro',
            fontWeight: 400,
            fontSize: '40px',
            lineHeight: 0,
            color: 'white',
          }}>
            <p style={{ margin: 0, lineHeight: '1' }}>гость</p>
          </div>

          {/* Текст "демо-курс" */}
          <div style={{
            position: 'absolute',
            left: '193px',
            top: '76px',
            width: '455px',
            height: '40px',
            fontFamily: 'Gotham Pro',
            fontWeight: 700,
            fontSize: '40px',
            lineHeight: 0,
            color: 'white',
          }}>
            <p style={{ margin: 0, lineHeight: '1' }}>демо-курс</p>
          </div>

          {/* Иконка метакоинов */}
          <div style={{
            position: 'absolute',
            left: '551px',
            top: '5px',
            width: '109px',
            height: '109px',
            borderRadius: '54.5px',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            overflow: 'hidden',
          }}>
            {/* Placeholder for coin icon - will use actual Figma asset */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
            }} />
          </div>

          {/* Текст "150 метакоинов" */}
          <div style={{
            position: 'absolute',
            left: '678px',
            top: '35px',
            width: '313px',
            height: '45px',
            fontFamily: 'TT Commons',
            fontWeight: 700,
            fontSize: '45px',
            lineHeight: 0,
            color: 'white',
          }}>
            <p style={{ margin: 0, lineHeight: '1' }}>150 метакоинов</p>
          </div>

          {/* Кнопка "пополнить" */}
          <div style={{
            position: 'absolute',
            left: '679px',
            top: '87px',
            width: '176px',
            height: '57px',
            backdropFilter: 'blur(50px)',
            background: 'rgba(0, 0, 0, 0.9)',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '62px',
            overflow: 'clip',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {/* Gradient colors behind */}
            <div style={{
              position: 'absolute',
              left: '37px',
              top: '-77px',
              width: '250px',
              height: '250px',
              pointerEvents: 'none',
            }}>
              <div style={{
                position: 'absolute',
                left: '4px',
                top: '8.87px',
                width: '87.902px',
                height: '147.81px',
                background: '#fa002d',
                borderRadius: '1568.563px',
              }} />
              <div style={{
                position: 'absolute',
                left: '25.98px',
                top: '4px',
                width: '78.017px',
                height: '108.071px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <div style={{
                  width: '46.981px',
                  height: '94.573px',
                  background: '#f0d825',
                  borderRadius: '1568.563px',
                  transform: 'rotate(25.894deg) skewX(3.673deg)',
                }} />
              </div>
              <div style={{
                position: 'absolute',
                left: '43.49px',
                top: '100.56px',
                width: '48.408px',
                height: '100.192px',
                background: '#d5fc44',
                borderRadius: '1568.563px',
              }} />
            </div>
            <div style={{
              position: 'relative',
              zIndex: 1,
              fontFamily: 'Gotham Pro',
              fontWeight: 500,
              fontSize: '23px',
              color: 'white',
            }}>
              пополнить
            </div>
          </div>
        </div>

        {/* Карусель секций */}
        <div style={{
          position: 'absolute',
          left: '80px',
          top: '557px',
          width: '1020px',
          height: '400px',
          display: 'flex',
          gap: '20px',
          overflowX: 'auto',
          paddingBottom: '20px',
        }}>
          {/* Card 1 - Промпт */}
          <div style={{
            minWidth: '240px',
            height: '380px',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(50px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '30px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute',
              bottom: '20px',
              left: '20px',
              fontFamily: 'Inter',
              fontWeight: 800,
              fontSize: '24px',
              color: 'white',
            }}>
              ПРОМПТ
            </div>
          </div>

          {/* Card 2 - Академия */}
          <div style={{
            minWidth: '240px',
            height: '380px',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(50px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '30px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute',
              bottom: '20px',
              left: '20px',
              fontFamily: 'Inter',
              fontWeight: 800,
              fontSize: '24px',
              color: 'white',
            }}>
              АКАДЕМИЯ
            </div>
          </div>

          {/* Card 3 - Лаба */}
          <div style={{
            minWidth: '240px',
            height: '380px',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(50px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '30px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute',
              bottom: '20px',
              left: '20px',
              fontFamily: 'Inter',
              fontWeight: 800,
              fontSize: '24px',
              color: 'white',
            }}>
              ЛАБА
            </div>
          </div>

          {/* Card 4 - Полигон */}
          <div style={{
            minWidth: '240px',
            height: '380px',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(50px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '30px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute',
              bottom: '20px',
              left: '20px',
              fontFamily: 'Inter',
              fontWeight: 800,
              fontSize: '24px',
              color: 'white',
            }}>
              ПОЛИГОН
            </div>
          </div>
        </div>

        {/* Блок подписки */}
        <div style={{
          position: 'absolute',
          left: '80px',
          top: '1017px',
          width: '1020px',
          height: '1316px',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(50px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '30px',
          overflow: 'hidden',
        }}>
          {/* Title - МЕТАФЛОРА* подписка (Property from 7:252) */}
          <div style={{
            position: 'absolute',
            left: '24px',
            top: '65px',
            width: '972px',
            height: '160px',
            fontFamily: 'Inter',
            fontWeight: 800,
            fontSize: '80px',
            textAlign: 'center',
            color: 'white',
            lineHeight: '1.1',
          }}>
            МЕТАФЛОРА* подписка
          </div>

          {/* Description - (Property from 26:409) */}
          <div style={{
            position: 'absolute',
            left: '60px',
            top: '245px',
            width: '900px',
            fontFamily: 'TT Commons',
            fontWeight: 300,
            fontSize: '35px',
            color: 'white',
            textAlign: 'center',
            lineHeight: '1.2',
          }}>
            МЕТАФЛОРА* подписка даст вам доступ ко всем блокам обучения, материалам, каналам и чатам сообщества
          </div>

          {/* List of items - (Placeholder for 7:212) */}
          <div style={{
            position: 'absolute',
            left: '60px',
            top: '280px',
            width: '900px',
            display: 'flex',
            flexDirection: 'column',
            gap: '30px',
          }}>
            {/* We'll refine this once more details are provided */}
          </div>

          {/* Button - оформить полный доступ (Property from 7:214) */}
          <button
            onClick={() => navigate('/pricing')}
            style={{
              position: 'absolute',
              left: '64px',
              top: '1112px',
              width: '892px',
              height: '140px',
              border: '4px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '62px',
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              overflow: 'hidden',
            }}
          >
            <img 
              src={payButtonBg}
              alt=""
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'fill',
                pointerEvents: 'none',
              }}
            />
            <div style={{
              position: 'relative',
              zIndex: 1,
              fontFamily: 'Gotham Pro',
              fontWeight: 500,
              fontSize: '40px',
              color: 'white',
              textAlign: 'center',
            }}>
              оформить полный доступ
            </div>
          </button>
        </div>

        {/* Footer */}
        <div style={{
          position: 'absolute',
          left: 'calc(50% - 5px)',
          top: '2400px',
          transform: 'translateX(-50%)',
          width: '888px',
          height: '124px',
        }}>
          {/* Logo Footer */}
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
          
          {/* Copyright */}
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
            color: 'white',
          }}>
            <p style={{ margin: 0, lineHeight: 'normal', whiteSpace: 'pre-wrap' }}>
              Copyright © Все права защищены.
            </p>
          </div>
          
          {/* Socials Container */}
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
          
          {/* Socials Icons */}
          <div style={{
            position: 'absolute',
            left: '681px',
            top: '13px',
            width: '196px',
            height: '51px',
          }}>
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
