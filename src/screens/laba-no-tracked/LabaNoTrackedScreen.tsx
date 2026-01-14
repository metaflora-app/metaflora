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

  // Calculate scale based on viewport width (DESKTOP design width: 1180px)
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;

  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      minHeight: '100vh',
      background: '#020101',
      overflow: 'hidden',
    }}>
      {/* Scaled container - DESKTOP format 1180x2550 */}
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

        {/* Header - Based on Figma node-id=7:1330 */}
        
        {/* Exit button (53:849) - x=88, y=175, 100x100 */}
        <img 
          src={exitArrow}
          alt="назад"
          onClick={() => navigate(-1)}
          style={{
            position: 'absolute',
            left: '88px',
            top: '175px',
            width: '100px',
            height: '100px',
            cursor: 'pointer',
          }}
        />

        {/* Home button (53:844) - x=188, y=175, 100x100 */}
        <div style={{
          position: 'absolute',
          left: '188px',
          top: '175px',
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          border: '4px solid rgba(255, 255, 255, 0.3)',
          backdropFilter: 'blur(50px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
        onClick={() => navigate('/main-dashboard-free')}
        >
          <div style={{ fontSize: '32px' }}>🎴</div>
        </div>

        {/* Logo (53:848) - x=500, y=61, 186x131 */}
        <div style={{
          position: 'absolute',
          left: '500px',
          top: '61px',
          width: '186px',
          height: '131px',
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

        {/* Support button (53:846) - x=829, y=97, 205x78 */}
        <div style={{
          position: 'absolute',
          left: '829px',
          top: '97px',
        }}>
          <img 
            src={supportButton}
            alt="написать в поддержку"
            style={{
              width: '205px',
              height: '78px',
              cursor: 'pointer',
              objectFit: 'contain',
            }}
          />
        </div>

        {/* Main title (7:1377) - x=85, y=193, 1020x80 */}
        <div style={{
          position: 'absolute',
          left: '85px',
          top: '193px',
          width: '1020px',
          height: '80px',
          fontFamily: 'Inter',
          fontWeight: 800,
          fontSize: '64px',
          lineHeight: 1,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
        }}>
          <p style={{ margin: 0 }}>отслеживание контента</p>
        </div>

        {/* Subtitle (7:1378) - x=85, y=295, 882x40 */}
        <div style={{
          position: 'absolute',
          left: '85px',
          top: '295px',
          width: '882px',
          height: '40px',
          fontFamily: 'Gotham Pro',
          fontSize: '32px',
          lineHeight: 1,
          color: 'rgba(255, 255, 255, 0.6)',
          display: 'flex',
          alignItems: 'center',
        }}>
          <p style={{ margin: 0 }}>добавьте аккаунт для отслеживания</p>
        </div>

        {/* People image PNG (7:1357) - x=143, y=898, 892x1050 - СЗАДИ ВСЕГО */}
        <img 
          src={peopleImage}
          alt=""
          style={{
            position: 'absolute',
            left: '143px',
            top: '898px',
            width: '892px',
            height: '1050px',
            objectFit: 'contain',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />

        {/* Blur overlay PNG (7:1360) - x=143, y=381, 892x1661 - ПОВЕРХ ЛЮДЕЙ */}
        <img 
          src={blurOverlay}
          alt=""
          style={{
            position: 'absolute',
            left: '143px',
            top: '381px',
            width: '892px',
            height: '1661px',
            objectFit: 'cover',
            borderRadius: '30px',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />

        {/* Button PNG (7:1362) - x=147, y=1147 (143+4, 381+766) - ПОВЕРХ БЛЮРА */}
        <img 
          src={startTrackingButton}
          alt="начать отслеживание ₽100"
          style={{
            position: 'absolute',
            left: '147px',
            top: '1147px',
            width: '884px',
            height: '139px',
            objectFit: 'contain',
            cursor: 'pointer',
            zIndex: 10,
          }}
        />

        {/* Text under button (7:1361) - x=199, y=1300 (919+381) */}
        <div style={{
          position: 'absolute',
          left: '342px',
          top: '1300px',
          width: '495px',
          height: '64px',
          textAlign: 'center',
          fontFamily: 'Gotham Pro',
          fontSize: '24px',
          lineHeight: 1.3,
          color: 'rgba(255, 255, 255, 0.7)',
          zIndex: 10,
        }}>
          <p style={{ margin: 0 }}>
            вы можете пополнить баланс<br />
            в личном кабинете
          </p>
        </div>

        {/* Footer (53:847) - x=141, y=2071, 888x124 */}
        <div style={{
          position: 'absolute',
          left: '141px',
          top: '2071px',
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
