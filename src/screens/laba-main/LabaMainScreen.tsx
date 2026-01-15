import React from 'react';
import { useNavigate } from 'react-router-dom';

// REUSED from prompt-first screen
import smallLogo from '../../assets/figma-welcome/logo-small.png';
import searchIconPNG from '../../assets/иконка поиск.png';
import supportButtonPNG from '../../assets/tour-video/support-button.png';
import exitArrow from '../../assets/tour-video/exit-arrow.png';
import homeIcon from '../../assets/about-screens/домой.png';
import logoFooter from '../../assets/figma-welcome/logo-footer.png';
import socialsIconsFooter from '../../assets/welcome-elements/socials-icons.png';
import bgPattern from '../../assets/figma-welcome/pattern.png';

// NEW laba-main specific assets
import instagramLogo from '../../assets/laba-main/инстаграм.png';

// REUSED: heart icon from prompt-first
// REUSED: footer and header components from prompt-first

// Figma MCP assets
const threePeopleBg = "https://www.figma.com/api/mcp/asset/f3584e93-0081-49e7-9409-50f9825348fe";
const footerLogo = "https://www.figma.com/api/mcp/asset/397520f5-d814-4aa8-bf00-d89010c36feb";
const houseImage = "https://www.figma.com/api/mcp/asset/034558ad-cb90-45ad-b5cb-9e3d6cb73d41";
const heartIcon = "https://www.figma.com/api/mcp/asset/260c3df0-5bae-4a47-8e99-4ae257dbf4aa";
const backArrow = "https://www.figma.com/api/mcp/asset/41881d92-41fe-4db1-8733-923a76429bac";
const homeVector1 = "https://www.figma.com/api/mcp/asset/7f8fe4f9-e032-4981-9368-14105e191fdf";
const homeVector2 = "https://www.figma.com/api/mcp/asset/d4c16fc8-1b5d-4f5d-a76d-560e408c8d5c";

