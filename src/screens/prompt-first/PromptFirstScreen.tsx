import React from 'react';
import { useNavigate } from 'react-router-dom';

// Local PNG assets
import smallLogo from '../../assets/figma-welcome/logo-small.png';
import returnButton from '../../assets/кнопка вернуть.png';
import searchIconPNG from '../../assets/иконка поиск.png';
import supportButtonPNG from '../../assets/tour-video/support-button.png';

// Figma MCP assets
const footerLogo = "https://www.figma.com/api/mcp/asset/eec42cbf-412b-4926-850b-463f55b43abf";
const socialIcons = "https://www.figma.com/api/mcp/asset/96863808-46d4-499a-878e-c15950dc56ad"; 
const threePeopleBg = "https://www.figma.com/api/mcp/asset/1f6ef230-2b81-4e04-8d67-9a5cf1485327";
const houseImage = "https://www.figma.com/api/mcp/asset/3d1cba2c-4fbf-4899-bf0b-a768d478b52d";
const homeVector1 = "https://www.figma.com/api/mcp/asset/9f881007-3e31-4135-b2fe-e06b91dd0712";
const homeVector2 = "https://www.figma.com/api/mcp/asset/21ea9087-2499-427f-928b-a8d6dfbe722a";
const backArrow = "https://www.figma.com/api/mcp/asset/e111f38a-80d6-4b85-840f-0e5fffc9fffb";
const heartFilled = "https://www.figma.com/api/mcp/asset/356cce97-ba9a-426b-b68e-46da1edaf70b";
const heartFilledAlt = "https://www.figma.com/api/mcp/asset/69d2fe69-70ad-4a1f-8fd5-c87407bb72a2";
const heartEmpty = "https://www.figma.com/api/mcp/asset/d487f0d7-58b0-45f3-ba61-5cd64c3e2ff0";
const searchIcon = "https://www.figma.com/api/mcp/asset/4cc4ace0-2607-4d2d-a638-eeac8477fc94";

