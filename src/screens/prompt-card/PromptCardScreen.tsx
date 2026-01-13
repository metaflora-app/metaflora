import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Images
import bgPattern from '../../assets/figma-welcome/pattern.png';
import logoSmall from '../../assets/figma-welcome/logo-small.png';
import logoFooter from '../../assets/figma-welcome/logo-footer.png';
import socialsIcons from '../../assets/welcome-elements/socials-icons.png';
import exitArrow from '../../assets/tour-video/exit-arrow.png';
import supportButton from '../../assets/tour-video/support-button.png';
import peopleLogo from '../../assets/about-screens/лого люди на фон.png';

export const PromptCardScreen: React.FC = () => {
  const navigate = useNavigate();
  // Calculate scale based on viewport width (design width: 1180px)
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;

  // Prompt text (pulled out so it's easy to copy/use)
  const promptText = `A close-up of a campfire burning intensely, flames dancing and flickering, the fire gradually fills the entire frame, warm orange glow.`;

  // Copy state for UI feedback
  const [copied, setCopied] = useState(false);

  const timeoutRef = useRef<number | null>(null);

  const handleCopy = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(promptText);
      } else {
        // fallback
        const ta = document.createElement('textarea');
        ta.value = promptText;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      // revert after 1.8s
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => {
        setCopied(false);
        timeoutRef.current = null;
      }, 1800);
    } catch (err) {
      // ignore - could show toast later
      // console.error('copy failed', err);
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

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
        {/* Background pattern */}
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

        {/* Header - Кнопка выход */}
        <img 
          src={exitArrow}
          alt="назад"
          onClick={() => navigate(-1)}
          style={{
            position: 'absolute',
            left: 'calc(50% - 452px)',
            top: '75px',
            width: '100px',
            height: '100px',
            cursor: 'pointer',
          }}
        />

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

        {/* Заголовок */}
        <div style={{
          position: 'absolute',
          left: '94px',
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
          карточка промпта
        </div>

        {/* Большая карточка с изображением (7:1937) */}
        <div style={{
          position: 'absolute',
          left: '143px',
          top: '401px',
          width: '892px',
          height: '892px',
          backdropFilter: 'blur(50px)',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '4px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '30px',
          overflow: 'hidden',
        }}>
          {/* Изображение будет здесь */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
          }} />
        </div>

        {/* Большое лого на фоне */}
        <img 
          src={peopleLogo}
          alt=""
          style={{
            position: 'absolute',
            left: '145px',
            top: '741px',
            width: '890px',
            height: '1166px',
            objectFit: 'contain',
            opacity: 0.5,
            pointerEvents: 'none',
          }}
        />

        {/* Контейнер для нижнего блока (Теги, Промпт, Кнопки) */}
        <div style={{
          position: 'absolute',
          left: '143px',
          top: '1333px',
          width: '892px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '40px',
        }}>
          {/* Блок тегов (32:837) */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '20px',
            flexWrap: 'wrap',
          }}>
            {/* Теги */}
            {['DALL-E 3', 'Вертикальный', 'HD'].map((tag, i) => (
              <div key={i} style={{
                padding: '10px 30px',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(50px)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '62px',
                fontFamily: 'Gotham Pro',
                fontWeight: 500,
                fontSize: '24px',
                color: 'white',
              }}>
                {tag}
              </div>
            ))}
          </div>

          {/* Текст промпта (32:778) */}
          <div style={{
            width: '800px',
            fontFamily: 'Gotham Pro',
            fontWeight: 300,
            fontSize: '35px',
            lineHeight: '1.2',
            color: 'white',
            textAlign: 'center',
            whiteSpace: 'pre-wrap',
          }}>
            {promptText}
            <span aria-live="polite" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}>
              {copied ? 'Скопировано' : ''}
            </span>
          </div>

          {/* Кнопки действий */}
          <div style={{
            display: 'flex',
            gap: '20px',
            marginTop: '20px',
          }}>
            {/* Кнопка Копировать */}
            <button
              onClick={handleCopy}
              aria-label="Копировать промпт"
              style={{
              width: '257px',
              height: '73px',
              background: 'rgba(0, 0, 0, 0.9)',
              backdropFilter: 'blur(50px)',
              border: '4px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '62px',
              padding: 0,
              position: 'relative',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'Gotham Pro',
              fontWeight: 500,
              fontSize: '27px',
              color: 'white',
            }}>
              {copied ? 'скопировано' : 'копировать'}
            </button>

            {/* Кнопка Попробовать (с красным градиентом) */}
            <button
              onClick={() => navigate('/prompt-first')}
              aria-label="Попробовать"
              style={{
              width: '257px',
              height: '73px',
              background: 'transparent',
              border: 'none',
              padding: 0,
              position: 'relative',
              cursor: 'pointer',
            }}>
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to right, #880709 0%, #e90004 52.404%, #880709 100%)',
                borderRadius: '62px',
                border: '4px solid rgba(255, 255, 255, 0.3)',
              }} />
              <div style={{
                position: 'relative',
                zIndex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'Gotham Pro',
                fontWeight: 500,
                fontSize: '27px',
                color: 'white',
                height: '100%',
              }}>
                попробовать
              </div>
            </button>
          </div>
        </div>

        {/* Футер */}
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
