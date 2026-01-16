import React from 'react';
import { useNavigate } from 'react-router-dom';

// Background & header from laba-main
import bgPattern from '../../assets/figma-welcome/pattern.png';
import smallLogo from '../../assets/figma-welcome/logo-small.png';
import supportButtonPNG from '../../assets/tour-video/support-button.png';
import socialsIconsFooter from '../../assets/welcome-elements/socials-icons.png';

// Filter buttons from laba-main
import returnButtonPNG from '../../assets/laba-main/кнопка вернуть.png';
import sortButtonPNG from '../../assets/laba-main/кнопка сортировка.png';
import likesBadgePNG from '../../assets/laba-main/плашка лайки.png';

// Card assets from laba-main
import analysisButtonPNG from '../../assets/laba-main/кнопка анализ.png';
import likeIconPNG from '../../assets/laba-main/лайк.png';
import cardImage from '../../assets/laba-main/картинка в карточке промпта.png';

// Figma MCP assets
const footerLogo = "https://www.figma.com/api/mcp/asset/3bd9d147-154a-4929-aab7-9df5b0793789";
const backArrow = "https://www.figma.com/api/mcp/asset/df23cbdc-6a1c-47c3-8b9f-97ecb4397784";
const homeVector1 = "https://www.figma.com/api/mcp/asset/8f6661d8-2d62-49c8-ae88-5e19d118e967";
const homeVector2 = "https://www.figma.com/api/mcp/asset/4a9951a6-1fa4-45c0-a766-090a909e4bed";
const plusIcon = "https://www.figma.com/api/mcp/asset/ce2c6022-721d-44c1-b0a2-c54c0b0500d6";
const instagramIcon = "https://www.figma.com/api/mcp/asset/a7d94141-35b1-4809-809c-ed13df5d56f8";
const profilePhoto = "https://www.figma.com/api/mcp/asset/b15dcf69-e982-4fa0-8cdd-5dde8a1df7dc";
const peopleImage = "https://www.figma.com/api/mcp/asset/882d0069-a777-43bb-8d98-35cdf5b184ca";
const playIcon = "https://www.figma.com/api/mcp/asset/8ca3a30c-2ba8-4c9b-839c-86a31fd5d54e";
const statusBarIcons = "https://www.figma.com/api/mcp/asset/3f2b218f-ce7e-4476-801e-c4f2c0cb134c";
const instaLogoIcon = "https://www.figma.com/api/mcp/asset/939902d8-304e-4ab2-a982-2eb9c0274c17";

