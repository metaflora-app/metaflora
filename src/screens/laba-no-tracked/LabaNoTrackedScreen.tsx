import React from 'react';
import { useNavigate } from 'react-router-dom';

// Components
import { LabaBottomNavigation } from '../../components/laba/BottomNavigation';

// Images from existing screens
import bgPattern from '../../assets/figma-welcome/pattern.png';
import logoSmall from '../../assets/figma-welcome/logo-small.png';
import logoFooter from '../../assets/figma-welcome/logo-footer.png';
import socialsIcons from '../../assets/welcome-elements/socials-icons.png';
import supportButton from '../../assets/tour-video/support-button.png';
import homeIcon from '../../assets/about-screens/домой.png';
import exitArrow from '../../assets/tour-video/exit-arrow.png';

export const LabaNoTrackedScreen: React.FC = () => {
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

        {/* Header - Exit button */}
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

        {/* Header - Home button */}
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

        {/* Header - Logo */}
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

        {/* Header - Support button */}
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

        {/* Main content - Empty state */}
        <div style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          color: 'white',
        }}>
          {/* Title */}
          <div style={{
            fontFamily: 'Inter',
            fontWeight: 800,
            fontSize: '80px',
            lineHeight: '1',
            marginBottom: '40px',
          }}>
            еще нет отслеживаемых
          </div>

          {/* Subtitle */}
          <div style={{
            fontFamily: 'Gotham Pro',
            fontWeight: 300,
            fontSize: '40px',
            lineHeight: '1',
            marginBottom: '80px',
            opacity: 0.8,
          }}>
            добавьте первый аккаунт для начала
          </div>

          {/* Start tracking button */}
          <button
            onClick={() => navigate('/laba-tracked')}
            style={{
              padding: '24px 48px',
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              border: '4px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '62px',
              backdropFilter: 'blur(50px)',
              color: 'white',
              fontSize: '32px',
              fontFamily: 'Gotham Pro',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              outline: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.9)';
            }}
          >
            начать отслеживание
          </button>
        </div>

        {/* Footer */}
        <div style={{
          position: 'absolute',
          left: 'calc(50% - 5px)',
          top: 'calc(50% + 858px)',
          width: '888px',
          height: '124px',
          transform: 'translate(-50%, -50%)',
        }}>
          {/* Footer Logo */}
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
          
          {/* Copyright */}
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
            lineHeight: 0,
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
          
          {/* Socials background */}
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
            <div style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '50px',
              height: '51px',
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
            
            <div style={{
              position: 'absolute',
              left: '54px',
              top: 0,
              width: '142px',
              height: '51px',
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

      {/* Bottom Navigation */}
      <LabaBottomNavigation />
    </div>
  );
};