export const PromptFirstScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = React.useState('');
  const [likedCards, setLikedCards] = React.useState<number[]>([0, 1]);

  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;

  const toggleLike = (cardIndex: number) => {
    setLikedCards(prev => 
      prev.includes(cardIndex) 
        ? prev.filter(id => id !== cardIndex)
        : [...prev, cardIndex]
    );
  };

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
        {/* Background people */}
        <div style={{
          position: 'absolute',
          height: '474px',
          left: '147px',
          top: '1289px',
          width: '886px',
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            pointerEvents: 'none',
          }}>
            <img 
              src={threePeopleBg}
              alt=""
              style={{
                position: 'absolute',
                height: '222.88%',
                left: '-39.72%',
                maxWidth: 'none',
                top: '-55.58%',
                width: '179.18%',
              }}
            />
          </div>
        </div>

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

        {/* Header - Support button (PNG) */}
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
              position: 'absolute',
              inset: 0,
              maxWidth: 'none',
              objectFit: 'cover',
              pointerEvents: 'none',
              borderRadius: '30px',
              width: '100%',
              height: '100%',
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
        }}>
          <img 
            src={searchIconPNG}
            alt=""
            style={{
              position: 'absolute',
              left: '26px',
              width: '38px',
              height: '38px',
              top: 'calc(50% - 19px)',
            }}
          />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="промпт для ИИ-копирайтера любых текстов"
            style={{
              position: 'absolute',
              fontFamily: 'Gotham Pro, sans-serif',
              fontWeight: 300,
              color: 'white',
              fontSize: '27px',
              left: 'calc(50% - 365px)',
              top: 'calc(50% - 0.5px)',
              transform: 'translateY(-50%)',
              width: '612px',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              lineHeight: 1,
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

        {/* Filter: избранное */}
        <div style={{
          position: 'absolute',
          backdropFilter: 'blur(50px)',
          background: 'rgba(0, 0, 0, 0.9)',
          border: '4px solid rgba(255, 255, 255, 0.3)',
          inset: '28.75% 39.5% 68.15% 39.58%',
          borderRadius: '62px',
          overflow: 'hidden',
          cursor: 'pointer',
        }}>
          <div style={{
            position: 'absolute',
            fontFamily: 'Gotham Pro, sans-serif',
            fontWeight: 500,
            fontSize: '27px',
            color: 'white',
            left: 'calc(50% - 0.97px)',
            top: 'calc(50% - 0.13px)',
            transform: 'translate(-50%, -50%)',
            width: '169px',
            textAlign: 'center',
            lineHeight: 1,
          }}>
            избранное
          </div>
        </div>

        {/* Filter: недавние */}
        <div style={{
          position: 'absolute',
          backdropFilter: 'blur(50px)',
          background: 'rgba(0, 0, 0, 0.9)',
          border: '4px solid rgba(255, 255, 255, 0.3)',
          inset: '28.75% 18.57% 68.15% 60.51%',
          borderRadius: '62px',
          overflow: 'hidden',
          cursor: 'pointer',
        }}>
          <div style={{
            position: 'absolute',
            fontFamily: 'Gotham Pro, sans-serif',
            fontWeight: 500,
            fontSize: '27px',
            color: 'white',
            left: 'calc(50% - 1.47px)',
            top: 'calc(50% + 0.03px)',
            transform: 'translate(-50%, -50%)',
            width: '150px',
            textAlign: 'center',
            lineHeight: 1,
          }}>
            недавние
          </div>
        </div>

        {/* Filter: топ-выбор */}
        <div style={{
          position: 'absolute',
          backdropFilter: 'blur(50px)',
          background: 'rgba(0, 0, 0, 0.9)',
          border: '4px solid rgba(255, 255, 255, 0.3)',
          inset: '31.84% 50.01% 65.05% 29.07%',
          borderRadius: '62px',
          overflow: 'hidden',
          cursor: 'pointer',
        }}>
          <div style={{
            position: 'absolute',
            fontFamily: 'Gotham Pro, sans-serif',
            fontWeight: 500,
            fontSize: '27px',
            color: 'white',
            left: 'calc(50% + 4.03px)',
            top: 'calc(50% - 0.13px)',
            transform: 'translate(-50%, -50%)',
            width: '161px',
            textAlign: 'center',
            lineHeight: 1,
          }}>
            топ-выбор
          </div>
        </div>

        {/* Filter: новые */}
        <div style={{
          position: 'absolute',
          backdropFilter: 'blur(50px)',
          background: 'rgba(0, 0, 0, 0.9)',
          border: '4px solid rgba(255, 255, 255, 0.3)',
          bottom: '65.05%',
          left: '50%',
          right: '29.07%',
          top: '31.84%',
          borderRadius: '62px',
          overflow: 'hidden',
          cursor: 'pointer',
        }}>
          <div style={{
            position: 'absolute',
            fontFamily: 'Gotham Pro, sans-serif',
            fontWeight: 500,
            fontSize: '27px',
            color: 'white',
            left: 'calc(50% - 0.47px)',
            top: 'calc(50% - 0.13px)',
            transform: 'translate(-50%, -50%)',
            width: '216px',
            textAlign: 'center',
            lineHeight: 1,
          }}>
            новые
          </div>
        </div>

        {/* Cards window */}
        <div style={{
          position: 'absolute',
          backdropFilter: 'blur(50px)',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '4px solid rgba(255, 255, 255, 0.3)',
          height: '1121px',
          left: 'calc(50% + 3px)',
          borderRadius: '30px',
          top: '921px',
          transform: 'translateX(-50%)',
          width: '884px',
          overflow: 'auto',
        }}>
          {/* Card 1 - top left */}
          <div style={{ position: 'absolute', left: '22px', top: '23px' }}>
            <div style={{
              position: 'absolute',
              backdropFilter: 'blur(50px)',
              background: 'black',
              border: '4px solid rgba(255, 255, 255, 0.3)',
              height: '782px',
              left: 'calc(50% - 211px)',
              borderRadius: '30px',
              top: '27px',
              transform: 'translateX(-50%)',
              width: '410px',
            }} />
            <div style={{
              position: 'absolute',
              border: '2px solid rgba(0, 0, 0, 0.3)',
              height: '359px',
              left: '53px',
              borderRadius: '25px',
              top: '54px',
              width: '356px',
            }}>
              <img src={houseImage} alt="" style={{
                position: 'absolute',
                inset: 0,
                maxWidth: 'none',
                objectFit: 'cover',
                pointerEvents: 'none',
                borderRadius: '25px',
                width: '100%',
                height: '100%',
              }} />
            </div>
            <div style={{
              position: 'absolute',
              bottom: '54.42%',
              fontFamily: 'Gotham Pro, sans-serif',
              fontWeight: 700,
              fontSize: '40px',
              color: 'white',
              left: 'calc(50% - 376px)',
              top: '40.41%',
              width: '329px',
              lineHeight: 1,
            }}>
              ИИ-копирайтер для блога
            </div>
            <div style={{
              position: 'absolute',
              bottom: '44.07%',
              fontFamily: 'Gotham Pro, sans-serif',
              fontWeight: 300,
              fontSize: '32px',
              color: 'white',
              left: 'calc(50% - 376px)',
              top: '47.46%',
              width: '329px',
              lineHeight: 1,
            }}>
              настройте ИИ-копирайтера за один промпт
            </div>
            <div 
              onClick={() => toggleLike(0)}
              style={{
                position: 'absolute',
                inset: '6.33% 88.46% 90.45% 7.47%',
                cursor: 'pointer',
              }}
            >
              <img src={likedCards.includes(0) ? heartFilled : heartEmpty} alt="" style={{ width: '100%', height: '100%' }} />
            </div>
            <div style={{
              position: 'absolute',
              backdropFilter: 'blur(50px)',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              inset: '6.33% 55.29% 90.45% 29.52%',
              borderRadius: '62px',
              overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute',
                fontFamily: 'Gotham Pro, sans-serif',
                fontWeight: 500,
                fontSize: '18px',
                color: 'white',
                left: 'calc(50% - 0.6px)',
                top: 'calc(50% - 0.5px)',
                transform: 'translate(-50%, -50%)',
                width: '111px',
                textAlign: 'center',
                lineHeight: 1,
              }}>
                новое
              </div>
            </div>
            <div 
              onClick={() => navigate('/prompt-card')}
              style={{
                position: 'absolute',
                backdropFilter: 'blur(50px)',
                background: 'rgba(0, 0, 0, 0.9)',
                border: '4px solid rgba(255, 255, 255, 0.3)',
                bottom: '33.43%',
                left: 'calc(50% - 210.53px)',
                borderRadius: '62px',
                top: '59.5%',
                transform: 'translateX(-50%)',
                width: '246.931px',
                overflow: 'hidden',
                cursor: 'pointer',
              }}
            >
              <div style={{ position: 'absolute', left: '73px', top: '-44px' }}>
                <div style={{
                  position: 'absolute',
                  background: '#37ecf7',
                  height: '107.431px',
                  left: '77px',
                  borderRadius: '1568.563px',
                  top: '-36.46px',
                  width: '101.963px',
                }} />
                <div style={{
                  position: 'absolute',
                  display: 'flex',
                  height: '78.548px',
                  alignItems: 'center',
                  justifyContent: 'center',
                  left: '102.5px',
                  top: '-40px',
                  width: '90.498px',
                }}>
                  <div style={{
                    transform: 'rotate(16.918deg) skewX(-15.566deg)',
                    background: '#f0d825',
                    height: '75.957px',
                    borderRadius: '1568.563px',
                    width: '51.243px',
                  }} />
                </div>
                <div style={{
                  position: 'absolute',
                  background: '#d5fc44',
                  height: '72.822px',
                  left: '122.8px',
                  borderRadius: '1568.563px',
                  top: '30.18px',
                  width: '56.152px',
                }} />
              </div>
              <div style={{
                position: 'absolute',
                fontFamily: 'Gotham Pro, sans-serif',
                fontWeight: 500,
                fontSize: '27px',
                color: 'white',
                left: 'calc(50% + 0.03px)',
                top: 'calc(50% - 0.12px)',
                transform: 'translate(-50%, -50%)',
                width: '119px',
                textAlign: 'center',
                lineHeight: 1,
              }}>
                перейти
              </div>
            </div>
          </div>

          {/* Card 2 - top right */}
          <div style={{ position: 'absolute', left: '443px', top: '23px' }}>
            <div style={{
              position: 'absolute',
              backdropFilter: 'blur(50px)',
              background: 'black',
              border: '4px solid rgba(255, 255, 255, 0.3)',
              height: '782px',
              left: 'calc(50% - 211px)',
              borderRadius: '30px',
              top: '27px',
              transform: 'translateX(-50%)',
              width: '410px',
            }} />
            <div style={{
              position: 'absolute',
              border: '2px solid rgba(0, 0, 0, 0.3)',
              height: '359px',
              left: '53px',
              borderRadius: '25px',
              top: '54px',
              width: '356px',
            }}>
              <img src={houseImage} alt="" style={{
                position: 'absolute',
                inset: 0,
                maxWidth: 'none',
                objectFit: 'cover',
                pointerEvents: 'none',
                borderRadius: '25px',
                width: '100%',
                height: '100%',
              }} />
            </div>
            <div style={{
              position: 'absolute',
              bottom: '54.42%',
              fontFamily: 'Gotham Pro, sans-serif',
              fontWeight: 700,
              fontSize: '40px',
              color: 'white',
              left: 'calc(50% - 376px)',
              top: '40.41%',
              width: '329px',
              lineHeight: 1,
            }}>
              ИИ-копирайтер для блога
            </div>
            <div style={{
              position: 'absolute',
              bottom: '44.07%',
              fontFamily: 'Gotham Pro, sans-serif',
              fontWeight: 300,
              fontSize: '32px',
              color: 'white',
              left: 'calc(50% - 376px)',
              top: '47.46%',
              width: '329px',
              lineHeight: 1,
            }}>
              настройте ИИ-копирайтера за один промпт
            </div>
            <div 
              onClick={() => toggleLike(1)}
              style={{
                position: 'absolute',
                inset: '6.33% 88.46% 90.45% 7.47%',
                cursor: 'pointer',
              }}
            >
              <img src={likedCards.includes(1) ? heartFilledAlt : heartEmpty} alt="" style={{ width: '100%', height: '100%' }} />
            </div>
            <div 
              onClick={() => navigate('/prompt-card')}
              style={{
                position: 'absolute',
                backdropFilter: 'blur(50px)',
                background: 'rgba(0, 0, 0, 0.9)',
                border: '4px solid rgba(255, 255, 255, 0.3)',
                bottom: '33.43%',
                left: 'calc(50% - 210.53px)',
                borderRadius: '62px',
                top: '59.5%',
                transform: 'translateX(-50%)',
                width: '246.931px',
                overflow: 'hidden',
                cursor: 'pointer',
              }}
            >
              <div style={{ position: 'absolute', left: '73px', top: '-44px' }}>
                <div style={{
                  position: 'absolute',
                  background: '#37ecf7',
                  height: '107.431px',
                  left: '77px',
                  borderRadius: '1568.563px',
                  top: '-36.46px',
                  width: '101.963px',
                }} />
                <div style={{
                  position: 'absolute',
                  display: 'flex',
                  height: '78.548px',
                  alignItems: 'center',
                  justifyContent: 'center',
                  left: '102.5px',
                  top: '-40px',
                  width: '90.498px',
                }}>
                  <div style={{
                    transform: 'rotate(16.918deg) skewX(-15.566deg)',
                    background: '#f0d825',
                    height: '75.957px',
                    borderRadius: '1568.563px',
                    width: '51.243px',
                  }} />
                </div>
                <div style={{
                  position: 'absolute',
                  background: '#d5fc44',
                  height: '72.822px',
                  left: '122.8px',
                  borderRadius: '1568.563px',
                  top: '30.18px',
                  width: '56.152px',
                }} />
              </div>
              <div style={{
                position: 'absolute',
                fontFamily: 'Gotham Pro, sans-serif',
                fontWeight: 500,
                fontSize: '27px',
                color: 'white',
                left: 'calc(50% + 0.03px)',
                top: 'calc(50% - 0.12px)',
                transform: 'translate(-50%, -50%)',
                width: '119px',
                textAlign: 'center',
                lineHeight: 1,
              }}>
                перейти
              </div>
            </div>
          </div>

          {/* Card 3 - bottom left */}
          <div style={{ position: 'absolute', left: '22px', top: '828px' }}>
            <div style={{
              position: 'absolute',
              backdropFilter: 'blur(50px)',
              background: 'black',
              border: '4px solid rgba(255, 255, 255, 0.3)',
              height: '782px',
              left: 'calc(50% - 211px)',
              borderRadius: '30px',
              top: '27px',
              transform: 'translateX(-50%)',
              width: '410px',
            }} />
            <div style={{
              position: 'absolute',
              border: '2px solid rgba(0, 0, 0, 0.3)',
              height: '359px',
              left: '53px',
              borderRadius: '25px',
              top: '54px',
              width: '356px',
            }}>
              <img src={houseImage} alt="" style={{
                position: 'absolute',
                inset: 0,
                maxWidth: 'none',
                objectFit: 'cover',
                pointerEvents: 'none',
                borderRadius: '25px',
                width: '100%',
                height: '100%',
              }} />
            </div>
            <div style={{
              position: 'absolute',
              bottom: '54.42%',
              fontFamily: 'Gotham Pro, sans-serif',
              fontWeight: 700,
              fontSize: '40px',
              color: 'white',
              left: 'calc(50% - 376px)',
              top: '40.41%',
              width: '329px',
              lineHeight: 1,
            }}>
              ИИ-копирайтер для блога
            </div>
            <div style={{
              position: 'absolute',
              bottom: '44.07%',
              fontFamily: 'Gotham Pro, sans-serif',
              fontWeight: 300,
              fontSize: '32px',
              color: 'white',
              left: 'calc(50% - 376px)',
              top: '47.46%',
              width: '329px',
              lineHeight: 1,
            }}>
              настройте ИИ-копирайтера за один промпт
            </div>
            <div 
              onClick={() => toggleLike(2)}
              style={{
                position: 'absolute',
                inset: '6.33% 88.46% 90.45% 7.47%',
                cursor: 'pointer',
              }}
            >
              <img src={likedCards.includes(2) ? heartFilled : heartEmpty} alt="" style={{ width: '100%', height: '100%' }} />
            </div>
            <div 
              onClick={() => navigate('/prompt-card')}
              style={{
                position: 'absolute',
                backdropFilter: 'blur(50px)',
                background: 'rgba(0, 0, 0, 0.9)',
                border: '4px solid rgba(255, 255, 255, 0.3)',
                bottom: '33.43%',
                left: 'calc(50% - 210.53px)',
                borderRadius: '62px',
                top: '59.5%',
                transform: 'translateX(-50%)',
                width: '246.931px',
                overflow: 'hidden',
                cursor: 'pointer',
              }}
            >
              <div style={{ position: 'absolute', left: '73px', top: '-44px' }}>
                <div style={{
                  position: 'absolute',
                  background: '#37ecf7',
                  height: '107.431px',
                  left: '77px',
                  borderRadius: '1568.563px',
                  top: '-36.46px',
                  width: '101.963px',
                }} />
                <div style={{
                  position: 'absolute',
                  display: 'flex',
                  height: '78.548px',
                  alignItems: 'center',
                  justifyContent: 'center',
                  left: '102.5px',
                  top: '-40px',
                  width: '90.498px',
                }}>
                  <div style={{
                    transform: 'rotate(16.918deg) skewX(-15.566deg)',
                    background: '#f0d825',
                    height: '75.957px',
                    borderRadius: '1568.563px',
                    width: '51.243px',
                  }} />
                </div>
                <div style={{
                  position: 'absolute',
                  background: '#d5fc44',
                  height: '72.822px',
                  left: '122.8px',
                  borderRadius: '1568.563px',
                  top: '30.18px',
                  width: '56.152px',
                }} />
              </div>
              <div style={{
                position: 'absolute',
                fontFamily: 'Gotham Pro, sans-serif',
                fontWeight: 500,
                fontSize: '27px',
                color: 'white',
                left: 'calc(50% + 0.03px)',
                top: 'calc(50% - 0.12px)',
                transform: 'translate(-50%, -50%)',
                width: '119px',
                textAlign: 'center',
                lineHeight: 1,
              }}>
                перейти
              </div>
            </div>
          </div>

          {/* Card 4 - bottom right */}
          <div style={{ position: 'absolute', left: '443px', top: '828px' }}>
            <div style={{
              position: 'absolute',
              backdropFilter: 'blur(50px)',
              background: 'black',
              border: '4px solid rgba(255, 255, 255, 0.3)',
              height: '782px',
              left: 'calc(50% - 211px)',
              borderRadius: '30px',
              top: '27px',
              transform: 'translateX(-50%)',
              width: '410px',
            }} />
            <div style={{
              position: 'absolute',
              border: '2px solid rgba(0, 0, 0, 0.3)',
              height: '359px',
              left: '53px',
              borderRadius: '25px',
              top: '54px',
              width: '356px',
            }}>
              <img src={houseImage} alt="" style={{
                position: 'absolute',
                inset: 0,
                maxWidth: 'none',
                objectFit: 'cover',
                pointerEvents: 'none',
                borderRadius: '25px',
                width: '100%',
                height: '100%',
              }} />
            </div>
            <div style={{
              position: 'absolute',
              bottom: '54.42%',
              fontFamily: 'Gotham Pro, sans-serif',
              fontWeight: 700,
              fontSize: '40px',
              color: 'white',
              left: 'calc(50% - 376px)',
              top: '40.41%',
              width: '329px',
              lineHeight: 1,
            }}>
              ИИ-копирайтер для блога
            </div>
            <div style={{
              position: 'absolute',
              bottom: '44.07%',
              fontFamily: 'Gotham Pro, sans-serif',
              fontWeight: 300,
              fontSize: '32px',
              color: 'white',
              left: 'calc(50% - 376px)',
              top: '47.46%',
              width: '329px',
              lineHeight: 1,
            }}>
              настройте ИИ-копирайтера за один промпт
            </div>
            <div 
              onClick={() => toggleLike(3)}
              style={{
                position: 'absolute',
                inset: '6.33% 88.46% 90.45% 7.47%',
                cursor: 'pointer',
              }}
            >
              <img src={likedCards.includes(3) ? heartFilled : heartEmpty} alt="" style={{ width: '100%', height: '100%' }} />
            </div>
            <div 
              onClick={() => navigate('/prompt-card')}
              style={{
                position: 'absolute',
                backdropFilter: 'blur(50px)',
                background: 'rgba(0, 0, 0, 0.9)',
                border: '4px solid rgba(255, 255, 255, 0.3)',
                bottom: '33.43%',
                left: 'calc(50% - 210.53px)',
                borderRadius: '62px',
                top: '59.5%',
                transform: 'translateX(-50%)',
                width: '246.931px',
                overflow: 'hidden',
                cursor: 'pointer',
              }}
            >
              <div style={{ position: 'absolute', left: '73px', top: '-44px' }}>
                <div style={{
                  position: 'absolute',
                  background: '#37ecf7',
                  height: '107.431px',
                  left: '77px',
                  borderRadius: '1568.563px',
                  top: '-36.46px',
                  width: '101.963px',
                }} />
                <div style={{
                  position: 'absolute',
                  display: 'flex',
                  height: '78.548px',
                  alignItems: 'center',
                  justifyContent: 'center',
                  left: '102.5px',
                  top: '-40px',
                  width: '90.498px',
                }}>
                  <div style={{
                    transform: 'rotate(16.918deg) skewX(-15.566deg)',
                    background: '#f0d825',
                    height: '75.957px',
                    borderRadius: '1568.563px',
                    width: '51.243px',
                  }} />
                </div>
                <div style={{
                  position: 'absolute',
                  background: '#d5fc44',
                  height: '72.822px',
                  left: '122.8px',
                  borderRadius: '1568.563px',
                  top: '30.18px',
                  width: '56.152px',
                }} />
              </div>
              <div style={{
                position: 'absolute',
                fontFamily: 'Gotham Pro, sans-serif',
                fontWeight: 500,
                fontSize: '27px',
                color: 'white',
                left: 'calc(50% + 0.03px)',
                top: 'calc(50% - 0.12px)',
                transform: 'translate(-50%, -50%)',
                width: '119px',
                textAlign: 'center',
                lineHeight: 1,
              }}>
                перейти
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
            fontFamily: 'Gotham Pro, sans-serif',
            fontWeight: 300,
            fontSize: '20px',
            color: 'white',
            left: 'calc(50% - 442px)',
            top: '45.16%',
            width: '433px',
            lineHeight: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}>
            Copyright © Все права защищены.
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
                src={socialIcons}
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