export const LabaTrackedScreen: React.FC = () => {
  const navigate = useNavigate();
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

        {/* Title "отслеживание контента" - 174:801 */}
        <div style={{
          position: 'absolute',
          left: '85px',
          top: '193px',
          width: '1020px',
          height: '80px',
          fontFamily: 'Inter, sans-serif',
          fontWeight: 800,
          fontSize: '80px',
          color: 'white',
          textAlign: 'center',
          lineHeight: '80px',
        }}>
          отслеживание контента
        </div>

        {/* Subtitle "добавьте аккаунт для отслеживания" - 174:803 x=85, y=295, w=882, h=40 */}
        <div style={{
          position: 'absolute',
          left: '85px',
          top: '295px',
          width: '882px',
          height: '40px',
          fontFamily: 'Gotham Pro, sans-serif',
          fontWeight: 300,
          fontSize: '40px',
          color: 'white',
          textAlign: 'center',
          lineHeight: '40px',
        }}>
          добавьте аккаунт для отслеживания
        </div>

        {/* Account card with @mishchenko.is - 7:1181 */}
        <div style={{
          position: 'absolute',
          left: '151px',
          top: '405px',
          width: '522px',
          height: '162px',
          backdropFilter: 'blur(50px)',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '4px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '30px',
        }}>
          {/* Profile photo - 7:1184 x=175, y=429 */}
          <div style={{
            position: 'absolute',
            left: '24px',
            top: '24px',
            width: '98px',
            height: '98px',
            borderRadius: '640px',
            overflow: 'hidden',
          }}>
            <img
              src={profilePhoto}
              alt=""
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

          {/* Instagram icon - 174:787 x=280, y=426 */}
          <div style={{
            position: 'absolute',
            left: '129px',
            top: '21px',
            width: '49px',
            height: '59px',
          }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              opacity: 0.6,
              overflow: 'hidden',
              pointerEvents: 'none',
            }}>
              <img
                src={instagramIcon}
                alt=""
                style={{
                  position: 'absolute',
                  height: '339.84%',
                  left: '-56.27%',
                  maxWidth: 'none',
                  top: '-118.33%',
                  width: '620.89%',
                }}
              />
            </div>
          </div>

          {/* Username - 174:788 x=280, y=477, w=235, h=42 */}
          <div style={{
            position: 'absolute',
            left: '129px',
            top: '72px',
            width: '235px',
            height: '42px',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 700,
            fontSize: '27px',
            color: 'white',
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            lineHeight: 0,
          }}>
            <p style={{ lineHeight: 'normal', whiteSpace: 'pre-wrap', margin: 0 }}>@mishchenko.is</p>
          </div>

          {/* Followers - 174:805 x=280, y=522, w=262, h=26 */}
          <div style={{
            position: 'absolute',
            left: '129px',
            top: '117px',
            width: '262px',
            height: '26px',
            fontFamily: 'Gotham Pro, sans-serif',
            fontWeight: 300,
            fontSize: '24px',
            color: 'white',
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            lineHeight: 0,
          }}>
            <p style={{ lineHeight: 'normal', whiteSpace: 'pre-wrap', margin: 0 }}>275,5к подписчиков</p>
          </div>

          {/* Plus button - 7:1188 x=550, y=431 */}
          <div style={{
            position: 'absolute',
            left: '399px',
            top: '26px',
            width: '98px',
            height: '98px',
            backdropFilter: 'blur(50px)',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '98px',
            overflow: 'clip',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}>
            <div style={{
              position: 'absolute',
              left: '19px',
              top: '19px',
              width: '59px',
              height: '59px',
            }}>
              <div style={{ position: 'absolute', inset: '3.13%' }}>
                <img src={plusIcon} alt="" style={{ width: '100%', height: '100%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Filter buttons - вернуть - 174:774 PNG: 247x80 */}
        <img
          src={returnButtonPNG}
          alt="вернуть"
          style={{
            position: 'absolute',
            left: '788px',
            top: '405px',
            width: '186px',
            height: '79px',
            objectFit: 'contain',
            cursor: 'pointer',
          }}
        />

        {/* Filter buttons - сортировка - 174:780 PNG: 247x80 */}
        <img
          src={sortButtonPNG}
          alt="сортировка"
          style={{
            position: 'absolute',
            left: '788px',
            top: '485px',
            width: '216px',
            height: '79px',
            objectFit: 'contain',
            cursor: 'pointer',
          }}
        />

        {/* Badge likes - 174:768 PNG: 558x237 */}
        <img
          src={likesBadgePNG}
          alt=">лайков"
          style={{
            position: 'absolute',
            left: '788px',
            top: '564px',
            width: '186px',
            height: '79px',
            objectFit: 'contain',
          }}
        />

        {/* People image behind frame */}
        <div style={{
          position: 'absolute',
          height: '1050px',
          left: '143px',
          top: '898px',
          width: '892px',
          zIndex: 0,
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            pointerEvents: 'none',
          }}>
            <img
              src={peopleImage}
              alt=""
              style={{
                position: 'absolute',
                height: '162.05%',
                left: '-92.74%',
                maxWidth: 'none',
                top: '-20.87%',
                width: '286.41%',
              }}
            />
          </div>
        </div>

        {/* Main content window */}
        <div style={{
          position: 'absolute',
          backdropFilter: 'blur(50px)',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '4px solid rgba(255, 255, 255, 0.3)',
          height: '1369px',
          left: 'calc(50% + 3px)',
          borderRadius: '30px',
          top: '673px',
          width: '884px',
          transform: 'translateX(-50%)',
          overflow: 'auto',
          zIndex: 10,
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
                src={cardImage}
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

            <div style={{
              position: 'absolute',
              top: '5.63%',
              right: '9.95%',
              bottom: '89.77%',
              left: '57.32%',
              backdropFilter: 'blur(50px)',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '62px',
              overflow: 'clip',
            }}>
              <div style={{
                position: 'absolute',
                left: 'calc(50% - 0.6px)',
                top: 'calc(50% - 0.5px)',
                transform: 'translate(-50%, -50%)',
                width: '111px',
                height: '19px',
                fontFamily: 'Gotham Pro, sans-serif',
                fontWeight: 500,
                fontSize: '18px',
                color: 'white',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                lineHeight: 0,
              }}>
                <p style={{ lineHeight: 'normal', whiteSpace: 'pre-wrap', margin: 0 }}>новое</p>
              </div>
            </div>

            <div style={{
              position: 'absolute',
              top: '5.63%',
              right: '80.98%',
              bottom: '89.77%',
              left: '10.24%',
            }}>
              <img src={likeIconPNG} alt="лайк" style={{ width: '100%', height: '100%' }} />
            </div>

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
              overflow: 'clip',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <div style={{
                transform: 'rotate(90deg)',
                width: '60px',
                height: '60px',
                position: 'relative',
              }}>
                <img src={playIcon} alt="" style={{ width: '100%', height: '100%', maxWidth: 'none' }} />
              </div>
            </div>

            <div style={{
              position: 'absolute',
              backdropFilter: 'blur(50px)',
              background: '#000',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              height: '52px',
              left: 'calc(50% + 0.5px)',
              borderRadius: '30px',
              top: '365px',
              transform: 'translateX(-50%)',
              width: '333px',
              overflow: 'clip',
            }}>
              <div style={{
                position: 'absolute',
                height: '39px',
                left: '21px',
                top: '5px',
                width: '46px',
              }}>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  overflow: 'hidden',
                  pointerEvents: 'none',
                }}>
                  <img 
                    src={statusBarIcons}
                    alt=""
                    style={{
                      position: 'absolute',
                      height: '339.22%',
                      left: '-69.53%',
                      maxWidth: 'none',
                      top: '-115.69%',
                      width: '426.73%',
                    }}
                  />
                </div>
              </div>

              <div style={{
                position: 'absolute',
                height: '39px',
                left: '132px',
                top: '4px',
                width: '40px',
              }}>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  overflow: 'hidden',
                  pointerEvents: 'none',
                }}>
                  <img 
                    src={statusBarIcons}
                    alt=""
                    style={{
                      position: 'absolute',
                      height: '339.22%',
                      left: '-193.75%',
                      maxWidth: 'none',
                      top: '-115.69%',
                      width: '487.69%',
                    }}
                  />
                </div>
              </div>

              <div style={{
                position: 'absolute',
                height: '39px',
                left: '228px',
                top: '5px',
                width: '40px',
              }}>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  overflow: 'hidden',
                  pointerEvents: 'none',
                }}>
                  <img 
                    src={statusBarIcons}
                    alt=""
                    style={{
                      position: 'absolute',
                      height: '339.22%',
                      left: '-304.47%',
                      maxWidth: 'none',
                      top: '-115.69%',
                      width: '487.69%',
                    }}
                  />
                </div>
              </div>

              <div style={{
                position: 'absolute',
                bottom: 'calc(30.77% - 2px)',
                display: 'flex',
                flexDirection: 'column',
                fontFamily: 'Gotham Pro, sans-serif',
                fontWeight: 500,
                justifyContent: 'center',
                left: 'calc(50% - 68px)',
                lineHeight: 0,
                fontSize: '27px',
                textAlign: 'center',
                color: 'white',
                top: 'calc(30.77% - 2px)',
                transform: 'translateX(-50%)',
                width: '73px',
              }}>
                <p style={{ lineHeight: 'normal', whiteSpace: 'pre-wrap', margin: 0 }}>227к</p>
              </div>

              <div style={{
                position: 'absolute',
                bottom: 'calc(31.39% - 2px)',
                display: 'flex',
                flexDirection: 'column',
                fontFamily: 'Gotham Pro, sans-serif',
                fontWeight: 500,
                justifyContent: 'center',
                left: 'calc(50% + 33px)',
                lineHeight: 0,
                fontSize: '27px',
                textAlign: 'center',
                color: 'white',
                top: 'calc(30.77% - 2px)',
                transform: 'translateX(-50%)',
                width: '55px',
              }}>
                <p style={{ lineHeight: 'normal', whiteSpace: 'pre-wrap', margin: 0 }}>40к</p>
              </div>

              <div style={{
                position: 'absolute',
                bottom: 'calc(31.39% - 2px)',
                display: 'flex',
                flexDirection: 'column',
                fontFamily: 'Gotham Pro, sans-serif',
                fontWeight: 500,
                justifyContent: 'center',
                left: 'calc(50% + 120px)',
                lineHeight: 0,
                fontSize: '27px',
                textAlign: 'center',
                color: 'white',
                top: 'calc(30.77% - 2px)',
                transform: 'translateX(-50%)',
                width: '35px',
              }}>
                <p style={{ lineHeight: 'normal', whiteSpace: 'pre-wrap', margin: 0 }}>2к</p>
              </div>
            </div>

            <div style={{
              position: 'absolute',
              left: '7.32%',
              right: '77.07%',
              top: '448px',
              aspectRatio: '42/51',
            }}>
              <div style={{
                position: 'absolute',
                inset: 0,
                opacity: 0.6,
                overflow: 'hidden',
                pointerEvents: 'none',
              }}>
                <img 
                  src={instaLogoIcon}
                  alt=""
                  style={{
                    position: 'absolute',
                    height: '339.84%',
                    left: '-56.27%',
                    maxWidth: 'none',
                    top: '-118.33%',
                    width: '620.89%',
                  }}
                />
              </div>
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

            <img
              src={analysisButtonPNG}
              alt="анализ" 
              onClick={() => navigate('/laba-analysis')}
              style={{
                position: 'absolute',
                bottom: '63px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '248px',
                height: '79px',
                cursor: 'pointer',
              }}
            />

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

          {/* Карточка 2 - Верхняя правая */}
          <div style={{
            position: 'absolute',
            left: '444px',
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
                src={cardImage}
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

            <div style={{
              position: 'absolute',
              top: '5.63%',
              right: '9.95%',
              bottom: '89.77%',
              left: '57.32%',
              backdropFilter: 'blur(50px)',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '62px',
              overflow: 'clip',
            }}>
              <div style={{
                position: 'absolute',
                left: 'calc(50% - 0.6px)',
                top: 'calc(50% - 0.5px)',
                transform: 'translate(-50%, -50%)',
                width: '111px',
                height: '19px',
                fontFamily: 'Gotham Pro, sans-serif',
                fontWeight: 500,
                fontSize: '18px',
                color: 'white',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                lineHeight: 0,
              }}>
                <p style={{ lineHeight: 'normal', whiteSpace: 'pre-wrap', margin: 0 }}>новое</p>
              </div>
            </div>

            <div style={{
              position: 'absolute',
              top: '5.63%',
              right: '80.98%',
              bottom: '89.77%',
              left: '10.24%',
            }}>
              <img src={likeIconPNG} alt="лайк" style={{ width: '100%', height: '100%' }} />
            </div>

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
              overflow: 'clip',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <div style={{
                transform: 'rotate(90deg)',
                width: '60px',
                height: '60px',
                position: 'relative',
              }}>
                <img src={playIcon} alt="" style={{ width: '100%', height: '100%', maxWidth: 'none' }} />
              </div>
            </div>

            <div style={{
              position: 'absolute',
              backdropFilter: 'blur(50px)',
              background: '#000',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              height: '52px',
              left: 'calc(50% + 0.5px)',
              borderRadius: '30px',
              top: '365px',
              transform: 'translateX(-50%)',
              width: '333px',
              overflow: 'clip',
            }}>
              <div style={{
                position: 'absolute',
                height: '39px',
                left: '21px',
                top: '5px',
                width: '46px',
              }}>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  overflow: 'hidden',
                  pointerEvents: 'none',
                }}>
                  <img 
                    src={statusBarIcons}
                    alt=""
                    style={{
                      position: 'absolute',
                      height: '339.22%',
                      left: '-69.53%',
                      maxWidth: 'none',
                      top: '-115.69%',
                      width: '426.73%',
                    }}
                  />
                </div>
              </div>

              <div style={{
                position: 'absolute',
                height: '39px',
                left: '132px',
                top: '4px',
                width: '40px',
              }}>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  overflow: 'hidden',
                  pointerEvents: 'none',
                }}>
                  <img 
                    src={statusBarIcons}
                    alt=""
                    style={{
                      position: 'absolute',
                      height: '339.22%',
                      left: '-193.75%',
                      maxWidth: 'none',
                      top: '-115.69%',
                      width: '487.69%',
                    }}
                  />
                </div>
              </div>

              <div style={{
                position: 'absolute',
                height: '39px',
                left: '228px',
                top: '5px',
                width: '40px',
              }}>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  overflow: 'hidden',
                  pointerEvents: 'none',
                }}>
                  <img 
                    src={statusBarIcons}
                    alt=""
                    style={{
                      position: 'absolute',
                      height: '339.22%',
                      left: '-304.47%',
                      maxWidth: 'none',
                      top: '-115.69%',
                      width: '487.69%',
                    }}
                  />
                </div>
              </div>

              <div style={{
                position: 'absolute',
                bottom: 'calc(30.77% - 2px)',
                display: 'flex',
                flexDirection: 'column',
                fontFamily: 'Gotham Pro, sans-serif',
                fontWeight: 500,
                justifyContent: 'center',
                left: 'calc(50% - 68px)',
                lineHeight: 0,
                fontSize: '27px',
                textAlign: 'center',
                color: 'white',
                top: 'calc(30.77% - 2px)',
                transform: 'translateX(-50%)',
                width: '73px',
              }}>
                <p style={{ lineHeight: 'normal', whiteSpace: 'pre-wrap', margin: 0 }}>227к</p>
              </div>

              <div style={{
                position: 'absolute',
                bottom: 'calc(31.39% - 2px)',
                display: 'flex',
                flexDirection: 'column',
                fontFamily: 'Gotham Pro, sans-serif',
                fontWeight: 500,
                justifyContent: 'center',
                left: 'calc(50% + 33px)',
                lineHeight: 0,
                fontSize: '27px',
                textAlign: 'center',
                color: 'white',
                top: 'calc(30.77% - 2px)',
                transform: 'translateX(-50%)',
                width: '55px',
              }}>
                <p style={{ lineHeight: 'normal', whiteSpace: 'pre-wrap', margin: 0 }}>40к</p>
              </div>

              <div style={{
                position: 'absolute',
                bottom: 'calc(31.39% - 2px)',
                display: 'flex',
                flexDirection: 'column',
                fontFamily: 'Gotham Pro, sans-serif',
                fontWeight: 500,
                justifyContent: 'center',
                left: 'calc(50% + 120px)',
                lineHeight: 0,
                fontSize: '27px',
                textAlign: 'center',
                color: 'white',
                top: 'calc(30.77% - 2px)',
                transform: 'translateX(-50%)',
                width: '35px',
              }}>
                <p style={{ lineHeight: 'normal', whiteSpace: 'pre-wrap', margin: 0 }}>2к</p>
              </div>
            </div>

            <div style={{
              position: 'absolute',
              left: '7.32%',
              right: '77.07%',
              top: '448px',
              aspectRatio: '42/51',
            }}>
              <div style={{
                position: 'absolute',
                inset: 0,
                opacity: 0.6,
                overflow: 'hidden',
                pointerEvents: 'none',
              }}>
                <img 
                  src={instaLogoIcon}
                  alt=""
                  style={{
                    position: 'absolute',
                    height: '339.84%',
                    left: '-56.27%',
                    maxWidth: 'none',
                    top: '-118.33%',
                    width: '620.89%',
                  }}
                />
              </div>
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

            <img
              src={analysisButtonPNG}
              alt="анализ" 
              onClick={() => navigate('/laba-analysis')}
              style={{
                position: 'absolute',
                bottom: '63px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '248px',
                height: '79px',
                cursor: 'pointer',
              }}
            />

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

          {/* Карточка 3 - Нижняя левая */}
          <div style={{
            position: 'absolute',
            left: '22px',
            top: '828px',
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
                src={cardImage}
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

            <div style={{
              position: 'absolute',
              top: '5.63%',
              right: '9.95%',
              bottom: '89.77%',
              left: '57.32%',
              backdropFilter: 'blur(50px)',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '62px',
              overflow: 'clip',
            }}>
              <div style={{
                position: 'absolute',
                left: 'calc(50% - 0.6px)',
                top: 'calc(50% - 0.5px)',
                transform: 'translate(-50%, -50%)',
                width: '111px',
                height: '19px',
                fontFamily: 'Gotham Pro, sans-serif',
                fontWeight: 500,
                fontSize: '18px',
                color: 'white',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                lineHeight: 0,
              }}>
                <p style={{ lineHeight: 'normal', whiteSpace: 'pre-wrap', margin: 0 }}>новое</p>
              </div>
            </div>

            <div style={{
              position: 'absolute',
              top: '5.63%',
              right: '80.98%',
              bottom: '89.77%',
              left: '10.24%',
            }}>
              <img src={likeIconPNG} alt="лайк" style={{ width: '100%', height: '100%' }} />
            </div>

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
              overflow: 'clip',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <div style={{
                transform: 'rotate(90deg)',
                width: '60px',
                height: '60px',
                position: 'relative',
              }}>
                <img src={playIcon} alt="" style={{ width: '100%', height: '100%', maxWidth: 'none' }} />
              </div>
            </div>

            <div style={{
              position: 'absolute',
              backdropFilter: 'blur(50px)',
              background: '#000',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              height: '52px',
              left: 'calc(50% + 0.5px)',
              borderRadius: '30px',
              top: '365px',
              transform: 'translateX(-50%)',
              width: '333px',
              overflow: 'clip',
            }}>
              <div style={{
                position: 'absolute',
                height: '39px',
                left: '21px',
                top: '5px',
                width: '46px',
              }}>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  overflow: 'hidden',
                  pointerEvents: 'none',
                }}>
                  <img 
                    src={statusBarIcons}
                    alt=""
                    style={{
                      position: 'absolute',
                      height: '339.22%',
                      left: '-69.53%',
                      maxWidth: 'none',
                      top: '-115.69%',
                      width: '426.73%',
                    }}
                  />
                </div>
              </div>

              <div style={{
                position: 'absolute',
                height: '39px',
                left: '132px',
                top: '4px',
                width: '40px',
              }}>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  overflow: 'hidden',
                  pointerEvents: 'none',
                }}>
                  <img 
                    src={statusBarIcons}
                    alt=""
                    style={{
                      position: 'absolute',
                      height: '339.22%',
                      left: '-193.75%',
                      maxWidth: 'none',
                      top: '-115.69%',
                      width: '487.69%',
                    }}
                  />
                </div>
              </div>

              <div style={{
                position: 'absolute',
                height: '39px',
                left: '228px',
                top: '5px',
                width: '40px',
              }}>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  overflow: 'hidden',
                  pointerEvents: 'none',
                }}>
                  <img 
                    src={statusBarIcons}
                    alt=""
                    style={{
                      position: 'absolute',
                      height: '339.22%',
                      left: '-304.47%',
                      maxWidth: 'none',
                      top: '-115.69%',
                      width: '487.69%',
                    }}
                  />
                </div>
              </div>

              <div style={{
                position: 'absolute',
                bottom: 'calc(30.77% - 2px)',
                display: 'flex',
                flexDirection: 'column',
                fontFamily: 'Gotham Pro, sans-serif',
                fontWeight: 500,
                justifyContent: 'center',
                left: 'calc(50% - 68px)',
                lineHeight: 0,
                fontSize: '27px',
                textAlign: 'center',
                color: 'white',
                top: 'calc(30.77% - 2px)',
                transform: 'translateX(-50%)',
                width: '73px',
              }}>
                <p style={{ lineHeight: 'normal', whiteSpace: 'pre-wrap', margin: 0 }}>227к</p>
              </div>

              <div style={{
                position: 'absolute',
                bottom: 'calc(31.39% - 2px)',
                display: 'flex',
                flexDirection: 'column',
                fontFamily: 'Gotham Pro, sans-serif',
                fontWeight: 500,
                justifyContent: 'center',
                left: 'calc(50% + 33px)',
                lineHeight: 0,
                fontSize: '27px',
                textAlign: 'center',
                color: 'white',
                top: 'calc(30.77% - 2px)',
                transform: 'translateX(-50%)',
                width: '55px',
              }}>
                <p style={{ lineHeight: 'normal', whiteSpace: 'pre-wrap', margin: 0 }}>40к</p>
              </div>

              <div style={{
                position: 'absolute',
                bottom: 'calc(31.39% - 2px)',
                display: 'flex',
                flexDirection: 'column',
                fontFamily: 'Gotham Pro, sans-serif',
                fontWeight: 500,
                justifyContent: 'center',
                left: 'calc(50% + 120px)',
                lineHeight: 0,
                fontSize: '27px',
                textAlign: 'center',
                color: 'white',
                top: 'calc(30.77% - 2px)',
                transform: 'translateX(-50%)',
                width: '35px',
              }}>
                <p style={{ lineHeight: 'normal', whiteSpace: 'pre-wrap', margin: 0 }}>2к</p>
              </div>
            </div>

            <div style={{
              position: 'absolute',
              left: '7.32%',
              right: '77.07%',
              top: '448px',
              aspectRatio: '42/51',
            }}>
              <div style={{
                position: 'absolute',
                inset: 0,
                opacity: 0.6,
                overflow: 'hidden',
                pointerEvents: 'none',
              }}>
                <img 
                  src={instaLogoIcon}
                  alt=""
                  style={{
                    position: 'absolute',
                    height: '339.84%',
                    left: '-56.27%',
                    maxWidth: 'none',
                    top: '-118.33%',
                    width: '620.89%',
                  }}
                />
              </div>
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

            <img
              src={analysisButtonPNG}
              alt="анализ" 
              onClick={() => navigate('/laba-analysis')}
              style={{
                position: 'absolute',
                bottom: '63px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '248px',
                height: '79px',
                cursor: 'pointer',
              }}
            />

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

          {/* Карточка 4 - Нижняя правая */}
          <div style={{
            position: 'absolute',
            left: '444px',
            top: '828px',
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
                src={cardImage}
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

            <div style={{
              position: 'absolute',
              top: '5.63%',
              right: '9.95%',
              bottom: '89.77%',
              left: '57.32%',
              backdropFilter: 'blur(50px)',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '62px',
              overflow: 'clip',
            }}>
              <div style={{
                position: 'absolute',
                left: 'calc(50% - 0.6px)',
                top: 'calc(50% - 0.5px)',
                transform: 'translate(-50%, -50%)',
                width: '111px',
                height: '19px',
                fontFamily: 'Gotham Pro, sans-serif',
                fontWeight: 500,
                fontSize: '18px',
                color: 'white',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                lineHeight: 0,
              }}>
                <p style={{ lineHeight: 'normal', whiteSpace: 'pre-wrap', margin: 0 }}>новое</p>
              </div>
            </div>

            <div style={{
              position: 'absolute',
              top: '5.63%',
              right: '80.98%',
              bottom: '89.77%',
              left: '10.24%',
            }}>
              <img src={likeIconPNG} alt="лайк" style={{ width: '100%', height: '100%' }} />
            </div>

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
              overflow: 'clip',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <div style={{
                transform: 'rotate(90deg)',
                width: '60px',
                height: '60px',
                position: 'relative',
              }}>
                <img src={playIcon} alt="" style={{ width: '100%', height: '100%', maxWidth: 'none' }} />
              </div>
            </div>

            <div style={{
              position: 'absolute',
              backdropFilter: 'blur(50px)',
              background: '#000',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              height: '52px',
              left: 'calc(50% + 0.5px)',
              borderRadius: '30px',
              top: '365px',
              transform: 'translateX(-50%)',
              width: '333px',
              overflow: 'clip',
            }}>
              <div style={{
                position: 'absolute',
                height: '39px',
                left: '21px',
                top: '5px',
                width: '46px',
              }}>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  overflow: 'hidden',
                  pointerEvents: 'none',
                }}>
                  <img 
                    src={statusBarIcons}
                    alt=""
                    style={{
                      position: 'absolute',
                      height: '339.22%',
                      left: '-69.53%',
                      maxWidth: 'none',
                      top: '-115.69%',
                      width: '426.73%',
                    }}
                  />
                </div>
              </div>

              <div style={{
                position: 'absolute',
                height: '39px',
                left: '132px',
                top: '4px',
                width: '40px',
              }}>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  overflow: 'hidden',
                  pointerEvents: 'none',
                }}>
                  <img 
                    src={statusBarIcons}
                    alt=""
                    style={{
                      position: 'absolute',
                      height: '339.22%',
                      left: '-193.75%',
                      maxWidth: 'none',
                      top: '-115.69%',
                      width: '487.69%',
                    }}
                  />
                </div>
              </div>

              <div style={{
                position: 'absolute',
                height: '39px',
                left: '228px',
                top: '5px',
                width: '40px',
              }}>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  overflow: 'hidden',
                  pointerEvents: 'none',
                }}>
                  <img 
                    src={statusBarIcons}
                    alt=""
                    style={{
                      position: 'absolute',
                      height: '339.22%',
                      left: '-304.47%',
                      maxWidth: 'none',
                      top: '-115.69%',
                      width: '487.69%',
                    }}
                  />
                </div>
              </div>

              <div style={{
                position: 'absolute',
                bottom: 'calc(30.77% - 2px)',
                display: 'flex',
                flexDirection: 'column',
                fontFamily: 'Gotham Pro, sans-serif',
                fontWeight: 500,
                justifyContent: 'center',
                left: 'calc(50% - 68px)',
                lineHeight: 0,
                fontSize: '27px',
                textAlign: 'center',
                color: 'white',
                top: 'calc(30.77% - 2px)',
                transform: 'translateX(-50%)',
                width: '73px',
              }}>
                <p style={{ lineHeight: 'normal', whiteSpace: 'pre-wrap', margin: 0 }}>227к</p>
              </div>

              <div style={{
                position: 'absolute',
                bottom: 'calc(31.39% - 2px)',
                display: 'flex',
                flexDirection: 'column',
                fontFamily: 'Gotham Pro, sans-serif',
                fontWeight: 500,
                justifyContent: 'center',
                left: 'calc(50% + 33px)',
                lineHeight: 0,
                fontSize: '27px',
                textAlign: 'center',
                color: 'white',
                top: 'calc(30.77% - 2px)',
                transform: 'translateX(-50%)',
                width: '55px',
              }}>
                <p style={{ lineHeight: 'normal', whiteSpace: 'pre-wrap', margin: 0 }}>40к</p>
              </div>

              <div style={{
                position: 'absolute',
                bottom: 'calc(31.39% - 2px)',
                display: 'flex',
                flexDirection: 'column',
                fontFamily: 'Gotham Pro, sans-serif',
                fontWeight: 500,
                justifyContent: 'center',
                left: 'calc(50% + 120px)',
                lineHeight: 0,
                fontSize: '27px',
                textAlign: 'center',
                color: 'white',
                top: 'calc(30.77% - 2px)',
                transform: 'translateX(-50%)',
                width: '35px',
              }}>
                <p style={{ lineHeight: 'normal', whiteSpace: 'pre-wrap', margin: 0 }}>2к</p>
              </div>
            </div>

            <div style={{
              position: 'absolute',
              left: '7.32%',
              right: '77.07%',
              top: '448px',
              aspectRatio: '42/51',
            }}>
              <div style={{
                position: 'absolute',
                inset: 0,
                opacity: 0.6,
                overflow: 'hidden',
                pointerEvents: 'none',
              }}>
                <img 
                  src={instaLogoIcon}
                  alt=""
                  style={{
                    position: 'absolute',
                    height: '339.84%',
                    left: '-56.27%',
                    maxWidth: 'none',
                    top: '-118.33%',
                    width: '620.89%',
                  }}
                />
              </div>
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

            <img
              src={analysisButtonPNG}
              alt="анализ" 
              onClick={() => navigate('/laba-analysis')}
              style={{
                position: 'absolute',
                bottom: '63px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '248px',
                height: '79px',
                cursor: 'pointer',
              }}
            />

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
        </div>

        {/* Footer */}
        <div style={{
          position: 'absolute',
          height: '124px',
          left: 'calc(50% - 5px)',
          top: 'calc(50% + 858px)',
          transform: 'translate(-50%, -50%)',
          width: '888px',
        }}>
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

          <div style={{
            position: 'absolute',
            bottom: '38.71%',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'Gotham Pro, sans-serif',
            fontWeight: 300,
            justifyContent: 'center',
            left: 'calc(50% - 442px)',
            lineHeight: 0,
            fontSize: '20px',
            color: 'white',
            top: '45.16%',
            width: '433px',
          }}>
            <p style={{ lineHeight: 'normal', whiteSpace: 'pre-wrap', margin: 0 }}>Copyright © Все права защищены.</p>
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
            {/* Telegram */}
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
            {/* Instagram */}
            <div style={{
              position: 'absolute',
              height: '51px',
              left: '54px',
              top: 0,
              width: '142px',
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
                  left: '-16.64%',
                  maxWidth: 'none',
                  top: '-118.33%',
                  width: '183.64%',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
