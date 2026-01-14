import React from 'react';
import { useNavigate } from 'react-router-dom';

// Reused components assets
import bgPattern from '../../assets/figma-welcome/pattern.png';
import logoSmall from '../../assets/figma-welcome/logo-small.png';
import logoFooter from '../../assets/figma-welcome/logo-footer.png';
import socialsIcons from '../../assets/welcome-elements/socials-icons.png';
import supportButton from '../../assets/tour-video/support-button.png';
import exitArrow from '../../assets/tour-video/exit-arrow.png';

// New assets for laba-no-tracked from Desktop
import blurOverlay from '../../assets/laba-no-tracked/блюр на отслеживание.png';
import startTrackingButton from '../../assets/laba-no-tracked/кнопка начать отслеживание.png';
import peopleImage from '../../assets/laba-no-tracked/люди друг на друге.png';

export const LabaNoTrackedScreen: React.FC = () => {
  const navigate = useNavigate();

  // Calculate scale based on viewport width (mobile design width: 375px)
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 375, 1) : 1;

  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      minHeight: '100vh',
      background: '#020101',
      overflow: 'hidden',
    }}>
      {/* Scaled container - mobile format */}
      <div style={{
        position: 'relative',
        width: '375px',
        minHeight: '100vh',
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        margin: '0 auto',
      }}>
        {/* Background pattern */}
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '375px',
          height: '100vh',
          backgroundImage: `url(${bgPattern})`,
          backgroundRepeat: 'repeat',
          backgroundSize: 'auto',
        }} />

        {/* Header - Based on Figma coordinates */}
        
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

        {/* User profile icon - next to back button */}
        <div style={{
          position: 'absolute',
          left: '120px',
          top: '36px',
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          border: '3px solid rgba(255, 255, 255, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
        onClick={() => navigate('/main-dashboard-free')}
        >
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: 'white',
            }} />
          </div>
        </div>

        {/* Logo - centered based on Figma */}
        <div style={{
          position: 'absolute',
          left: '50%',
          top: '36px',
          transform: 'translateX(-50%)',
          width: '120px',
          height: '80px',
        }}>
          <img 
            src={logoSmall}
            alt="МЕТАФЛОРА*"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />
        </div>

        {/* Support button - top right */}
        <div style={{
          position: 'absolute',
          right: '36px',
          top: '36px',
        }}>
          <img 
            src={supportButton}
            alt="написать в поддержку"
            style={{
              width: '180px',
              height: '60px',
              cursor: 'pointer',
              objectFit: 'contain',
            }}
          />
        </div>

        {/* Main title - "отслеживание контента" - positioned based on Figma */}
        <div style={{
          position: 'absolute',
          left: '50%',
          top: '140px',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          fontFamily: 'Inter',
          fontWeight: 800,
          fontSize: '64px',
          lineHeight: 1,
          color: 'white',
        }}>
          <p style={{ margin: 0, lineHeight: 1 }}>отслеживание контента</p>
        </div>

        {/* Subtitle - "добавьте аккаунт для отслеживания" - centered under title */}
        <div style={{
          position: 'absolute',
          left: '50%',
          top: '220px',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          fontFamily: 'Gotham Pro',
          fontSize: '32px',
          lineHeight: 1,
          color: 'rgba(255, 255, 255, 0.6)',
        }}>
          <p style={{ margin: 0, lineHeight: 1 }}>добавьте аккаунт для отслеживания</p>
        </div>

        {/* Main content card - adjusted size and position based on Figma */}
        <div style={{
          position: 'absolute',
          left: '50%',
          top: '280px',
          width: '720px',
          height: '1200px',
          transform: 'translateX(-50%)',
          backdropFilter: 'blur(50px)',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '4px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '30px',
        }}>
          {/* Background: Blur overlay PNG */}
          <img 
            src={blurOverlay}
            alt=""
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '26px',
              pointerEvents: 'none',
            }}
          />

          {/* People image PNG - centered in card */}
          <img 
            src={peopleImage}
            alt=""
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: '80%',
              height: 'auto',
              objectFit: 'contain',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />

          {/* Action button PNG - "начать отслеживание ₽100" */}
          <img 
            src={startTrackingButton}
            alt="начать отслеживание ₽100"
            style={{
              position: 'absolute',
              left: '50%',
              bottom: '280px',
              transform: 'translateX(-50%)',
              width: 'auto',
              height: '60px',
              cursor: 'pointer',
              zIndex: 10,
            }}
          />

          {/* Description text - "вы можете пополнить баланс в личном кабинете" */}
          <div style={{
            position: 'absolute',
            left: '50%',
            bottom: '180px',
            transform: 'translateX(-50%)',
            width: '600px',
            textAlign: 'center',
            fontFamily: 'Gotham Pro',
            fontSize: '28px',
            lineHeight: 1.2,
            color: 'rgba(255, 255, 255, 0.7)',
            zIndex: 10,
          }}>
            <p style={{ margin: 0, lineHeight: 1.2 }}>
              вы можете пополнить баланс<br />
              в личном кабинете
            </p>
          </div>
        </div>

        {/* Footer - positioned at bottom of screen */}
        <div style={{
          position: 'absolute',
          left: '50%',
          bottom: '36px',
          transform: 'translateX(-50%)',
          width: '720px',
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
          
          {/* Copyright text */}
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
          
          {/* Social background */}
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
          
          {/* Social icons */}
          <div style={{
            position: 'absolute',
            left: '681px',
            top: '13px',
            width: '196px',
            height: '51px',
          }}>
            {/* First icon */}
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
            
            {/* Other icons group */}
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
