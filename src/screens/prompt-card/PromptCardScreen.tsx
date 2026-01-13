import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Images
import bgPattern from '../../assets/figma-welcome/pattern.png';
import logoSmall from '../../assets/figma-welcome/logo-small.png';
import logoFooter from '../../assets/figma-welcome/logo-footer.png';
import socialsIcons from '../../assets/welcome-elements/socials-icons.png';
import exitArrow from '../../assets/tour-video/exit-arrow.png';
import supportButton from '../../assets/tour-video/support-button.png';
import peopleLogo from '../../assets/about-screens/лого люди на фон.png';

// New PNG assets from Desktop
import promptImage from '../../assets/prompt-card/фото для карточки промпта.png';
import promptBadge from '../../assets/prompt-card/промпт плашка.png';
import copyButton from '../../assets/prompt-card/кнопка скопировать.png';
import expandButton from '../../assets/prompt-card/кнопка развернуть.png';

export const PromptCardScreen: React.FC = () => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCopy = async () => {
    const text = "A close-up of a campfire burning intensely, flames dancing and flickering, the fire gradually fills the entire frame, warm orange glow.";
    try {
      await navigator.clipboard.writeText(text);
      alert('Промпт скопирован!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

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
          zIndex: 1,
        }} />

        {/* Большое лого на фоне - ПОД ВСЕМИ СЛОЯМИ */}
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
            zIndex: 0,
          }}
        />

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
            zIndex: 10,
          }}
        />

        {/* Логотип маленький */}
        <div style={{
          position: 'absolute',
          left: '500px',
          top: '61px',
          width: '186px',
          height: '131px',
          zIndex: 10,
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
            zIndex: 10,
          }}
        />

        {/* Заголовок */}
        <div style={{
          position: 'absolute',
          left: '94px',
          top: '197px',
          width: '1020px',
          height: '80px',
          display: 'flex',
          alignItems: 'center',
          fontFamily: 'Inter',
          fontWeight: 800,
          fontSize: '80px',
          color: 'white',
          zIndex: 10,
        }}>
          карточка промпта
        </div>

        {/* Описание под заголовком */}
        <div style={{
          position: 'absolute',
          left: '94px',
          top: '287px',
          width: '1020px',
          fontFamily: 'Gotham Pro',
          fontWeight: 300,
          fontSize: '24px',
          color: 'rgba(255, 255, 255, 0.8)',
          zIndex: 10,
        }}>
          <span style={{ fontWeight: 700 }}>описание:</span> создайте и настройте копирайтера за один промпт
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
          zIndex: 10,
        }}>
          {/* Фото для карточки промпта */}
          <img 
            src={promptImage}
            alt="Prompt"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '60%',
              objectFit: 'cover',
            }}
          />

          {/* Контент внутри карточки */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '40px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
          }}>
            {/* Заголовок "ИИ-копирайтер для блога" */}
            <div style={{
              fontFamily: 'Gotham Pro',
              fontWeight: 700,
              fontSize: '32px',
              color: 'white',
              textAlign: 'center',
              lineHeight: '1.2',
            }}>
              ИИ-копирайтер<br/>для блога
            </div>

            {/* Кнопка "промпт" плашка */}
            <img 
              src={promptBadge}
              alt="промпт"
              style={{
                width: 'auto',
                height: '40px',
                objectFit: 'contain',
              }}
            />

            {/* Текст промпта */}
            <div style={{
              width: '100%',
              fontFamily: 'Gotham Pro',
              fontWeight: 300,
              fontSize: '20px',
              lineHeight: '1.4',
              color: 'white',
              textAlign: 'center',
              maxHeight: isExpanded ? 'none' : '80px',
              overflow: 'hidden',
            }}>
              идея в том, чтобы в конце одного кадра был объект, похожий по форме или цвету на объект в начале следующего. Допустим, вы хотите перейти от сцены с костром к восходу солнца. Тогда в первом клипе огонь должен постепенно заполнить весь кадр: Допустим, вы хотите перейти от сцены с костром к восходу солнца. Тогда в первом
            </div>

            {/* Кнопка "развернуть +" */}
            {!isExpanded && (
              <img 
                src={expandButton}
                alt="развернуть"
                onClick={() => setIsExpanded(true)}
                style={{
                  cursor: 'pointer',
                  width: 'auto',
                  height: '30px',
                  objectFit: 'contain',
                }}
              />
            )}

            {/* Кнопка "скопировать" */}
            <img 
              src={copyButton}
              alt="скопировать"
              onClick={handleCopy}
              style={{
                cursor: 'pointer',
                width: 'auto',
                height: '50px',
                objectFit: 'contain',
              }}
            />
          </div>
        </div>

        {/* Теги под карточкой (32:837) */}
        <div style={{
          position: 'absolute',
          left: '143px',
          top: '1333px',
          width: '892px',
          display: 'flex',
          justifyContent: 'center',
          gap: '20px',
          flexWrap: 'wrap',
          zIndex: 10,
        }}>
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

        {/* Текст промпта под тегами (32:795) */}
        <div style={{
          position: 'absolute',
          left: '191px',
          top: '1433px',
          width: '800px',
          fontFamily: 'Gotham Pro',
          fontWeight: 300,
          fontSize: '35px',
          lineHeight: '1.2',
          color: 'white',
          textAlign: 'center',
          whiteSpace: 'pre-wrap',
          zIndex: 10,
        }}>
          A close-up of a campfire burning intensely, flames dancing and flickering, the fire gradually fills the entire frame, warm orange glow.
        </div>

        {/* Кнопки действий под текстом промпта */}
        <div style={{
          position: 'absolute',
          left: 'calc(50% - 267px)',
          top: '1553px',
          display: 'flex',
          gap: '20px',
          zIndex: 10,
        }}>
          {/* Кнопка Копировать */}
          <button 
            onClick={handleCopy}
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
            копировать
          </button>

          {/* Кнопка Попробовать (с красным градиентом) */}
          <button style={{
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

        {/* Футер */}
        <div style={{
          position: 'absolute',
          left: 'calc(50% - 5px)',
          top: '2071px',
          transform: 'translateX(-50%)',
          width: '888px',
          height: '124px',
          zIndex: 10,
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
