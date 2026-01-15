import React from 'react';
import { useNavigate } from 'react-router-dom';

// Local PNG assets
import smallLogo from '../../assets/figma-welcome/logo-small.png';
import returnButton from '../../assets/кнопка вернуть.png';
import searchIconPNG from '../../assets/иконка поиск.png';
import supportButtonPNG from '../../assets/tour-video/support-button.png';
import favouriteButton from '../../assets/кнопка избранное.png';
import recentButton from '../../assets/кнопка недавние.png';
import topChoiceButton from '../../assets/кнопка топ-выбор.png';
import newButton from '../../assets/кнопка новые.png';
import threePeopleLogo from '../../assets/три человека на фон.png';

// Figma MCP assets
const footerLogo = "https://www.figma.com/api/mcp/asset/eec42cbf-412b-4926-850b-463f55b43abf";
const socialIcons = "https://www.figma.com/api/mcp/asset/96863808-46d4-499a-878e-c15950dc56ad"; 
const houseImage = "https://www.figma.com/api/mcp/asset/c70dc102-4760-4242-8e7e-e595ca5b6d6c";
const homeVector1 = "https://www.figma.com/api/mcp/asset/9f881007-3e31-4135-b2fe-e06b91dd0712";
const homeVector2 = "https://www.figma.com/api/mcp/asset/21ea9087-2499-427f-928b-a8d6dfbe722a";
const backArrow = "https://www.figma.com/api/mcp/asset/e111f38a-80d6-4b85-840f-0e5fffc9fffb";

// Компонент карточки удален - будет добавлен позже

export const PromptFirstScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = React.useState('');

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

        {/* Header - Home button */}
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

        {/* Header - Logo */}
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

        {/* Header - Support button */}
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

        {/* Hero Image */}
        <div style={{
          position: 'absolute',
          border: '4px solid rgba(255, 255, 255, 0.3)',
          height: '377px',
          left: '155px',
          borderRadius: '30px',
          top: '224px',
          width: '880px',
        }}>
          <img 
            src={houseImage}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '30px',
            }}
          />
        </div>

        {/* Search bar */}
        <div style={{
          position: 'absolute',
          backdropFilter: 'blur(50px)',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          height: '72px',
          left: 'calc(50% + 3px)',
          borderRadius: '62px',
          top: '631px',
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
            placeholder="промпт для ИИ-копирайтера любых текстов"
            style={{
              fontFamily: 'Gotham Pro, sans-serif',
              fontWeight: 300,
              color: 'white',
              fontSize: '24px',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              width: '100%',
            }}
          />
        </div>

        {/* Filter: вернуть (PNG) */}
        <img 
          src={returnButton}
          alt="вернуть"
          style={{
            position: 'absolute',
            inset: '28.75% 60.43% 68.15% 18.64%',
            width: 'auto',
            height: 'auto',
            objectFit: 'contain',
            cursor: 'pointer',
          }}
        />

        {/* Filter: избранное (PNG) */}
        <img 
          src={favouriteButton}
          alt="избранное"
          style={{
            position: 'absolute',
            inset: '28.75% 39.5% 68.15% 39.58%',
            width: 'auto',
            height: 'auto',
            objectFit: 'contain',
            cursor: 'pointer',
          }}
        />

        {/* Filter: недавние (PNG) */}
        <img 
          src={recentButton}
          alt="недавние"
          style={{
            position: 'absolute',
            inset: '28.75% 18.57% 68.15% 60.51%',
            width: 'auto',
            height: 'auto',
            objectFit: 'contain',
            cursor: 'pointer',
          }}
        />

        {/* Filter: топ-выбор (PNG) */}
        <img 
          src={topChoiceButton}
          alt="топ-выбор"
          style={{
            position: 'absolute',
            inset: '31.84% 50.01% 65.05% 29.07%',
            width: 'auto',
            height: 'auto',
            objectFit: 'contain',
            cursor: 'pointer',
          }}
        />

        {/* Filter: новые (PNG) */}
        <img 
          src={newButton}
          alt="новые"
          style={{
            position: 'absolute',
            bottom: '65.05%',
            left: '50%',
            right: '29.07%',
            top: '31.84%',
            width: 'auto',
            height: 'auto',
            objectFit: 'contain',
            cursor: 'pointer',
          }}
        />

        {/* Three people logo - НА ФОНЕ (под блюром) */}
        <div style={{
          position: 'absolute',
          left: '500px',
          top: '850px',
          width: '186px',
          height: '131px',
          zIndex: 0,
        }}>
          <img 
            src={threePeopleLogo}
            alt="три человека на фон"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              filter: 'drop-shadow(0 0 80px rgba(55, 236, 247, 0.8)) drop-shadow(0 0 120px rgba(55, 236, 247, 0.4))',
            }}
          />
        </div>

        {/* Cards window - ПУСТОЙ БЛЮР-ФРЕЙМ БЕЗ КАРТОЧЕК */}
        <div style={{
          position: 'absolute',
          backdropFilter: 'blur(50px)',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '4px solid rgba(255, 255, 255, 0.3)',
          height: '1640px',
          left: 'calc(50% + 3px)',
          borderRadius: '30px',
          top: '921px',
          transform: 'translateX(-50%)',
          width: '853px',
          overflow: 'hidden',
          zIndex: 1,
        }}>
          {/* ПУСТО - ВСЕ КАРТОЧКИ УДАЛЕНЫ */}
        </div>

        {/* Footer */}
        <div style={{
          position: 'absolute',
          height: '124px',
          left: 'calc(50% - 5px)',
          top: '2650px',
          transform: 'translateX(-50%)',
          width: '888px',
        }}>
          {/* Footer Logo */}
          <div style={{
            position: 'absolute',
            height: '83px',
            left: '2px',
            top: '-16px',
            width: '380px',
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
                  maxWidth: 'none',
                  top: '-202.47%',
                  width: '170.37%',
                }}
              />
            </div>
          </div>
          
          {/* Copyright */}
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
          
          {/* Socials */}
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
                src={socialIcons}
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