import React from 'react';
import { useNavigate } from 'react-router-dom';

// Reused assets
import bgPattern from '../../assets/figma-welcome/pattern.png';
import logoSmall from '../../assets/figma-welcome/logo-small.png';
import logoFooter from '../../assets/figma-welcome/logo-footer.png';
import socialsIcons from '../../assets/welcome-elements/socials-icons.png';
import supportButton from '../../assets/welcome-elements/написать в поддержку подложка.png';
import exitArrow from '../../assets/tour-elements/выход.png';
import homeIcon from '../../assets/about-screens/домой.png';

// Search account specific assets
import searchBorder from '../../assets/laba-search-account/обводка поиск.png';
import promptPlate from '../../assets/laba-search-account/промпт плашка.png';
import instaLogo from '../../assets/laba-search-account/лого инста.png';
import profilePhoto from '../../assets/laba-search-account/фото профиля.png';
import trackingButton from '../../assets/laba-search-account/укороченная кнопка начать отслеживание.png';
import trackingInsert from '../../assets/laba-search-account/вставка на отслеживание.png';

export const LabaSearchAccountScreen: React.FC = () => {
  const navigate = useNavigate();
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

        {/* Header - REUSED */}
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

        {/* Title - CSS (7:1425) */}
        <div style={{
          position: 'absolute',
          left: '85px',
          top: '193px',
          fontFamily: 'Inter',
          fontWeight: 800,
          fontSize: '80px',
          lineHeight: 1,
          color: 'white',
        }}>
          поиск аккаунта
        </div>

        {/* Subtitle - CSS (7:1426) */}
        <div style={{
          position: 'absolute',
          left: '85px',
          top: '298px',
          fontFamily: 'Gotham Pro',
          fontWeight: 300,
          fontSize: '40px',
          lineHeight: 1,
          color: 'white',
        }}>
          добавьте аккаунт для отслеживания
        </div>

        {/* Main card */}
        <div style={{
          position: 'absolute',
          left: '88px',
          top: '381px',
          width: '1004px',
          height: '1661px',
          backdropFilter: 'blur(50px)',
          background: 'rgba(255,255,255,0.1)',
          border: '4px solid rgba(255,255,255,0.3)',
          borderRadius: '30px',
        }} />

        {/* Black card */}
        <div style={{
          position: 'absolute',
          left: '141px',
          top: '437px',
          width: '898px',
          height: '1549px',
          backdropFilter: 'blur(50px)',
          background: 'black',
          border: '1px solid rgba(255,255,255,0.3)',
          borderRadius: '30px',
          overflow: 'hidden',
        }}>
          {/* "добавить ссылку" - CSS (109:640) */}
          <div style={{
            position: 'absolute',
            left: '48px',
            top: '49px',
            fontFamily: 'Inter',
            fontWeight: 700,
            fontSize: '40px',
            lineHeight: 1,
            color: 'white',
          }}>
            добавить ссылку
          </div>

          {/* Search input 1 PNG */}
          <img 
            src={searchBorder}
            alt=""
            style={{
              position: 'absolute',
              left: '49px',
              top: '121px',
              width: '800px',
              height: '72px',
            }}
          />

          {/* "найти по нику" - CSS (109:636) */}
          <div style={{
            position: 'absolute',
            left: '48px',
            top: '221px',
            fontFamily: 'Inter',
            fontWeight: 700,
            fontSize: '40px',
            lineHeight: 1,
            color: 'white',
          }}>
            найти по нику
          </div>

          {/* Search input 2 PNG */}
          <img 
            src={searchBorder}
            alt=""
            style={{
              position: 'absolute',
              left: '49px',
              top: '293px',
              width: '800px',
              height: '72px',
            }}
          />

          {/* Find button PNG */}
          <img 
            src={promptPlate}
            alt="найти"
            style={{
              position: 'absolute',
              left: '325px',
              top: '419px',
              width: '247px',
              height: '72px',
              cursor: 'pointer',
            }}
          />

          {/* "результат" - CSS (109:664) */}
          <div style={{
            position: 'absolute',
            left: '48px',
            top: '547px',
            fontFamily: 'Inter',
            fontWeight: 700,
            fontSize: '40px',
            lineHeight: 1,
            color: 'white',
          }}>
            результат
          </div>

          {/* Profile photo PNG */}
          <img 
            src={profilePhoto}
            alt=""
            style={{
              position: 'absolute',
              left: '48px',
              top: '619px',
              width: '190px',
              height: '190px',
              borderRadius: '50%',
            }}
          />

          {/* Instagram logo PNG */}
          <img 
            src={instaLogo}
            alt=""
            style={{
              position: 'absolute',
              left: '254px',
              top: '626px',
              width: '64px',
              height: '78px',
            }}
          />

          {/* Username - CSS (109:667) */}
          <div style={{
            position: 'absolute',
            left: '50%',
            top: '705px',
            transform: 'translateX(-50%)',
            fontFamily: 'Inter',
            fontWeight: 700,
            fontSize: '40px',
            lineHeight: 1,
            color: 'white',
            textAlign: 'center',
          }}>
            @mishchenko.is
          </div>

          {/* Followers - CSS (109:668) */}
          <div style={{
            position: 'absolute',
            left: '50%',
            top: '763px',
            transform: 'translateX(-50%)',
            fontFamily: 'Gotham Pro',
            fontWeight: 300,
            fontSize: '32px',
            lineHeight: 1,
            color: 'white',
            textAlign: 'center',
          }}>
            275,5к подписчиков
          </div>

          {/* Tracking button PNG */}
          <img 
            src={trackingButton}
            alt="начать отслеживание"
            style={{
              position: 'absolute',
              left: '184px',
              top: '879px',
              width: '530px',
              height: '110px',
              cursor: 'pointer',
            }}
          />

          {/* Balance text */}
          <div style={{
            position: 'absolute',
            left: '50%',
            top: '1035px',
            transform: 'translateX(-50%)',
            fontFamily: 'Gotham Pro',
            fontWeight: 300,
            fontSize: '32px',
            lineHeight: 1,
            color: 'white',
            textAlign: 'center',
            width: '495px',
          }}>
            вы можете пополнить баланс <span style={{ fontWeight: 500 }}>в личном кабинете</span>
          </div>

          {/* Background image PNG */}
          <img 
            src={trackingInsert}
            alt=""
            style={{
              position: 'absolute',
              left: '-1px',
              top: '1158px',
              width: '898px',
              height: '377px',
              borderRadius: '30px',
              border: '4px solid rgba(255,255,255,0.3)',
            }}
          />
        </div>

        {/* Footer - REUSED */}
        <div style={{
          position: 'absolute',
          left: '141px',
          top: '2071px',
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
            left: 'calc(50% - 442px)',
            top: '56px',
            width: '433px',
            fontFamily: 'Gotham Pro',
            fontWeight: 300,
            fontSize: '20px',
            color: 'white',
          }}>
            <p style={{ margin: 0, lineHeight: 'normal' }}>
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