import React from 'react';
import { useNavigate } from 'react-router-dom';

// REUSED from prompt-first screen
import smallLogo from '../../assets/figma-welcome/logo-small.png';
import supportButtonPNG from '../../assets/tour-video/support-button.png';
import socialsIconsFooter from '../../assets/welcome-elements/socials-icons.png';
import bgPattern from '../../assets/figma-welcome/pattern.png';

// Laba-main PNG assets
import analysisButtonPNG from '../../assets/laba-main/кнопка анализ.png';
import likeIconPNG from '../../assets/laba-main/лайк.png';
import instagramLogo from '../../assets/laba-main/лого инста.png';
import peopleBackground from '../../assets/laba-main/люди друг на друге.png';
import cardImage from '../../assets/laba-main/картинка в карточке промпта.png';

// Filter buttons PNG
import buttonReturn from '../../assets/laba-main-buttons/кнопка вернуть.png';
import buttonSort from '../../assets/laba-main-buttons/кнопка сортировка.png';
import buttonDate from '../../assets/laba-main-buttons/кнопка дата.png';
import buttonLanguage from '../../assets/laba-main-buttons/кнопка язык.png';
import buttonVirality from '../../assets/laba-main-buttons/кнопка виральность.png';
import buttonAccount from '../../assets/laba-main-buttons/кнопка аккаунт.png';
import buttonFormat from '../../assets/laba-main-buttons/кнопка формат.png';
import badgeLikes from '../../assets/laba-main-buttons/плашка лайки.png';
import badgeTimeslot from '../../assets/laba-main-buttons/плашка таймслот.png';
import badgeRussian from '../../assets/laba-main-buttons/плашка русский.png';
import badgeScores from '../../assets/laba-main-buttons/плашка баллы.png';
import badgeAccount from '../../assets/laba-main-buttons/плашка аккаунт.png';
import badgeReels from '../../assets/laba-main-buttons/плашка рилс.png';
import badgeSearchCost from '../../assets/laba-main-buttons/плашка сколько стоит поиск.png';

// REUSED: heart icon from prompt-first
// REUSED: footer and header components from prompt-first

// Figma MCP assets  
const footerLogo = "https://www.figma.com/api/mcp/asset/3bd9d147-154a-4929-aab7-9df5b0793789";
const backArrow = "https://www.figma.com/api/mcp/asset/df23cbdc-6a1c-47c3-8b9f-97ecb4397784";
const searchIconMCP = "https://www.figma.com/api/mcp/asset/746ea58b-0e0f-40b8-8aa4-d0be923dbe39";
const homeVector1 = "https://www.figma.com/api/mcp/asset/8f6661d8-2d62-49c8-ae88-5e19d118e967";
const homeVector2 = "https://www.figma.com/api/mcp/asset/4a9951a6-1fa4-45c0-a766-090a909e4bed";
const playIcon = "https://www.figma.com/api/mcp/asset/8ca3a30c-2ba8-4c9b-839c-86a31fd5d54e";
const statusBarIcons = "https://www.figma.com/api/mcp/asset/3f2b218f-ce7e-4476-801e-c4f2c0cb134c";

