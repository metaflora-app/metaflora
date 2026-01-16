import React from 'react';
import { useNavigate } from 'react-router-dom';

// Reused assets
import bgPattern from '../../assets/figma-welcome/pattern.png';
import logoSmall from '../../assets/figma-welcome/logo-small.png';
import logoFooter from '../../assets/figma-welcome/logo-footer.png';
import socialsIcons from '../../assets/welcome-elements/socials-icons.png';
import exitArrow from '../../assets/tour-elements/выход.png';
import homeIcon from '../../assets/about-screens/домой.png';

// Search account specific assets
import promptPlate from '../../assets/laba-search-account/промпт плашка.png';
import instaLogo from '../../assets/laba-search-account/лого инста.png';
import profilePhoto from '../../assets/laba-search-account/фото профиля.png';
import trackingButton from '../../assets/laba-search-account/укороченная кнопка начать отслеживание.png';
import trackingInsert from '../../assets/laba-search-account/вставка на отслеживание.png';
import peopleBackground from '../../assets/laba-search-account/люди друг на друге.png';
import searchIcon from '../../assets/laba-search-account/иконка поиск.png';

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

        {/* Header */}
        
        {/* Back button (109:612) - стрелка повернута на 270deg */}
        <div style={{
          position: 'absolute',
          left: 'calc(50% - 452px)',
          top: '75px',
          width: '100px',
          height: '100px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: 'translateX(-50%)',
        }}>
          <div style={{ transform: 'rotate(270deg)' }}>
            <div style={{
              position: 'relative',
              width: '100px',
              height: '100px',
              backdropFilter: 'blur(50px)',
              background: 'rgba(255,255,255,0.1)',
              border: '4px solid rgba(255,255,255,0.3)',
              borderRadius: '62px',
              overflow: 'hidden',
              cursor: 'pointer',
            }}
            onClick={() => navigate(-1)}>
              <div style={{
                position: 'absolute',
                left: '11px',
                top: '10px',
                width: '71px',
                height: '71px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <div style={{ transform: 'rotate(90deg)' }}>
                  <img 
                    src={exitArrow}
                    alt=""
                    style={{
                      width: '71px',
                      height: '71px',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Home button (109:607) - иконка повернута на 270deg */}
        <div style={{
          position: 'absolute',
          left: 'calc(50% - 352px)',
          top: '75px',
          width: '100px',
          height: '100px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: 'translateX(-50%)',
        }}>
          <div style={{ transform: 'rotate(270deg)' }}>
            <div style={{
              position: 'relative',
              width: '100px',
              height: '100px',
              backdropFilter: 'blur(50px)',
              background: 'rgba(255,255,255,0.1)',
              border: '4px solid rgba(255,255,255,0.3)',
              borderRadius: '62px',
              overflow: 'hidden',
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
                  <img 
                    src={homeIcon}
                    alt=""
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

        {/* Support button (109:609) */}
        <div style={{
          position: 'absolute',
          left: 'calc(50% + 341.5px)',
          transform: 'translateX(-50%)',
          top: '97px',
          width: '205px',
          height: '78px',
          backdropFilter: 'blur(50px)',
          background: 'rgba(255,255,255,0.1)',
          border: '4px solid rgba(255,255,255,0.3)',
          borderRadius: '62px',
          overflow: 'hidden',
          cursor: 'pointer',
        }}>
          <div style={{
            position: 'absolute',
            left: 'calc(50% - 68.5px)',
            top: 'calc(23.08% - 4px)',
            bottom: 'calc(25.64% - 4px)',
            width: '145px',
            fontFamily: 'Gotham Pro',
            fontSize: '20px',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            lineHeight: 1,
            whiteSpace: 'pre-wrap',
          }}>
            <p style={{ margin: 0, fontWeight: 300 }}>написать </p>
            <p style={{ margin: 0, fontWeight: 700 }}>в поддержку</p>
          </div>
        </div>

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

        {/* Background people image (109:596) - BEHIND cards */}
        <div style={{
          position: 'absolute',
          left: '143px',
          top: '898px',
          width: '892px',
          height: '1050px',
          overflow: 'hidden',
          pointerEvents: 'none',
        }}>
          <img 
            src={peopleBackground}
            alt=""
            style={{
              position: 'absolute',
              height: '162.05%',
              left: '-92.74%',
              top: '-20.87%',
              width: '286.41%',
              maxWidth: 'none',
            }}
          />
        </div>

        {/* Main card (109:626) */}
        <div style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          top: '381px',
          width: '1004px',
          height: '1661px',
          backdropFilter: 'blur(50px)',
          background: 'rgba(255,255,255,0.1)',
          border: '4px solid rgba(255,255,255,0.3)',
          borderRadius: '30px',
        }} />

        {/* Black card (109:631) */}
        <div style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          top: '437px',
          bottom: '577px',
          width: '898px',
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

          {/* Search input 1 (109:633) */}
          <div style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            top: '121px',
            width: '800px',
            height: '72px',
            backdropFilter: 'blur(50px)',
            border: '4px solid rgba(255,255,255,0.3)',
            borderRadius: '62px',
            overflow: 'hidden',
          }}>
            <img 
              src={searchIcon}
              alt=""
              style={{
                position: 'absolute',
                left: '18px',
                top: '14px',
                width: '38px',
                height: '38px',
              }}
            />
            {/* Placeholder text (109:635) */}
            <div style={{
              position: 'absolute',
              left: 'calc(50% - 331px)',
              top: '50%',
              transform: 'translateY(calc(-50% + 0.5px))',
              fontFamily: 'Gotham Pro',
              fontWeight: 300,
              fontSize: '27px',
              lineHeight: 1,
              color: '#848484',
              width: '545px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}>
              вставьте ссылку напрямую
            </div>
          </div>

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

          {/* Search input 2 (109:637) */}
          <div style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            top: '293px',
            width: '800px',
            height: '72px',
            backdropFilter: 'blur(50px)',
            border: '4px solid rgba(255,255,255,0.3)',
            borderRadius: '62px',
            overflow: 'hidden',
          }}>
            <img 
              src={searchIcon}
              alt=""
              style={{
                position: 'absolute',
                left: '18px',
                top: '14px',
                width: '38px',
                height: '38px',
              }}
            />
            {/* Placeholder text (109:639) - bottom: 30.56%, top: 31.94% */}
            <div style={{
              position: 'absolute',
              left: 'calc(50% - 331px)',
              top: 'calc(31.94% - 4px)',
              bottom: 'calc(30.56% - 4px)',
              fontFamily: 'Gotham Pro',
              fontWeight: 300,
              fontSize: '27px',
              lineHeight: 1,
              color: '#848484',
              width: '545px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}>
              напишите юзернейм аккаунта через @
            </div>
          </div>

          {/* Find button PNG (109:645) - bottom: 67.69%, top: 27.15% */}
          <img 
            src={promptPlate}
            alt="найти"
            style={{
              position: 'absolute',
              left: '50%',
              top: 'calc(27.15% - 1px)',
              bottom: 'calc(67.69% - 1px)',
              transform: 'translateX(calc(-50% + 0.47px))',
              width: '247px',
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

          {/* Username - CSS (109:667) - bottom: 51.37%, top: 45.9% */}
          <div style={{
            position: 'absolute',
            left: '50%',
            top: 'calc(45.9% - 1px)',
            bottom: 'calc(51.37% - 1px)',
            transform: 'translateX(calc(-50% - 27px))',
            width: '334px',
            fontFamily: 'Inter',
            fontWeight: 700,
            fontSize: '40px',
            lineHeight: 1,
            color: 'white',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}>
            @mishchenko.is
          </div>

          {/* Followers - CSS (109:668) - bottom: 48.7%, top: 49.61% */}
          <div style={{
            position: 'absolute',
            left: '50%',
            top: 'calc(49.61% - 1px)',
            bottom: 'calc(48.7% - 1px)',
            transform: 'translateX(calc(-50% - 22px))',
            width: '350px',
            fontFamily: 'Gotham Pro',
            fontWeight: 300,
            fontSize: '32px',
            lineHeight: 1,
            color: 'white',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}>
            275,5к подписчиков
          </div>

          {/* Tracking button (109:677) */}
          <img 
            src={trackingButton}
            alt="начать отслеживание"
            onClick={() => navigate('/laba-tracked')}
            style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              top: '879px',
              width: '530px',
              height: '139px',
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