import React from 'react';
import { useNavigate } from 'react-router-dom';

// Images
import bgPattern from '../../assets/figma-welcome/pattern.png';
import logoSmall from '../../assets/figma-welcome/logo-small.png';
import logoFooter from '../../assets/figma-welcome/logo-footer.png';
import socialsIcons from '../../assets/welcome-elements/socials-icons.png';
import supportButton from '../../assets/tour-video/support-button.png';
import bigLogo from '../../assets/demo-access-elements/лого большое в экране демо.png';
import exitArrow from '../../assets/tour-video/exit-arrow.png';
import beaverAvatar from '../../assets/main-dashboard/бобер.png';
import metacoinIcon from '../../assets/main-dashboard/кружок подарки.png';
import cardBackground from '../../assets/main-dashboard/фон под карточку.png';
import buttonBackground from '../../assets/main-dashboard/фон под кнопкой перейти.png';
import topUpButton from '../../assets/main-dashboard/кнопка пополнить.png';
import payButton from '../../assets/main-dashboard/оплатить полный доступ поменьше.png';
import goButton from '../../assets/main-dashboard/кнопка перейти.png';

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

        {/* Кнопка "выход" */}
        <img 
          src={exitArrow}
          alt="назад"
          onClick={() => navigate('/demo-access')}
          style={{
            position: 'absolute',
            left: '88px',
            top: '75px',
            width: '100px',
            height: '100px',
            cursor: 'pointer',
          }}
        />

        {/* Приветствие "неопознанный бобёр" */}
        <div style={{
          position: 'absolute',
          left: '85px',
          top: '199px',
          width: '1020px',
          height: '80px',
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            fontFamily: 'Inter',
            fontWeight: 800,
            fontSize: '80px',
            lineHeight: 0,
            color: 'white',
          }}>
            <p style={{ margin: 0, lineHeight: '1' }}>неопознанный бобёр</p>
          </div>
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
          <img 
            src={beaverAvatar}
            alt="бобёр"
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '159px',
              height: '159px',
            }}
          />

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

          {/* Иконка метакоинов - круг (26:430 / 7:253) */}
          <div style={{
            position: 'absolute',
            left: '545px',
            top: '5px',
            width: '159px',
            height: '159px',
            borderRadius: '80px',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            overflow: 'hidden',
          }}>
            <img 
              src={metacoinIcon}
              alt="метакоины"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </div>

          {/* Текст "150 метакоинов" - Gotham Pro Bold (26:431) */}
          <div style={{
            position: 'absolute',
            left: '678px',
            top: '35px',
            width: '347px',
            height: '45px',
            fontFamily: 'Gotham Pro',
            fontWeight: 700,
            fontSize: '45px',
            lineHeight: 0,
            color: 'white',
            whiteSpace: 'nowrap',
          }}>
            <p style={{ margin: 0, lineHeight: '1' }}>150 метакоинов</p>
          </div>

          {/* Кнопка "пополнить" - PNG */}
          <img 
            src={topUpButton}
            alt="пополнить"
            style={{
              position: 'absolute',
              left: '679px',
              top: '87px',
              width: '176px',
              height: '57px',
              cursor: 'pointer',
            }}
          />
        </div>

        {/* Карточка сервиса (составная) - 894×249px */}
        <div style={{
          position: 'absolute',
          left: '141px',
          top: '536px',
          width: '894px',
          height: '249px',
        }}>
          {/* 1. ЛЕВАЯ половина - фон под кнопкой (26:417) */}
          <div style={{
            position: 'absolute',
            inset: '2.01% 49.78% 1.2% 0',
          }}>
            <img 
              src={buttonBackground}
              alt=""
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '26px',
              }}
            />
          </div>

          {/* 2. ПРАВАЯ половина - черная карточка с текстом (26:416) */}
          <div style={{
            position: 'absolute',
            inset: '2.01% 0 0 50.22%',
            backdropFilter: 'blur(50px)',
            background: 'black',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '30px',
            overflow: 'clip',
          }}>
            <div style={{
              position: 'absolute',
              inset: '8.43% 4% 8.43% 4%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              fontFamily: 'Gotham Pro',
              fontWeight: 300,
              fontSize: '23px',
              lineHeight: '1.1',
              color: 'white',
              textAlign: 'center',
            }}>
              <p style={{ margin: 0 }}>
                Курс «Система» — про то, как выстраивать процессы, а не тушить пожары. Ты собираешь понятную логику: цель → действия → результат, без хаоса и лишних шагов. На выходе — рабочая система, которую можно повторять и масштабировать.
              </p>
            </div>
          </div>

          {/* 3. Кнопка перейти (26:418) - PNG */}
          <img 
            src={goButton}
            alt="перейти"
            onClick={() => navigate('/about-prompt')}
            style={{
              position: 'absolute',
              left: '96px',
              top: '87px',
              width: '257px',
              height: '73px',
              cursor: 'pointer',
            }}
          />

          {/* 4. Шторка вправо (7:233) - затемнение поверх */}
          <div style={{
            position: 'absolute',
            inset: '0 0 0 63.07%',
            backdropFilter: 'blur(50px)',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '30px',
            overflow: 'clip',
            pointerEvents: 'none',
          }}>
            {/* Стрелка */}
            <div style={{
              position: 'absolute',
              left: '121.18px',
              top: '121px',
              width: '80px',
              height: '0px',
            }}>
              <div style={{
                position: 'absolute',
                inset: '-14.73px -2.5% 0 0',
              }}>
                {/* Arrow icon placeholder */}
                <div style={{
                  width: '100%',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '40px',
                  color: 'white',
                }}>
                  →
                </div>
              </div>
            </div>
          </div>

          {/* 5. Плашка "демо-курс" (26:415) - поверх всего */}
          <div style={{
            position: 'absolute',
            inset: '7.63% 51.12% 77.91% 33.33%',
            backdropFilter: 'blur(50px)',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '62px',
            overflow: 'clip',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{
              fontFamily: 'Gotham Pro',
              fontWeight: 500,
              fontSize: '18px',
              color: 'white',
            }}>
              демо-курс
            </div>
          </div>
        </div>

        {/* Фон под карточку подписки (26:411) */}
        <img 
          src={cardBackground}
          alt=""
          style={{
            position: 'absolute',
            left: '141px',
            top: '853px',
            width: '894px',
            height: '275px',
            objectFit: 'cover',
            borderRadius: '30px',
          }}
        />

        {/* Белая подложка подписки (26:410) */}
        <div style={{
          position: 'absolute',
          left: '144px',
          top: '847px',
          width: '893px',
          height: '1196px',
          backdropFilter: 'blur(50px)',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '4px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '30px',
        }} />

        {/* Большое лого (25:383) - ПОД белой подложкой */}
        <img 
          src={bigLogo}
          alt="МЕТАФЛОРА*"
          style={{
            position: 'absolute',
            left: '35px',
            top: '1209px',
            width: '1090px',
            height: '814px',
            objectFit: 'contain',
          }}
        />

        {/* Белая подложка подписки (26:410) - ПОВЕРХ лого */}
        <div style={{
          position: 'absolute',
          left: '144px',
          top: '847px',
          width: '893px',
          height: '1196px',
          backdropFilter: 'blur(50px)',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '4px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '30px',
        }} />

        {/* Кнопка "оплатить полный доступ" - PNG (7:237) */}
        <img 
          src={payButton}
          alt="оплатить полный доступ"
          onClick={() => navigate('/pricing')}
          style={{
            position: 'absolute',
            left: '144px',
            top: '1375px',
            width: '887px',
            height: '140px',
            objectFit: 'fill',
            cursor: 'pointer',
          }}
        />

        {/* Текст под кнопкой "вы будете перенаправлены" (7:220) */}
        <div style={{
          position: 'absolute',
          left: '297px',
          top: '1533px',
          width: '586px',
          height: '64px',
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            fontFamily: 'Gotham Pro',
            fontSize: '32px',
            lineHeight: '1.1',
            color: 'white',
            textAlign: 'center',
          }}>
            <p style={{ margin: 0, fontWeight: 300 }}>вы будете перенаправлены </p>
            <p style={{ margin: 0 }}>
              <span style={{ fontWeight: 300 }}>на страницу </span>
              <span style={{ fontWeight: 700 }}>с выбором подписки</span>
            </p>
          </div>
        </div>


        {/* Footer */}
        <div style={{
          position: 'absolute',
          left: 'calc(50% - 5px)',
          top: '2071px',
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