export const LabaMainScreen: React.FC = () => {
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

        {/* Search bar + 25 badge - EXACT Figma coordinates */}
        <div style={{
          position: 'absolute',
          backdropFilter: 'blur(50px)',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          height: '72px',
          left: 'calc(50% + 3px)',
          borderRadius: '62px',
          top: '223px',
          transform: 'translateX(-50%)',
          width: '876px',
          overflow: 'clip',
        }}>
          {/* Search icon */}
          <div style={{
            position: 'absolute',
            left: '22px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '38px',
            height: '38px',
          }}>
            <div style={{
              position: 'absolute',
              top: '3.12%',
              right: '3.12%',
              bottom: '3.13%',
              left: '3.12%',
            }}>
              <img src={searchIconMCP} alt="" style={{ width: '100%', height: '100%' }} />
            </div>
          </div>

          {/* Placeholder text */}
          <div style={{
            position: 'absolute',
            left: 'calc(50% - 365px)',
            top: 'calc(50% - 1015.5px + 1015.5px)', 
            transform: 'translateY(-50%)',
            width: '612px',
            fontFamily: 'Gotham Pro, sans-serif',
            fontWeight: 300,
            fontSize: '27px',
            color: '#848484',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            lineHeight: 0,
          }}>
            найти видео по ключевым словам
          </div>

          {/* Badge "25" - PNG из Desktop */}
          <img 
            src={badgeSearchCost}
            alt="25"
            style={{
              position: 'absolute',
              left: 'calc(50% + 373px)',
              top: '-2px',
              transform: 'translateX(-50%)',
              width: '130px',
              height: '72px',
            }}
          />
        </div>

        {/* Filter buttons - Row 1 - PNG из Desktop, ТОЧНЫЕ координаты из Figma */}
        <div style={{ position: 'absolute', left: '99px', top: '327px', width: '186px', height: '79px' }}>
          <img src={buttonReturn} alt="вернуть" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>

        <div style={{ position: 'absolute', left: '346px', top: '327px', width: '216px', height: '79px' }}>
          <img src={buttonSort} alt="сортировка" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>

        <div style={{ position: 'absolute', left: '593px', top: '327px', width: '169px', height: '79px' }}>
          <img src={buttonDate} alt="дата" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>

        <div style={{ position: 'absolute', left: '840px', top: '327px', width: '186px', height: '79px' }}>
          <img src={buttonLanguage} alt="язык" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>

        {/* Filter buttons - Row 2: виральность, аккаунт, формат - PNG из Desktop */}
        <img 
          src={buttonVirality}
          alt="виральность"
          style={{
            position: 'absolute',
            left: '220px',
            top: '485px',
            width: '247px',
            height: '79px',
          }}
        />

        <img 
          src={buttonAccount}
          alt="аккаунт"
          style={{
            position: 'absolute',
            left: '464px',
            top: '485px',
            width: '247px',
            height: '79px',
          }}
        />

        <img 
          src={buttonFormat}
          alt="формат"
          style={{
            position: 'absolute',
            left: '712px',
            top: '485px',
            width: '247px',
            height: '79px',
          }}
        />

        {/* Filter buttons - Row 2 - PNG из Desktop */}
        <img 
          src={badgeLikes}
          alt=">лайков"
          style={{
            position: 'absolute',
            left: 'calc(50% - 151px)',
            top: '406px',
            transform: 'translateX(-50%)',
            width: '186px',
            height: '79px',
          }}
        />

        <img 
          src={badgeTimeslot}
          alt="14 дней"
          style={{
            position: 'absolute',
            left: 'calc(50% + 93px)',
            top: '406px',
            transform: 'translateX(-50%)',
            width: '186px',
            height: '79px',
          }}
        />

        <img 
          src={badgeRussian}
          alt="русский"
          style={{
            position: 'absolute',
            left: 'calc(50% + 343px)',
            top: '406px',
            transform: 'translateX(-50%)',
            width: '186px',
            height: '79px',
          }}
        />

        {/* Filter buttons - Row 3 - PNG из Desktop */}
        <img 
          src={badgeScores}
          alt="9-10 баллов"
          style={{
            position: 'absolute',
            left: 'calc(50% - 280px)',
            top: '564px',
            transform: 'translateX(-50%)',
            width: '186px',
            height: '79px',
          }}
        />

        <img 
          src={badgeAccount}
          alt="0-10к"
          style={{
            position: 'absolute',
            left: 'calc(50% - 33px)',
            top: '564px',
            transform: 'translateX(-50%)',
            width: '186px',
            height: '79px',
          }}
        />

        <img 
          src={badgeReels}
          alt="IG reels"
          style={{
            position: 'absolute',
            left: 'calc(50% + 214px)',
            top: '564px',
            transform: 'translateX(-50%)',
            width: '186px',
            height: '79px',
          }}
        />

        {/* Люди друг на друге - ПОД фреймом, ТОЧНО из Figma node 164:1101 */}
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
              src="https://www.figma.com/api/mcp/asset/882d0069-a777-43bb-8d98-35cdf5b184ca"
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

        {/* Main content window - УВЕЛИЧЕН до 1369px как в Figma */}
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
          overflow: 'clip',
          zIndex: 10,
        }}>
          {/* Карточка 1 - Верхняя левая - EXACT Figma coordinates */}
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
            
            {/* Картинка в карточке промпта PNG */}
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

            {/* Плашка "новое" */}
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

            {/* Сердечко лайк */}
            <div style={{
              position: 'absolute',
              top: '5.63%',
              right: '80.98%',
              bottom: '89.77%',
              left: '10.24%',
            }}>
              <img src={likeIconPNG} alt="лайк" style={{ width: '100%', height: '100%' }} />
            </div>

            {/* Play кнопка - EXACT position */}
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

            {/* Статистика бар с иконками - ТОЧНО из Figma */}
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
              {/* Иконка просмотров - crop из общего PNG */}
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

              {/* Иконка лайков - crop из общего PNG */}
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

              {/* Иконка комментариев - crop из общего PNG */}
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

              {/* Статистика текст */}
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

            {/* Instagram лого PNG - ТОЧНО из Figma node 164:861 */}
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
                  src="https://www.figma.com/api/mcp/asset/939902d8-304e-4ab2-a982-2eb9c0274c17"
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

            {/* Кнопка "анализ" PNG */}
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

          {/* Пока только ОДНА карточка до проверки */}
        </div>

        {/* Footer - ТОЧНО из Figma 7:908 */}
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