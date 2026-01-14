import React from 'react';
import { useNavigate } from 'react-router-dom';

// Images
import bgPattern from '../../assets/figma-welcome/pattern.png';
import logoSmall from '../../assets/figma-welcome/logo-small.png';
import logoFooter from '../../assets/figma-welcome/logo-footer.png';
import socialsIcons from '../../assets/welcome-elements/socials-icons.png';
import exitArrow from '../../assets/tour-video/exit-arrow.png';
import videoThumbnail from '../../assets/tour-video/video-thumbnail.png';
import pauseIcon from '../../assets/tour-video/pause-icon.png';
import playIcon from '../../assets/tour-video/play-icon.png';
import expandIcon from '../../assets/tour-video/expand-icon.png';
import supportButton from '../../assets/tour-video/support-button.png';
import tryButtonBg from '../../assets/tour-video/try-button-bg.png';

export const TourVideoScreen: React.FC = () => {
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
          onClick={() => navigate('/welcome')}
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

        {/* Заголовок "экскурсия по платформе за 2 минуты" */}
        <div style={{
          position: 'absolute',
          left: '92px',
          top: '197px',
          width: '1027px',
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
            lineHeight: 0,
            color: 'white',
          }}>
            <p style={{ 
              margin: 0,
              lineHeight: '80px',
              whiteSpace: 'pre-wrap',
            }}>
              экскурсия по платформе{'\n'}за 2 минуты
            </p>
          </div>
        </div>

        {/* ВИДЕО БЛОК */}
        <div style={{
          position: 'absolute',
          left: '142px',
          top: '401px',
          width: '891px',
          height: '1457px',
        }}>
          {/* Фоновое изображение видео */}
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '40px',
          }}>
            <img 
              src={videoThumbnail}
              alt="Видео обзор"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '40px',
                maxWidth: 'none',
                pointerEvents: 'none',
              }}
            />
          </div>

          {/* Blur слой на видео */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backdropFilter: 'blur(50px)',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '30px',
            overflow: 'clip',
          }} />

          {/* Кнопка плей */}
          <div style={{
            position: 'absolute',
            top: '42.48%',
            right: '44.33%',
            bottom: '50.79%',
            left: '44.67%',
            backdropFilter: 'blur(50px)',
            background: 'rgba(0, 0, 0, 0.1)',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '62px',
            overflow: 'clip',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {/* Иконка плей - 100% размера круга */}
            <img 
              src={playIcon}
              alt="плей"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
          </div>

          {/* Кнопка стоп (пауза) */}
          <div style={{
            position: 'absolute',
            top: '49.97%',
            right: '44.22%',
            bottom: '43.31%',
            left: '44.78%',
            backdropFilter: 'blur(50px)',
            background: 'rgba(0, 0, 0, 0.1)',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '62px',
            overflow: 'clip',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {/* Иконка паузы - 100% размера круга */}
            <img 
              src={pauseIcon}
              alt="стоп"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
          </div>

          {/* Кнопка развернуть видео */}
          <div style={{
            position: 'absolute',
            top: '93.89%',
            right: '1.57%',
            bottom: '1.17%',
            left: '90.35%',
            backdropFilter: 'blur(50px)',
            background: 'rgba(0, 0, 0, 0.1)',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '62px',
            overflow: 'clip',
            cursor: 'pointer',
          }}>
            {/* Иконка развернуть */}
            <div style={{
              position: 'absolute',
              left: '11px',
              top: '11px',
              width: '42px',
              height: '42px',
            }}>
              <div style={{
                position: 'absolute',
                inset: 0,
                overflow: 'hidden',
                pointerEvents: 'none',
              }}>
                <img 
                  src={expandIcon}
                  alt="развернуть"
                  style={{
                    position: 'absolute',
                    height: '288.46%',
                    left: '-164.28%',
                    top: '-99.18%',
                    width: '431.44%',
                    maxWidth: 'none',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Кнопка "попробовать бесплатно" (с градиентом) */}
        <button
          onClick={() => navigate('/demo-access')}
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
          {/* PNG кнопка с градиентом под текстом */}
          <img 
            src={tryButtonBg}
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
            попробовать бесплатно
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