export const LabaMainScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = React.useState('');

  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;

  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      minHeight: '100vh',
      background: '#020101',
      backgroundImage: `url(${bgPattern})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center', 
      backgroundRepeat: 'repeat',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'relative',
        width: '1180px',
        minHeight: '2550px',
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
      }}>
        {/* Header - REUSED from prompt-first */}
        {/* Header - Back button */}
        <div 
          onClick={() => navigate(-1)}
          style={{
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            left: 'calc(50% - 452px)',
            width: '100px',
            height: '100px',
            top: '75px',
            transform: 'translateX(-50%)',
            cursor: 'pointer',
          }}
        >
          <div style={{ transform: 'rotate(270deg)' }}>
            <div style={{
              backdropFilter: 'blur(50px)',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '4px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '62px',
              overflow: 'hidden',
              width: '100px',
              height: '100px',
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                left: '11px',
                width: '71px',
                height: '71px',
                top: '10px',
              }}>
                <div style={{ transform: 'rotate(90deg)', width: '71px', height: '71px', position: 'relative' }}>
                  <div style={{ position: 'absolute', inset: '3.13%' }}>
                    <img src={backArrow} alt="" style={{ width: '100%', height: '100%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Header - Home button - REUSED */}
        <div 
          onClick={() => navigate('/main-dashboard-premium')}
          style={{
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            left: 'calc(50% - 352px)',
            width: '100px',
            height: '100px',
            top: '75px',
            transform: 'translateX(-50%)',
            cursor: 'pointer',
          }}
        >
          <div style={{ transform: 'rotate(270deg)' }}>
            <div style={{
              backdropFilter: 'blur(50px)',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '4px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '62px',
              overflow: 'hidden',
              width: '100px',
              height: '100px',
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                left: '24px',
                width: '65px',
                height: '65px',
                top: '13px',
              }}>
                <div style={{ transform: 'rotate(90deg)', width: '65px', height: '65px', position: 'relative' }}>
                  <div style={{ position: 'absolute', inset: '19.15% 15.36% -12.9% 12.77%' }}>
                    <img src={homeVector1} alt="" style={{ width: '100%', height: '100%' }} />
                  </div>
                  <div style={{ position: 'absolute', inset: '27.81% 42.67% 33.98% 19.82%' }}>
                    <img src={homeVector2} alt="" style={{ width: '100%', height: '100%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Header - Logo - REUSED */}
        <div style={{
          position: 'absolute',
          height: '131px',
          left: '500px',
          top: '61px',
          width: '186px',
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            pointerEvents: 'none',
          }}>
            <img 
              src={smallLogo}
              alt="МЕТАФЛОРА*"
              style={{
                position: 'absolute',
                height: '131.84%',
                left: '-21.84%',
                maxWidth: 'none',
                top: '-16.38%',
                width: '143.34%',
              }}
            />
          </div>
        </div>

        {/* Header - Support button - REUSED */}
        <img 
          src={supportButtonPNG}
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

        {/* Search bar - REUSED styles from prompt-first */}
        <div style={{
          position: 'absolute',
          backdropFilter: 'blur(50px)',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          height: '72px',
          left: 'calc(50% + 3px)',
          borderRadius: '62px',
          top: '224px',
          transform: 'translateX(-50%)',
          width: '876px',
          display: 'flex',
          alignItems: 'center',
          paddingLeft: '30px',
        }}>
          <img 
            src={searchIconPNG}
            alt=""
            style={{
              width: '24px',
              height: '24px',
              marginRight: '15px',
            }}
          />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="найти видео по ключевым словам"
            style={{
              fontFamily: 'Gotham Pro, sans-serif',
              fontWeight: 300,
              color: '#848484',
              fontSize: '27px',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              width: '100%',
            }}
          />
        </div>

        {/* Main content window */}
        <div style={{
          position: 'absolute',
          backdropFilter: 'blur(50px)',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '4px solid rgba(255, 255, 255, 0.3)',
          height: '1050px',
          left: 'calc(50% + 3px)',
          borderRadius: '30px',
          top: '678px',
          transform: 'translateX(-50%)',
          width: '884px',
          overflow: 'clip',
          zIndex: 10,
          padding: '22px',
        }}>
          {/* Карточка 1 - Верхняя левая */}
          <div style={{
            position: 'absolute',
            left: '22px',
            top: '23px',
            width: '410px',
            height: '782px',
          }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              backdropFilter: 'blur(50px)',
              background: '#000',
              border: '4px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '30px',
            }} />
            
            {/* Фото дома */}
            <div style={{
              position: 'absolute',
              top: '3.45%',
              right: '6.59%',
              bottom: '45.4%',
              left: '6.59%',
              border: '2px solid rgba(0, 0, 0, 0.3)',
              borderRadius: '25px',
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
                  borderRadius: '25px',
                }}
              />
            </div>

            {/* Play кнопка */}
            <div style={{
              position: 'absolute',
              top: '22.76%',
              right: '38.78%',
              bottom: '64.71%',
              left: '37.32%',
              backdropFilter: 'blur(50px)',
              background: 'rgba(0, 0, 0, 0.1)',
              border: '4px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '62px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <div style={{
                transform: 'rotate(90deg)',
                width: '60px',
                height: '60px',
              }}>
                <img src={exitArrow} alt="" style={{ width: '100%', height: '100%' }} />
              </div>
            </div>

            {/* Статистика бар */}
            <div style={{
              position: 'absolute',
              left: 'calc(50% + 0.5px)',
              top: '365px',
              transform: 'translateX(-50%)',
              width: '333px',
              height: '52px',
              backdropFilter: 'blur(50px)',
              background: '#000',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around',
              padding: '0 20px',
            }}>
              <div style={{
                fontFamily: 'Gotham Pro, sans-serif',
                fontWeight: 500,
                fontSize: '27px',
                color: 'white',
                textAlign: 'center',
              }}>227к</div>
              <div style={{
                fontFamily: 'Gotham Pro, sans-serif',
                fontWeight: 500,
                fontSize: '27px',
                color: 'white',
                textAlign: 'center',
              }}>40к</div>
              <div style={{
                fontFamily: 'Gotham Pro, sans-serif',
                fontWeight: 500,
                fontSize: '27px',
                color: 'white',
                textAlign: 'center',
              }}>2к</div>
            </div>

            {/* Instagram данные */}
            <div style={{
              position: 'absolute',
              left: '7.32%',
              top: '448px',
              width: '30px',
              height: '36px',
            }}>
              <img src={instagramLogo} alt="" style={{ width: '100%', height: '100%', opacity: 0.6 }} />
            </div>

            <div style={{
              position: 'absolute',
              top: '67.26%',
              right: '11.22%',
              bottom: '27.37%',
              left: '7.32%',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 700,
              fontSize: '40px',
              color: 'white',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}>
              @mishchenko.is
            </div>

            <div style={{
              position: 'absolute',
              top: '74.55%',
              right: '8.05%',
              bottom: '22.12%',
              left: '6.59%',
              fontFamily: 'Gotham Pro, sans-serif',
              fontWeight: 300,
              fontSize: '32px',
              color: 'white',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}>
              275,5к подписчиков
            </div>

            {/* Кнопка "анализ" */}
            <div style={{
              position: 'absolute',
              top: '81.84%',
              right: '19.77%',
              bottom: '8.02%',
              left: '20%',
              backdropFilter: 'blur(50px)',
              background: 'rgba(0, 0, 0, 0.9)',
              border: '4px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '62px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}>
              <div style={{
                fontFamily: 'Gotham Pro, sans-serif',
                fontWeight: 500,
                fontSize: '27px',
                color: 'white',
                textAlign: 'center',
              }}>
                анализ
              </div>
            </div>

            {/* Временная плашка */}
            <div style={{
              position: 'absolute',
              left: 'calc(50% + 1px)',
              top: '417px',
              transform: 'translateX(-50%)',
              width: '220px',
              height: '38px',
              backdropFilter: 'blur(50px)',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '62px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <div style={{
                fontFamily: 'Gotham Pro, sans-serif',
                fontWeight: 500,
                fontSize: '23px',
                color: 'white',
                textAlign: 'center',
              }}>
                2 месяца назад
              </div>
            </div>
          </div>

          {/* TODO: Карточки 2, 3, 4 - копии с разными позициями */}
        </div>

        {/* Footer - REUSED from prompt-first */}
        <div style={{
          position: 'absolute',
          left: 'calc(50% - 5px)',
          top: '2200px',
          transform: 'translateX(-50%)',
          width: '888px',
          height: '124px',
        }}>
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
                src={footerLogo}
                alt=""
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
            fontFamily: 'Gotham Pro, sans-serif',
            fontWeight: 300,
            fontSize: '20px',
            color: 'white',
            left: '2px',
            top: '56px',
            width: '433px',
            lineHeight: 1,
          }}>
            Copyright © Все права защищены.
          </div>
          
          <div style={{
            position: 'absolute',
            height: '51px',
            left: 'calc(50% + 335px)',
            top: 'calc(50% - 23.5px)',
            transform: 'translate(-50%, -50%)',
            width: '196px',
          }}>
            <div style={{
              position: 'absolute',
              backdropFilter: 'blur(50px)',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '4px solid rgba(255, 255, 255, 0.3)',
              height: '78px',
              left: '-17px',
              borderRadius: '62px',
              top: '-15px',
              width: '230px',
            }} />
            <div style={{
              position: 'absolute',
              height: '51px',
              left: 0,
              top: 0,
              width: '50px',
              opacity: 0.6,
              overflow: 'hidden',
              pointerEvents: 'none',
            }}>
              <img 
                src={socialsIconsFooter}
                alt=""
                style={{
                  position: 'absolute',
                  height: '339.84%',
                  left: '-377.92%',
                  maxWidth: 'none',
                  top: '-118.33%',
                  width: '517.92%',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};