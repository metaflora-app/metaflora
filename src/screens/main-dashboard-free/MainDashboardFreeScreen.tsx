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

        {/* Блок баланса */}
        <div style={{
          position: 'absolute',
          left: '80px',
          top: '357px',
          width: '1020px',
          height: '160px',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(50px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '30px',
          display: 'flex',
          alignItems: 'center',
          paddingLeft: '40px',
          fontFamily: 'Inter',
          fontWeight: 800,
          fontSize: '40px',
          color: 'white',
        }}>
          ваш баланс: 0 МЕТАКОИНОВ*
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
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
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
