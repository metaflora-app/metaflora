import React from 'react';
import { useNavigate } from 'react-router-dom';

// Images
import bgPattern from '../../assets/figma-welcome/pattern.png';
import logoSmall from '../../assets/figma-welcome/logo-small.png';
import logoFooter from '../../assets/figma-welcome/logo-footer.png';
import socialsIcons from '../../assets/welcome-elements/socials-icons.png';
import exitArrow from '../../assets/tour-video/exit-arrow.png';
import supportButton from '../../assets/tour-video/support-button.png';
import bigLogo from '../../assets/demo-access-elements/лого большое в экране демо.png';
import checkIcon from '../../assets/demo-access-elements/иконка что включено в демо.png';
import crossIcon from '../../assets/demo-access-elements/иконка что не включено в демо.png';
import payButtonBg from '../../assets/demo-access-elements/кнопка оплатить полный доступ.png';

export const DemoAccessScreen: React.FC = () => {
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

        {/* Кнопка "выход" (стрелка назад) - готовая PNG */}
        <img 
          src={exitArrow}
          alt="назад"
          onClick={() => navigate('/tour-video')}
          style={{
            position: 'absolute',
            left: 'calc(50% - 452px)',
            top: '75px',
            width: '100px',
            height: '100px',
            cursor: 'pointer',
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

        {/* Заголовок "что входит в ваш демо-доступ" */}
        <div style={{
          position: 'absolute',
          left: '99px',
          top: '197px',
          width: '1020px',
          height: '160px',
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            fontFamily: 'Inter',
            fontWeight: 800,
            fontSize: '80px',
            lineHeight: '1',
            color: 'white',
            whiteSpace: 'pre-wrap',
          }}>
            <p style={{ marginBottom: 0 }}>что входит в ваш </p>
            <p style={{ margin: 0 }}>демо-доступ</p>
          </div>
        </div>

        {/* Иконка галочка (что включено) - готовая PNG */}
        <img 
          src={checkIcon}
          alt="✓"
          style={{
            position: 'absolute',
            left: 'calc(50% - 438px)',
            top: '459px',
            transform: 'translateX(-50%)',
            width: '98px',
            height: '98px',
          }}
        />

        {/* Текст "курс на 4 урока..." */}
        <div style={{
          position: 'absolute',
          left: '242px',
          top: '427px',
          width: '804px',
          height: '160px',
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            fontSize: '40px',
            lineHeight: '1',
            color: 'white',
            whiteSpace: 'pre-wrap',
          }}>
            <p style={{ marginBottom: 0 }}>
              <span style={{ fontFamily: 'Gotham Pro', fontWeight: 300 }}>курс на 4 урока из блоков </span>
              <span style={{ fontFamily: 'Gotham Pro', fontWeight: 700 }}>МЕТАФЛОРА* академия:</span>
              <span style={{ fontFamily: 'Gotham Pro', fontWeight: 300 }}> «система», «искусство», «промптинг» </span>
            </p>
            <p style={{ margin: 0, fontFamily: 'Gotham Pro', fontWeight: 300 }}>и «автоматизация»</p>
          </div>
        </div>

        {/* Иконка крестик (что не включено) - готовая PNG */}
        <img 
          src={crossIcon}
          alt="✗"
          style={{
            position: 'absolute',
            left: 'calc(50% - 439px)',
            top: '701px',
            transform: 'translateX(-50%)',
            width: '98px',
            height: '98px',
          }}
        />

        {/* Текст "без доступа к..." (5 строк) */}
        <div style={{
          position: 'absolute',
          left: '244px',
          top: '648px',
          width: '845px',
          height: '200px',
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            fontSize: '40px',
            lineHeight: '1',
            color: 'white',
            whiteSpace: 'pre-wrap',
          }}>
            <p style={{ marginBottom: 0 }}>
              <span style={{ fontFamily: 'Gotham Pro', fontWeight: 300 }}>без доступа </span>
              <span style={{ fontFamily: 'Gotham Pro', fontWeight: 700 }}>к </span>
              <span style={{ fontFamily: 'Gotham Pro', fontWeight: 700 }}>МЕТАФЛОРА* академия</span>
            </p>
            <p style={{ marginBottom: 0 }}>
              <span style={{ fontFamily: 'Gotham Pro', fontWeight: 300 }}>без доступа </span>
              <span style={{ fontFamily: 'Gotham Pro', fontWeight: 700 }}>к МЕТАФЛОРА* лаба</span>
            </p>
            <p style={{ marginBottom: 0 }}>
              <span style={{ fontFamily: 'Gotham Pro', fontWeight: 300 }}>без доступа </span>
              <span style={{ fontFamily: 'Gotham Pro', fontWeight: 700 }}>к МЕТАФЛОРА* цех</span>
            </p>
            <p style={{ marginBottom: 0 }}>
              <span style={{ fontFamily: 'Gotham Pro', fontWeight: 300 }}>без доступа </span>
              <span style={{ fontFamily: 'Gotham Pro', fontWeight: 700 }}>к </span>
              <span style={{ fontFamily: 'Gotham Pro', fontWeight: 700 }}>МЕТАФЛОРА* полигон</span>
            </p>
            <p style={{ margin: 0 }}>
              <span style={{ fontFamily: 'Gotham Pro', fontWeight: 300 }}>без доступа </span>
              <span style={{ fontFamily: 'Gotham Pro', fontWeight: 700 }}>к тг-чату МЕТАФЛОРЫ*</span>
            </p>
          </div>
        </div>

        {/* Большое лого */}
        <img 
          src={bigLogo}
          alt="МЕТАФЛОРА*"
          style={{
            position: 'absolute',
            left: '45px',
            top: '884px',
            width: '1090px',
            height: '814px',
            objectFit: 'contain',
          }}
        />

        {/* Кнопка "продолжить" (прозрачная) */}
        <button
          onClick={() => navigate('/main-dashboard-free')}
          style={{
            position: 'absolute',
            left: 'calc(50% - 1px)',
            top: '1744px',
            transform: 'translateX(-50%)',
            width: '892px',
            height: '139px',
            backdropFilter: 'blur(50px)',
            background: 'transparent',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '62px',
            overflow: 'clip',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{
            fontFamily: 'Gotham Pro',
            fontWeight: 500,
            fontSize: '40px',
            color: 'white',
            textAlign: 'center',
          }}>
            продолжить
          </div>
        </button>

        {/* Кнопка "оплатить полный доступ" (с КРАСНЫМ градиентом) */}
        <button
          onClick={() => navigate('/pricing')}
          style={{
            position: 'absolute',
            left: 'calc(50% - 1px)',
            top: '1902px',
            transform: 'translateX(-50%)',
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
          {/* PNG кнопка с красным градиентом под текстом */}
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
            оплатить полный доступ
          </div>
        </button>

        {/* Футер (лого + copyright + соцсети) */}
        <div style={{
          position: 'absolute',
          left: 'calc(50% - 5px)',
          top: '2071px',
          transform: 'translateX(-50%)',
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
