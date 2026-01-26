import React from 'react';
import { useNavigate } from 'react-router-dom';

import bgPattern from '../../assets/figma-welcome/pattern.png';
import logoSmall from '../../assets/figma-welcome/logo-small.png';
import supportButton from '../../assets/tour-video/support-button.png';
import leftCard from '../../assets/laba-screens/слева.png';
import rightCard from '../../assets/laba-screens/справа.png';
import sidebar from '../../assets/laba-screens/сайдбар.png';
import scrollIndicator from '../../assets/laba-main-buttons/скролл перемещения.png';
import socialsIconsFooter from '../../assets/welcome-elements/socials-icons.png';
import logoFooter from '../../assets/figma-welcome/logo-footer.png';

export const LabaSearchScreen: React.FC = () => {
  const navigate = useNavigate();
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;
  
  const [scrollPosition, setScrollPosition] = React.useState({ x: 301, y: 1879 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [activeButton, setActiveButton] = React.useState<string | null>(null);
  
  const buttonPositions = [
    { id: 'main', x: 241, y: 1882, route: '/laba-main' },
    { id: 'tracked', x: 393, y: 1882, route: '/laba-no-tracked' },
    { id: 'favorites', x: 598, y: 1882, route: '/laba-favorites' },
    { id: 'balance', x: 741, y: 1880, route: '/metacoins' },
  ];
  
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    e.preventDefault();
  };
  
  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const containerX = (clientX / scale) - 65; // Center of 131px element
    
    setScrollPosition(prev => ({ ...prev, x: containerX }));
    
    // Check magnetic snap to buttons
    const snapThreshold = 50;
    for (const btn of buttonPositions) {
      if (Math.abs(containerX - btn.x) < snapThreshold) {
        setActiveButton(btn.id);
        setScrollPosition({ x: btn.x, y: 1879 });
        return;
      }
    }
    setActiveButton(null);
  };
  
  const handleDragEnd = () => {
    setIsDragging(false);
    if (activeButton) {
      const button = buttonPositions.find(b => b.id === activeButton);
      if (button) {
        setTimeout(() => navigate(button.route), 200);
      }
    }
  };

  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      minHeight: '100vh',
      background: '#020101',
      overflow: 'hidden',
    }}>
      {/* Background pattern - full screen */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${bgPattern})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'repeat',
        }}
      />
      {/* Background pattern - full screen */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${bgPattern})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'repeat',
        }}
      />

      <div style={{
        position: 'relative',
        width: '1180px',
        minHeight: '2550px',
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
      }}>
        {/* Background pattern - full screen */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${bgPattern})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'repeat',
          }}
        />

        <div 
          onClick={() => navigate('/main-dashboard-premium')}
          style={{
            cursor: 'pointer',
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

        <img 
          src={leftCard}
          alt=""
          style={{
            position: 'absolute',
            left: '141px',
            top: '223px',
            width: '428px',
            height: '1820px',
            objectFit: 'cover',
            borderRadius: '30px',
          }}
        />

        <img 
          src={rightCard}
          alt=""
          style={{
            position: 'absolute',
            left: '601px',
            top: '223px',
            width: '428px',
            height: '1820px',
            objectFit: 'cover',
            borderRadius: '30px',
          }}
        />

        {/* Draggable scroll indicator - ПЕРЕД сайдбаром чтобы быть ПОД иконками */}
        <img
          src={scrollIndicator}
          alt="скролл перемещения"
          onMouseDown={handleDragStart}
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
          style={{
            position: 'absolute',
            left: `${scrollPosition.x}px`,
            top: `${scrollPosition.y}px`,
            width: '131px',
            height: '131px',
            cursor: isDragging ? 'grabbing' : 'grab',
            transition: isDragging ? 'none' : 'all 0.3s ease-out',
            pointerEvents: 'auto',
          }}
        />

        <img 
          src={sidebar}
          alt=""
          style={{
            position: 'absolute',
            left: '241px',
            top: '1875px',
            width: '688px',
            height: '139px',
            objectFit: 'contain',
            pointerEvents: 'none',
          }}
        />

        {/* Невидимая кнопка на первой иконке (домик) → laba-main */}
        <div 
          onClick={() => navigate('/laba-main')}
          style={{
            position: 'absolute',
            left: '241px',
            top: '1882px',
            width: '129px',
            height: '126px',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            zIndex: 99999
          }}
        />

        {/* Невидимая кнопка на второй иконке (люди) → laba-no-tracked */}
        <div 
          onClick={() => navigate('/laba-no-tracked')}
          style={{
            position: 'absolute',
            left: '393px',
            top: '1882px',
            width: '129px',
            height: '126px',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            zIndex: 99999
          }}
        />

        {/* Невидимая кнопка на третьей иконке (звезда) → laba-favorites */}
        <div 
          onClick={() => navigate('/laba-favorites')}
          style={{
            position: 'absolute',
            left: '598px',
            top: '1882px',
            width: '129px',
            height: '124px',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            zIndex: 99999
          }}
        />

        {/* Невидимая кнопка на четвертой иконке (баланс) → metacoins */}
        <div 
          onClick={() => navigate('/metacoins')}
          style={{
            position: 'absolute',
            left: '741px',
            top: '1880px',
            width: '129px',
            height: '132px',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            zIndex: 99999
          }}
        />

        {/* Footer */}
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
          <div className="blur-wave" style={{
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
                  src={socialsIconsFooter}
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
                  src={socialsIconsFooter}
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
