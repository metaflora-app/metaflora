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

// Figma assets for new components
const plusIcon = "https://www.figma.com/api/mcp/asset/0dc48165-107b-42c8-bee1-d9db666914ba";
const instagramIcon = "https://www.figma.com/api/mcp/asset/1929f76c-8e7c-4fcc-9a3f-b91171856d9c";
const profilePhoto = "https://www.figma.com/api/mcp/asset/d147b598-cb98-41d2-9910-26b6a6414a9d";
const contentCards = "https://www.figma.com/api/mcp/asset/805a84b2-96d4-4b34-a706-6d62d1becb40";
const cardImage = "https://www.figma.com/api/mcp/asset/180d3b54-7faa-4f8d-b1b4-7ddedb63beb1";
const likeIcon = "https://www.figma.com/api/mcp/asset/c0ce73c6-ace7-4c35-af70-d1c7774de7e1";
const statsIcons = "https://www.figma.com/api/mcp/asset/e9785e5e-ebbf-4fdc-91c0-ff8c398daef3";
const playIcon = "https://www.figma.com/api/mcp/asset/7a1c0794-cfef-4af7-852d-36cbe3dded82";

export const LabaTrackedScreen: React.FC = () => {
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

        {/* Main title - отслеживание контента */}
        <div style={{
          position: 'absolute',
          left: '84px',
          top: '193px',
          width: '1020px',
          height: '83px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          fontFamily: 'Inter',
          fontWeight: 800,
          fontSize: '80px',
          lineHeight: 0,
          color: 'white',
        }}>
          <p style={{ margin: 0, lineHeight: 'normal', whiteSpace: 'pre-wrap' }}>
            отслеживание контента
          </p>
        </div>

        {/* Subtitle - добавьте аккаунт для отслеживания */}
        <div style={{
          position: 'absolute',
          left: '84px',
          top: '296px',
          width: '883px',
          height: '32px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          fontFamily: 'Gotham Pro',
          fontWeight: 300,
          fontSize: '40px',
          lineHeight: 0,
          color: 'white',
        }}>
          <p style={{ margin: 0, lineHeight: 'normal', whiteSpace: 'pre-wrap' }}>
            добавьте аккаунт для отслеживания
          </p>
        </div>

        {/* Account addition section - FIXED POSITIONING */}
        {/* Background for account addition */}
        <div style={{
          position: 'absolute',
          left: 'calc(50% - 261px)',
          top: '405px',
          width: '522px',
          height: '162px',
          backdropFilter: 'blur(50px)',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '4px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '30px',
        }} />

        {/* Profile photo - FIXED: left position */}
        <div style={{
          position: 'absolute',
          left: 'calc(50% - 366px)',
          top: 'calc(50% - 797px)',
          width: '98px',
          height: '98px',
          borderRadius: '640px',
        }}>
          <img 
            src={profilePhoto}
            alt="profile"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '640px',
            }}
          />
        </div>

        {/* Add account button - FIXED: right position */}
        <div style={{
          position: 'absolute',
          left: 'calc(50% + 9px)',
          top: 'calc(50% - 795px)',
          width: '98px',
          height: '98px',
          backdropFilter: 'blur(50px)',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '98px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            width: '59px',
            height: '59px',
            position: 'relative',
          }}>
            <img 
              src={plusIcon}
              alt="add"
              style={{
                position: 'absolute',
                inset: '3.13%',
                width: '100%',
                height: '100%',
                maxWidth: 'none',
              }}
            />
          </div>
        </div>

        {/* Instagram logo */}
        <div style={{
          position: 'absolute',
          left: '280px',
          top: '426px',
          width: '50px',
          height: '51px',
          opacity: 0.6,
        }}>
          <img 
            src={instagramIcon}
            alt="instagram"
            style={{
              position: 'absolute',
              height: '339.84%',
              left: '-56.27%',
              top: '-118.33%',
              width: '620.89%',
              maxWidth: 'none',
            }}
          />
        </div>

        {/* @mishchenko.is */}
        <div style={{
          position: 'absolute',
          left: '280px',
          top: '448px',
          width: '175px',
          height: '27px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          fontFamily: 'Inter',
          fontWeight: 700,
          fontSize: '27px',
          lineHeight: 0,
          color: 'white',
          textAlign: 'center',
        }}>
          <p style={{ margin: 0, lineHeight: 'normal', whiteSpace: 'pre-wrap' }}>
            @mishchenko.is
          </p>
        </div>

        {/* Followers count */}
        <div style={{
          position: 'absolute',
          left: 'calc(50% - 131px)',
          top: '523px',
          width: '262px',
          height: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          fontFamily: 'Gotham Pro',
          fontWeight: 300,
          fontSize: '24px',
          lineHeight: 0,
          color: 'white',
          textAlign: 'center',
        }}>
          <p style={{ margin: 0, lineHeight: 'normal', whiteSpace: 'pre-wrap' }}>
            275,5к подписчиков
          </p>
        </div>

        {/* RIGHT SIDE BUTTONS - FIXED POSITIONING */}
        {/* Кнопка вернуть - MOVED TO RIGHT */}
        <div style={{
          position: 'absolute',
          left: 'calc(50% + 291px)',
          top: '404px',
          width: '247px',
          height: '79px',
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
            fontFamily: 'Gotham Pro',
            fontWeight: 500,
            fontSize: '27px',
            color: 'white',
            textAlign: 'center',
          }}>
            вернуть
          </div>
        </div>

        {/* Кнопка сортировка - MOVED TO RIGHT */}
        <div style={{
          position: 'absolute',
          left: 'calc(50% + 291px)',
          top: '486px',
          width: '247px',
          height: '79px',
          backdropFilter: 'blur(50px)',
          background: 'rgba(0, 0, 0, 0.9)',
          border: '4px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '62px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}>
          {/* Decorative colors */}
          <div style={{ position: 'absolute', left: '73px', top: '-44px' }}>
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
                transform: 'rotate(16.918deg) skewX(344.434deg)',
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
            position: 'relative',
            zIndex: 1,
          }}>
            сортировка
          </div>
        </div>

        {/* Плашка лайки - POSITION SAME */}
        <div style={{
          position: 'absolute',
          left: 'calc(50% + 291px)',
          top: '564px',
          width: '186px',
          height: '79px',
          backdropFilter: 'blur(50px)',
          background: 'black',
          border: '4px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '62px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}>
          {/* Decorative colors */}
          <div style={{ position: 'absolute', left: '44px', top: '-43px' }}>
            <div style={{
              position: 'absolute',
              left: '48px',
              top: '-35.34px',
              width: '83.508px',
              height: '111.187px',
              background: '#fdc615',
              borderRadius: '1568.563px',
            }} />
            <div style={{
              position: 'absolute',
              left: '68.88px',
              top: '-39px',
              width: '74.118px',
              height: '81.294px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <div style={{
                transform: 'rotate(21.025deg) skewX(353.781deg)',
                width: '43.016px',
                height: '74.104px',
                background: '#fdc615',
                borderRadius: '1568.563px',
              }} />
            </div>
            <div style={{
              position: 'absolute',
              left: '86px',
              top: '47px',
              width: '45.989px',
              height: '75.368px',
              background: '#fffdc6',
              borderRadius: '1568.563px',
            }} />
          </div>
          <div style={{
            fontFamily: 'Gotham Pro',
            fontWeight: 500,
            fontSize: '27px',
            color: 'white',
            textAlign: 'center',
            position: 'relative',
            zIndex: 1,
          }}>
            &gt;лайков
          </div>
        </div>

        {/* Main content window (окошко) with cards */}
        <div style={{
          position: 'absolute',
          left: 'calc(50% + 3px)',
          top: '673px',
          width: '884px',
          height: '1369px',
          backdropFilter: 'blur(50px)',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '4px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '30px',
          transform: 'translateX(-50%)',
          overflow: 'hidden',
        }}>
          {/* Card 1 */}
          <div style={{
            position: 'absolute',
            left: '22px',
            top: '23px',
            width: '410px',
            height: '782px',
            backdropFilter: 'blur(50px)',
            background: 'black',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '30px',
          }}>
            {/* Card image */}
            <div style={{
              position: 'absolute',
              left: '27px',
              top: '27px',
              width: '355px',
              height: '355px',
              borderRadius: '25px',
              border: '2px solid rgba(0, 0, 0, 0.3)',
              overflow: 'hidden',
            }}>
              <img 
                src={cardImage}
                alt=""
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </div>

            {/* Play button */}
            <div style={{
              position: 'absolute',
              left: '150px',
              top: '178px',
              width: '100px',
              height: '100px',
              backdropFilter: 'blur(50px)',
              background: 'rgba(0, 0, 0, 0.1)',
              border: '4px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '62px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <img 
                src={playIcon}
                alt="play"
                style={{
                  width: '60px',
                  height: '60px',
                  transform: 'rotate(90deg)',
                }}
              />
            </div>

            {/* Instagram logo in card */}
            <div style={{
              position: 'absolute',
              left: '30px',
              top: '448px',
              width: '50px',
              height: '51px',
              opacity: 0.6,
            }}>
              <img 
                src={instagramIcon}
                alt="instagram"
                style={{
                  position: 'absolute',
                  height: '339.84%',
                  left: '-56.27%',
                  top: '-118.33%',
                  width: '620.89%',
                  maxWidth: 'none',
                }}
              />
            </div>

            {/* @mishchenko.is in card */}
            <div style={{
              position: 'absolute',
              left: '30px',
              top: '525px',
              width: '350px',
              height: '42px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              fontFamily: 'Inter',
              fontWeight: 700,
              fontSize: '40px',
              lineHeight: 0,
              color: 'white',
              textAlign: 'center',
            }}>
              <p style={{ margin: 0, lineHeight: 'normal' }}>@mishchenko.is</p>
            </div>

            {/* Followers in card */}
            <div style={{
              position: 'absolute',
              left: '27px',
              top: '583px',
              width: '355px',
              height: '27px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              fontFamily: 'Gotham Pro',
              fontWeight: 300,
              fontSize: '32px',
              lineHeight: 0,
              color: 'white',
              textAlign: 'center',
            }}>
              <p style={{ margin: 0, lineHeight: 'normal' }}>275,5к подписчиков</p>
            </div>

            {/* Stats bar */}
            <div style={{
              position: 'absolute',
              left: '39px',
              top: '365px',
              width: '333px',
              height: '52px',
              backdropFilter: 'blur(50px)',
              background: 'black',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '40px',
            }}>
              <span style={{ fontFamily: 'Gotham Pro', fontWeight: 500, fontSize: '27px', color: 'white' }}>227к</span>
              <span style={{ fontFamily: 'Gotham Pro', fontWeight: 500, fontSize: '27px', color: 'white' }}>40к</span>
              <span style={{ fontFamily: 'Gotham Pro', fontWeight: 500, fontSize: '27px', color: 'white' }}>2к</span>
            </div>

            {/* Time badge */}
            <div style={{
              position: 'absolute',
              left: '95px',
              top: '417px',
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
              <span style={{ fontFamily: 'Gotham Pro', fontWeight: 500, fontSize: '23px', color: 'white' }}>2 месяца назад</span>
            </div>

            {/* Analysis button */}
            <div 
              onClick={() => navigate('/laba-analysis')}
              style={{
                position: 'absolute',
                left: '82px',
                top: '640px',
                width: '247px',
                height: '79px',
                backdropFilter: 'blur(50px)',
                background: 'rgba(0, 0, 0, 0.9)',
                border: '4px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '62px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontFamily: 'Gotham Pro', fontWeight: 500, fontSize: '27px', color: 'white' }}>анализ</span>
            </div>
          </div>

          {/* Card 2 - Similar structure */}
          <div style={{
            position: 'absolute',
            left: '444px',
            top: '23px',
            width: '410px',
            height: '782px',
            backdropFilter: 'blur(50px)',
            background: 'black',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '30px',
          }}>
            {/* Similar content structure for second card */}
            <div style={{
              position: 'absolute',
              left: '27px',
              top: '27px',
              width: '355px',
              height: '355px',
              borderRadius: '25px',
              border: '2px solid rgba(0, 0, 0, 0.3)',
              overflow: 'hidden',
            }}>
              <img 
                src={cardImage}
                alt=""
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </div>

            <div style={{
              position: 'absolute',
              left: '150px',
              top: '178px',
              width: '100px',
              height: '100px',
              backdropFilter: 'blur(50px)',
              background: 'rgba(0, 0, 0, 0.1)',
              border: '4px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '62px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <img 
                src={playIcon}
                alt="play"
                style={{
                  width: '60px',
                  height: '60px',
                  transform: 'rotate(90deg)',
                }}
              />
            </div>

            <div style={{
              position: 'absolute',
              left: '30px',
              top: '525px',
              width: '350px',
              height: '42px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              fontFamily: 'Inter',
              fontWeight: 700,
              fontSize: '40px',
              lineHeight: 0,
              color: 'white',
              textAlign: 'center',
            }}>
              <p style={{ margin: 0, lineHeight: 'normal' }}>@mishchenko.is</p>
            </div>

            <div style={{
              position: 'absolute',
              left: '82px',
              top: '640px',
              width: '247px',
              height: '79px',
              backdropFilter: 'blur(50px)',
              background: 'rgba(0, 0, 0, 0.9)',
              border: '4px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '62px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}>
              <span style={{ fontFamily: 'Gotham Pro', fontWeight: 500, fontSize: '27px', color: 'white' }}>анализ</span>
            </div>
          </div>

          {/* Cards 3 and 4 - bottom row */}
          <div style={{
            position: 'absolute',
            left: '22px',
            top: '828px',
            width: '410px',
            height: '782px',
            backdropFilter: 'blur(50px)',
            background: 'black',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '30px',
          }}>
            <div style={{
              position: 'absolute',
              left: '27px',
              top: '27px',
              width: '355px',
              height: '355px',
              borderRadius: '25px',
              border: '2px solid rgba(0, 0, 0, 0.3)',
              overflow: 'hidden',
            }}>
              <img 
                src={cardImage}
                alt=""
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </div>

            <div style={{
              position: 'absolute',
              left: '30px',
              top: '525px',
              width: '350px',
              height: '42px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              fontFamily: 'Inter',
              fontWeight: 700,
              fontSize: '40px',
              lineHeight: 0,
              color: 'white',
              textAlign: 'center',
            }}>
              <p style={{ margin: 0, lineHeight: 'normal' }}>@mishchenko.is</p>
            </div>

            <div style={{
              position: 'absolute',
              left: '82px',
              top: '640px',
              width: '247px',
              height: '79px',
              backdropFilter: 'blur(50px)',
              background: 'rgba(0, 0, 0, 0.9)',
              border: '4px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '62px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}>
              <span style={{ fontFamily: 'Gotham Pro', fontWeight: 500, fontSize: '27px', color: 'white' }}>анализ</span>
            </div>
          </div>

          <div style={{
            position: 'absolute',
            left: '444px',
            top: '828px',
            width: '410px',
            height: '782px',
            backdropFilter: 'blur(50px)',
            background: 'black',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '30px',
          }}>
            <div style={{
              position: 'absolute',
              left: '27px',
              top: '27px',
              width: '355px',
              height: '355px',
              borderRadius: '25px',
              border: '2px solid rgba(0, 0, 0, 0.3)',
              overflow: 'hidden',
            }}>
              <img 
                src={cardImage}
                alt=""
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </div>

            <div style={{
              position: 'absolute',
              left: '30px',
              top: '525px',
              width: '350px',
              height: '42px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              fontFamily: 'Inter',
              fontWeight: 700,
              fontSize: '40px',
              lineHeight: 0,
              color: 'white',
              textAlign: 'center',
            }}>
              <p style={{ margin: 0, lineHeight: 'normal' }}>@mishchenko.is</p>
            </div>

            <div style={{
              position: 'absolute',
              left: '82px',
              top: '640px',
              width: '247px',
              height: '79px',
              backdropFilter: 'blur(50px)',
              background: 'rgba(0, 0, 0, 0.9)',
              border: '4px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '62px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}>
              <span style={{ fontFamily: 'Gotham Pro', fontWeight: 500, fontSize: '27px', color: 'white' }}>анализ</span>
            </div>
          </div>
        </div>

        {/* Background image */}
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
            src={contentCards}
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