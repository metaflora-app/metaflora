import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Images
import bgPattern from '../../assets/figma-welcome/pattern.png';
import logoSmall from '../../assets/figma-welcome/logo-small.png';
import exitArrow from '../../assets/tour-video/exit-arrow.png';

// Figma assets from node 7:1879
const houseImage = "https://www.figma.com/api/mcp/asset/85e39ff4-6bb7-48a6-8c5f-f40122832e61";
const logoFooterImg = "https://www.figma.com/api/mcp/asset/ef06372f-ae71-40e7-bc6c-dcb61adf39d8";
const socialsImg = "https://www.figma.com/api/mcp/asset/f7251028-ceda-4d2b-a148-5d79b505976a";
const threeLogoImg = "https://www.figma.com/api/mcp/asset/fcac25b3-9f39-4ac3-8254-9a5dcc88da3b";

// Local PNG assets from repo
import promptBadge from '../../assets/prompt-card/промпт плашка.png';
import copyButton from '../../assets/prompt-card/кнопка скопировать.png';
import homeIcon from '../../assets/about-screens/домой.png';
import supportButton from '../../assets/tour-video/support-button.png';

export const PromptCardScreen: React.FC = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const promptText = 'идея в том, чтобы в конце одного кадра был объект, похожий по форме или цвету на объект в начале следующего. Допустим, вы хотите перейти от сцены с костром к восходу солнца. Тогда в первом клипе огонь должен постепенно заполнить весь кадр: Допустим, вы хотите перейти от сцены с костром к восходу солнца. Тогда в первом';

  const handleCopy = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(promptText);
      } else {
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
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => {
        setCopied(false);
        timeoutRef.current = null;
      }, 1800);
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;

  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      minHeight: '100vh',
      background: '#020101',
      overflow: 'hidden',
    }}>
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

        {/* Background logo (три человека) */}
        <div style={{
          position: 'absolute',
          left: '147px',
          top: '1289px',
          width: '886px',
          height: '474px',
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            pointerEvents: 'none',
          }}>
            <img 
              src={threeLogoImg}
              alt=""
              style={{
                position: 'absolute',
                height: '222.88%',
                left: '-39.72%',
                top: '-55.58%',
                width: '179.18%',
                maxWidth: 'none',
              }}
            />
          </div>
        </div>

        {/* 7:1936 - Заголовок "карточка промпта" */}
        <div style={{
          position: 'absolute',
          left: '85px',
          top: '193px',
          width: '1020px',
          height: '80px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          fontFamily: 'Inter',
          fontWeight: 800,
          fontSize: '80px',
          lineHeight: 1,
          color: 'white',
        }}>
          <p style={{ margin: 0, lineHeight: 1 }}>карточка промпта</p>
        </div>

        {/* 7:1937 - Описание */}
        <div style={{
          position: 'absolute',
          left: '85px',
          top: '290px',
          width: '668px',
          height: '80px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          fontFamily: 'Gotham Pro',
          fontSize: '40px',
          lineHeight: 1,
          color: 'white',
        }}>
          <p style={{ margin: 0, lineHeight: 1 }}>
            <span style={{ fontWeight: 700 }}>описание:</span>
            <span style={{ fontWeight: 300 }}> создайте и настройте копирайтера за один промпт</span>
          </p>
        </div>

        {/* Back button */}
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

        {/* Home button */}
        <img 
          src={homeIcon}
          alt="домой"
          onClick={() => navigate('/main-dashboard-premium')}
          style={{
            position: 'absolute',
            left: 'calc(50% - 352px)',
            top: '75px',
            width: '100px',
            height: '100px',
            cursor: 'pointer',
          }}
        />

        {/* Logo */}
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

        {/* Support button */}
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

        {/* Main card background */}
        <div style={{
          position: 'absolute',
          left: 'calc(50% + 1px)',
          top: '399px',
          width: '888px',
          height: '1643px',
          transform: 'translateX(-50%)',
          backdropFilter: 'blur(50px)',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '4px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '30px',
        }} />

        {/* Inner black card */}
        <div style={{
          position: 'absolute',
          left: '198px',
          top: '452px',
          width: '784px',
          height: '1536px',
          backdropFilter: 'blur(50px)',
          background: 'black',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '30px',
        }} />

        {/* House image */}
        <div style={{
          position: 'absolute',
          left: '198px',
          top: '452px',
          width: '784px',
          height: '771px',
          border: '2px solid rgba(0, 0, 0, 0.3)',
          borderRadius: '30px',
          overflow: 'hidden',
        }}>
          <img 
            src={houseImage}
            alt=""
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* 32:795 - "ИИ-копирайтер для блога" */}
        <div style={{
          position: 'absolute',
          left: '384px',
          top: '1223px',
          width: '414px',
          height: '191px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          fontFamily: 'Inter',
          fontWeight: 700,
          fontSize: '52px',
          lineHeight: 1.2,
          color: 'white',
          textAlign: 'center',
        }}>
          <p style={{ margin: 0, lineHeight: 1.2 }}>ИИ-копирайтер</p>
          <p style={{ margin: 0, lineHeight: 1.2 }}>для блога</p>
        </div>

        {/* Prompt badge */}
        <img 
          src={promptBadge}
          alt="промпт"
          style={{
            position: 'absolute',
            left: '447px',
            top: '1398px',
            width: '257px',
            height: '73px',
            objectFit: 'contain',
          }}
        />

        {/* 32:813 - Наборный текст с overflow scroll - поднят выше */}
        <div style={{
          position: 'absolute',
          left: '257px',
          top: '1450px',
          width: '666px',
          height: '320px',
          fontFamily: 'Gotham Pro',
          fontWeight: 300,
          fontSize: '35px',
          lineHeight: 1.2,
          color: 'white',
          textAlign: 'center',
          overflow: 'auto',
        }}>
          <p style={{ margin: 0, lineHeight: 1.2, whiteSpace: 'pre-wrap' }}>
            идея в том, чтобы в конце одного кадра был объект, похожий по форме или цвету на объект в начале следующего. Допустим, вы хотите перейти от сцены с костром к восходу солнца. Тогда в первом клипе огонь должен постепенно заполнить весь кадр:
          </p>
          <p style={{ margin: 0, lineHeight: 1.2 }}>
            Допустим, вы хотите перейти от сцены с костром к восходу солнца. Тогда в первом
          </p>
        </div>


        {/* 32:827 - Кнопка скопировать - выравнена как плашка промпт */}
        <img
          src={copyButton}
          alt={copied ? 'скопировано' : 'скопировать'}
          onClick={handleCopy}
          style={{
            position: 'absolute',
            left: '447px',
            top: '1780px',
            width: '257px',
            height: '73px',
            objectFit: 'contain',
            cursor: 'pointer',
          }}
        />

        {/* Footer */}
        <div style={{
          position: 'absolute',
          left: 'calc(50% - 5px)',
          top: '2071px',
          width: '888px',
          height: '124px',
          transform: 'translateX(-50%)',
        }}>
          {/* Logo Footer */}
          <div style={{
            position: 'absolute',
            left: '2px',
            top: '-16px',
            width: '380px',
            height: '83px',
          }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              overflow: 'hidden',
              pointerEvents: 'none',
            }}>
              <img 
                src={logoFooterImg}
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
            left: 'calc(50% - 442px)',
            top: '56px',
            width: '433px',
            height: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            fontFamily: 'Gotham Pro',
            fontWeight: 300,
            fontSize: '20px',
            lineHeight: 1,
            color: 'white',
          }}>
            <p style={{ margin: 0, lineHeight: 1 }}>
              Copyright © Все права защищены.
            </p>
          </div>

          {/* Socials */}
          <div style={{
            position: 'absolute',
            left: 'calc(50% + 335px)',
            top: '13px',
            width: '196px',
            height: '51px',
            transform: 'translateX(-50%)',
          }}>
            {/* Background */}
            <div style={{
              position: 'absolute',
              left: '-17px',
              top: '-15px',
              width: '230px',
              height: '78px',
              backdropFilter: 'blur(50px)',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '4px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '62px',
            }} />

            {/* Telegram */}
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
                  src={socialsImg}
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
            
            {/* Other socials */}
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
                  src={socialsImg}
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