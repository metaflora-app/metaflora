import React from 'react';
import { useNavigate } from 'react-router-dom';

// Images
import bgPattern from '../../assets/figma-welcome/pattern.png';
import logoSmall from '../../assets/figma-welcome/logo-small.png';
import logoFooter from '../../assets/figma-welcome/logo-footer.png';
import socialsIcons from '../../assets/welcome-elements/socials-icons.png';
import exitArrow from '../../assets/tour-video/exit-arrow.png';
import supportButton from '../../assets/tour-video/support-button.png';
import videoThumbnail from '../../assets/tour-video/video-thumbnail.png';
import playIcon from '../../assets/tour-video/play-icon.png';
import pauseIcon from '../../assets/tour-video/pause-icon.png';
import expandIcon from '../../assets/tour-video/expand-icon.png';

export const AboutPromptScreen: React.FC = () => {
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

        {/* Кнопка "выход" */}
        <img 
          src={exitArrow}
          alt="назад"
          onClick={() => navigate('/main-dashboard-free')}
          style={{
            position: 'absolute',
            left: 'calc(50% - 452px)',
            top: '75px',
            width: '100px',
            height: '100px',
            cursor: 'pointer',
          }}
        />

        {/* Иконка карт (7:66) */}
        <div style={{
          position: 'absolute',
          left: '205px',
          top: '81px',
          width: '65px',
          height: '65px',
        }}>
          {/* Placeholder for cards icon - цветок + карты */}
          <div style={{
            position: 'absolute',
            inset: 0,
            fontSize: '50px',
          }}>
            🃏
          </div>
        </div>

        {/* Логотип маленький */}
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

        {/* Заголовок "как устроена МЕТАФЛОРА* цех" (7:434) */}
        <div style={{
          position: 'absolute',
          left: '94px',
          top: '199px',
          width: '1020px',
          height: '160px',
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
            <p style={{ margin: 0, lineHeight: '1' }}>как устроена МЕТАФЛОРА* цех</p>
          </div>
        </div>

        {/* Видео блок (переиспользуется из tour-video) (24:245) */}
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
            overflow: 'hidden',
          }}>
            <img 
              src={videoThumbnail}
              alt=""
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </div>

          {/* Blur слой поверх видео */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backdropFilter: 'blur(50px)',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '30px',
            overflow: 'clip',
          }}>
            {/* Кнопка Play */}
            <div style={{
              position: 'absolute',
              left: 'calc(50% - 52px)',
              top: '621px',
              width: '100px',
              height: '100px',
              backdropFilter: 'blur(50px)',
              background: 'rgba(0, 0, 0, 0.1)',
              border: '4px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '62px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}>
              <img 
                src={playIcon}
                alt="play"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              />
            </div>

            {/* Кнопка Pause */}
            <div style={{
              position: 'absolute',
              left: 'calc(50% - 52px)',
              top: '731px',
              width: '100px',
              height: '100px',
              backdropFilter: 'blur(50px)',
              background: 'rgba(0, 0, 0, 0.1)',
              border: '4px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '62px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}>
              <img 
                src={pauseIcon}
                alt="pause"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              />
            </div>

            {/* Кнопка Expand */}
            <div style={{
              position: 'absolute',
              right: '14px',
              bottom: '17px',
              width: '64px',
              height: '64px',
              backdropFilter: 'blur(50px)',
              background: 'rgba(0, 0, 0, 0.1)',
              border: '4px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '62px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}>
              <img 
                src={expandIcon}
                alt="expand"
                style={{
                  width: '42px',
                  height: '42px',
                  objectFit: 'contain',
                }}
              />
            </div>
          </div>
        </div>

        {/* Кнопка "перейти к сервису" с фиолетово-зелёным градиентом (27:325) */}
        <button
          onClick={() => navigate('/prompt-first')}
          style={{
            position: 'absolute',
            left: 'calc(50% - 1px)',
            top: '1902px',
            transform: 'translateX(-50%)',
            width: '892px',
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
          {/* Фиолетово-зелёный градиент */}
          <div style={{
            position: 'absolute',
            left: '141px',
            top: '-207.51px',
            width: '700px',
            height: '560px',
            pointerEvents: 'none',
          }}>
            {/* Фиолетовый круг */}
            <div style={{
              position: 'absolute',
              left: '4px',
              top: '18px',
              width: '575.775px',
              height: '423.343px',
              background: '#814cf3',
              borderRadius: '1568.563px',
            }} />
            {/* Зелёный круг (средний) */}
            <div style={{
              position: 'absolute',
              left: '147.97px',
              top: '4px',
              width: '511.029px',
              height: '309.527px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <div style={{
                width: '283.008px',
                height: '343.114px',
                background: '#d5fc44',
                borderRadius: '1568.563px',
                transform: 'rotate(11.984deg) skewX(332.71deg)',
              }} />
            </div>
            {/* Зелёный круг (правый) */}
            <div style={{
              position: 'absolute',
              left: '262.64px',
              top: '280.55px',
              width: '317.086px',
              height: '286.961px',
              background: '#d5fc44',
              borderRadius: '1568.563px',
            }} />
          </div>
          {/* Текст кнопки (7:444) */}
          <div style={{
            position: 'relative',
            zIndex: 1,
            fontFamily: 'Gotham Pro',
            fontWeight: 500,
            fontSize: '40px',
            color: 'white',
            textAlign: 'center',
          }}>
            перейти к сервису
          </div>
        </button>

        {/* Футер */}
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
