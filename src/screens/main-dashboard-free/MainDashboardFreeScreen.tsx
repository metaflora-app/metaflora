import React from 'react';
import { useNavigate } from 'react-router-dom';

// Images
import bgPattern from '../../assets/figma-welcome/pattern.png';
import logoSmall from '../../assets/figma-welcome/logo-small.png';
import logoFooter from '../../assets/figma-welcome/logo-footer.png';
import socialsIcons from '../../assets/welcome-elements/socials-icons.png';
import supportButton from '../../assets/tour-video/support-button.png';
import payButtonBg from '../../assets/demo-access-elements/кнопка оплатить полный доступ.png';
import bigLogo from '../../assets/demo-access-elements/лого большое в экране демо.png';
import exitArrow from '../../assets/tour-video/exit-arrow.png';

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

        {/* Карточка сервиса (составная) */}
        <div style={{
          position: 'absolute',
          left: '141px',
          top: '536px',
          width: '894px',
          height: '249px',
        }}>
          {/* Левая часть - черная карточка с описанием */}
          <div style={{
            position: 'absolute',
            left: 0,
            top: '5px',
            width: '445px',
            height: '244px',
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

          {/* Правая верхняя часть - фоновое изображение */}
          <div style={{
            position: 'absolute',
            left: '449px',
            top: '5px',
            width: '445px',
            height: '119px',
            borderRadius: '26px',
            overflow: 'hidden',
          }}>
            {/* Placeholder for background image - will use Figma asset */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }} />
          </div>

          {/* Правая нижняя часть - темная карточка со стрелкой */}
          <div style={{
            position: 'absolute',
            left: '449px',
            top: '130px',
            width: '445px',
            height: '119px',
            backdropFilter: 'blur(50px)',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '30px',
            overflow: 'clip',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {/* Стрелка вправо */}
            <div style={{
              fontSize: '60px',
              color: 'white',
            }}>
              →
            </div>
          </div>

          {/* Плашка "демо-курс" */}
          <div style={{
            position: 'absolute',
            left: '297px',
            top: '19px',
            width: '120px',
            height: '26px',
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

          {/* Текст под кнопкой (7:220) */}
          <div style={{
            position: 'absolute',
            left: '153px',
            top: '686px',
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
        </div>

        {/* Фон под карточку подписки (26:411) */}
        <div style={{
          position: 'absolute',
          left: '141px',
          top: '853px',
          width: '894px',
          height: '275px',
          borderRadius: '30px',
          overflow: 'hidden',
        }}>
          {/* Placeholder for background image - will use Figma asset */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, #4c1d95 0%, #1e1b4b 100%)',
          }} />
        </div>

        {/* Блок подписки - белая подложка (26:410) */}
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
          overflow: 'clip',
        }} />

        {/* Большое лого (25:383) */}
        <img 
          src={bigLogo}
          alt="МЕТАФЛОРА*"
          style={{
            position: 'absolute',
            left: '45px',
            top: '1209px',
            width: '1090px',
            height: '814px',
            objectFit: 'contain',
          }}
        />

        {/* Кнопка "оплатить полный доступ" (7:237) */}
        <button
          onClick={() => navigate('/pricing')}
          style={{
            position: 'absolute',
            left: '144px',
            top: '1375px',
            width: '887px',
            height: '140px',
            backdropFilter: 'blur(50px)',
            background: 'rgba(0, 0, 0, 0.9)',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '62px',
            overflow: 'clip',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
          }}
        >
          {/* Gradient colors */}
          <div style={{
            position: 'absolute',
            left: '119px',
            top: '-207.51px',
            width: '700px',
            height: '560px',
            pointerEvents: 'none',
          }}>
            <div style={{
              position: 'absolute',
              left: '4px',
              top: '18px',
              width: '616.211px',
              height: '423.343px',
              background: '#fa002d',
              borderRadius: '1568.563px',
            }} />
            <div style={{
              position: 'absolute',
              left: '158.08px',
              top: '4px',
              width: '546.918px',
              height: '309.527px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <div style={{
                width: '302.053px',
                height: '354.544px',
                background: '#f0d825',
                borderRadius: '1568.563px',
                transform: 'rotate(11.218deg) skewX(330.934deg)',
              }} />
            </div>
            <div style={{
              position: 'absolute',
              left: '280.8px',
              top: '280.55px',
              width: '339.354px',
              height: '286.961px',
              background: '#d5fc44',
              borderRadius: '1568.563px',
            }} />
          </div>
          <div style={{
            position: 'relative',
            zIndex: 1,
            fontFamily: 'Gotham Pro',
            fontWeight: 500,
            fontSize: '40px',
            color: 'white',
            textAlign: 'center',
            width: '527px',
          }}>
            оплатить полный доступ
          </div>
        </button>

        {/* Текст под кнопкой - "вы будете перенаправлены" (7:220) */}
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
