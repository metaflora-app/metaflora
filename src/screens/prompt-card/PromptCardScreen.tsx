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

export const PromptCardScreen: React.FC = () => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  // Prompt text matching Figma exactly
  const promptText = 'идея в том, чтобы в конце одного кадра был объект, похожий по форме или цвету на объект в начале следующего. Допустим, вы хотите перейти от сцены с костром к восходу солнца. Тогда в первом клипе огонь должен постепенно заполнить весь кадр: Допустим, вы хотите перейти от сцены с костром к восходу солнца. Тогда в первом';

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
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => {
        setCopied(false);
        timeoutRef.current = null;
      }, 1800);
    } catch (err) {
      // ignore copy errors
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

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
        }} />

        {/* Background logo (три человека на фон) */}
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

        {/* Заголовок "карточка промпта" */}
        <div style={{
          position: 'absolute',
          left: '85px',
          top: '193px',
          width: '1020px',
          height: '160px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          fontFamily: 'Inter',
          fontWeight: 800,
          fontSize: '80px',
          lineHeight: 0,
          color: 'white',
        }}>
          <p style={{ margin: 0, lineHeight: 1, whiteSpace: 'pre-wrap' }}>карточка промпта</p>
        </div>

        {/* Описание */}
        <div style={{
          position: 'absolute',
          left: '85px',
          top: '290px',
          width: '668px',
          height: '126px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          fontFamily: 'Gotham Pro',
          fontSize: '40px',
          lineHeight: 0,
          color: 'white',
        }}>
          <p style={{ margin: 0, lineHeight: 1, whiteSpace: 'pre-wrap' }}>
            <span style={{ fontWeight: 700 }}>описание:</span>
            <span style={{ fontWeight: 300 }}> создайте и настройте копирайтера за один промпт</span>
          </p>
        </div>

        {/* Header - Back button */}
        <div style={{
          position: 'absolute',
          left: 'calc(50% - 452px)',
          top: '75px',
          width: '100px',
          height: '100px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            transform: 'rotate(270deg)',
          }}>
            <div style={{
              backdropFilter: 'blur(50px)',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '4px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '62px',
              overflow: 'clip',
              width: '100px',
              height: '100px',
              position: 'relative',
              cursor: 'pointer',
            }}
            onClick={() => navigate(-1)}>
              <div style={{
                position: 'absolute',
                left: '24px',
                top: '13px',
                width: '65px',
                height: '65px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <div style={{ transform: 'rotate(90deg)' }}>
                  <img 
                    src={exitArrow}
                    alt="назад"
                    style={{
                      width: '65px',
                      height: '65px',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Home button (домой) */}
        <div style={{
          position: 'absolute',
          left: 'calc(50% - 352px)',
          top: '75px',
          width: '100px',
          height: '100px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            transform: 'rotate(270deg)',
          }}>
            <div style={{
              backdropFilter: 'blur(50px)',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '4px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '62px',
              overflow: 'clip',
              width: '100px',
              height: '100px',
              position: 'relative',
              cursor: 'pointer',
            }}
            onClick={() => navigate('/main-dashboard-premium')}>
              <div style={{
                position: 'absolute',
                left: '24px',
                top: '13px',
                width: '65px',
                height: '65px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <div style={{ transform: 'rotate(90deg)' }}>
                  <div style={{
                    width: '65px',
                    height: '65px',
                    position: 'relative',
                  }}>
                    <div style={{
                      position: 'absolute',
                      left: '12.4px',
                      top: '-8.4px',
                      width: '52.4px',
                      height: '81.4px',
                    }}>
                      {/* Home icon placeholder */}
                      <div style={{
                        width: '100%',
                        height: '100%',
                        background: 'white',
                        clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
                      }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
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

        {/* Support button */}
        <div style={{
          position: 'absolute',
          left: 'calc(50% + 341.5px)',
          top: '97px',
          width: '205px',
          height: '78px',
          transform: 'translateX(-50%)',
          backdropFilter: 'blur(50px)',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '4px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '62px',
          overflow: 'clip',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            fontFamily: 'Gotham Pro',
            fontSize: '20px',
            color: 'white',
            textAlign: 'center',
            lineHeight: 1,
          }}>
            <div style={{ fontWeight: 300 }}>написать </div>
            <div style={{ fontWeight: 700 }}>в поддержку</div>
          </div>
        </div>

        {/* Main card container */}
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
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            backdropFilter: 'blur(50px)',
            background: 'black',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '30px',
          }} />
        </div>

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

        {/* Title "ИИ-копирайтер для блога" */}
        <div style={{
          position: 'absolute',
          left: 'calc(50% + 0.5px)',
          top: '1224px',
          width: '469px',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          fontFamily: 'Inter',
          fontWeight: 700,
          fontSize: '52px',
          lineHeight: 0,
          color: 'white',
          textAlign: 'center',
        }}>
          <p style={{ margin: 0, lineHeight: 1, whiteSpace: 'pre-wrap' }}>ИИ-копирайтер для блога</p>
        </div>

        {/* Промпт плашка */}
        <div style={{
          position: 'absolute',
          left: '447px',
          top: '1398px',
          width: '257px',
          height: '73px',
          backdropFilter: 'blur(50px)',
          background: 'rgba(0, 0, 0, 0.9)',
          border: '4px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '62px',
          overflow: 'clip',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {/* Colors circles */}
          <div style={{
            position: 'absolute',
            left: '73px',
            top: '-44px',
          }}>
            <div style={{
              position: 'absolute',
              left: '77px',
              top: '-36.46px',
              width: '101.963px',
              height: '107.431px',
              background: 'white',
              borderRadius: '1568.563px',
            }} />
            <div style={{
              position: 'absolute',
              left: '102.5px',
              top: '-40px',
              width: '90.498px',
              height: '78.548px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <div style={{
                transform: 'rotate(16.918deg) skewX(-15.566deg)',
                width: '51.243px',
                height: '75.957px',
                background: 'white',
                borderRadius: '1568.563px',
              }} />
            </div>
            <div style={{
              position: 'absolute',
              left: '122.8px',
              top: '30.18px',
              width: '56.152px',
              height: '72.822px',
              background: 'white',
              borderRadius: '1568.563px',
            }} />
          </div>
          <div style={{
            fontFamily: 'Gotham Pro',
            fontWeight: 500,
            fontSize: '27px',
            color: 'white',
            textAlign: 'center',
          }}>
            промпт
          </div>
        </div>

        {/* Prompt text */}
        <div style={{
          position: 'absolute',
          left: '50%',
          top: '1503px',
          width: '666px',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          fontFamily: 'TT Commons',
          fontWeight: 300,
          fontSize: '35px',
          lineHeight: 1,
          color: 'white',
          textAlign: 'center',
          height: isExpanded ? 'auto' : '293px',
          overflow: isExpanded ? 'visible' : 'hidden',
        }}>
          <p style={{ margin: 0, lineHeight: 1, whiteSpace: 'pre-wrap' }}>
            {promptText.split('Допустим, вы хотите перейти от сцены с костром к восходу солнца. Тогда в первом')[0]}
          </p>
          <p style={{ margin: 0, lineHeight: 1 }}>
            Допустим, вы хотите перейти от сцены с костром к восходу солнца. Тогда в первом
          </p>
          {isExpanded && (
            <p style={{ margin: 0, lineHeight: 1 }}>
              {/* Additional text would go here when expanded */}
            </p>
          )}
        </div>

        {/* Expand button */}
        {!isExpanded && (
          <>
            <div style={{
              position: 'absolute',
              left: 'calc(50% + 118.5px)',
              top: '1794px',
              width: '35px',
              height: '35px',
              transform: 'translateX(-50%)',
              backdropFilter: 'blur(50px)',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '30px',
              overflow: 'clip',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={() => setIsExpanded(true)}>
              <div style={{
                width: '15px',
                height: '15px',
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute',
                  left: '3.13%',
                  right: '3.13%',
                  top: '3.13%',
                  bottom: '3.13%',
                  background: 'white',
                  clipPath: 'polygon(45% 0%, 55% 0%, 55% 45%, 100% 45%, 100% 55%, 55% 55%, 55% 100%, 45% 100%, 45% 55%, 0% 55%, 0% 45%, 45% 45%)',
                }} />
              </div>
            </div>
            <div style={{
              position: 'absolute',
              left: '50%',
              top: '1796px',
              width: '218px',
              transform: 'translateX(-50%)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              fontFamily: 'Gotham Pro',
              fontWeight: 500,
              fontSize: '32px',
              lineHeight: 0,
              color: 'white',
              textAlign: 'center',
            }}>
              <p style={{ margin: 0, lineHeight: 1, whiteSpace: 'pre-wrap' }}>развернуть</p>
            </div>
          </>
        )}

        {/* Copy button */}
        <div style={{
          position: 'absolute',
          left: '467px',
          top: '1849px',
          width: '257px',
          height: '73px',
          backdropFilter: 'blur(50px)',
          background: 'rgba(0, 0, 0, 0.9)',
          border: '4px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '62px',
          overflow: 'clip',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={handleCopy}>
          <div style={{
            fontFamily: 'Gotham Pro',
            fontWeight: 500,
            fontSize: '27px',
            color: 'white',
            textAlign: 'center',
          }}>
            {copied ? 'скопировано' : 'скопировать'}
          </div>
        </div>

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
            lineHeight: 0,
            color: 'white',
          }}>
            <p style={{ margin: 0, lineHeight: 1, whiteSpace: 'pre-wrap' }}>
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