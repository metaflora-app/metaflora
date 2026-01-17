import React from 'react';
import { useNavigate } from 'react-router-dom';

// Background & header
import bgPattern from '../../assets/figma-welcome/pattern.png';
import smallLogo from '../../assets/figma-welcome/logo-small.png';
import supportButtonPNG from '../../assets/tour-video/support-button.png';
import socialsIconsFooter from '../../assets/welcome-elements/socials-icons.png';

// Analysis-specific assets
import startAnalysisButtonPNG from '../../assets/laba-analysis/укороченная кнопка начать анализ.png';
import followButtonPNG from '../../assets/laba-analysis/кнопка следить.png';
import openButtonPNG from '../../assets/laba-analysis/кнопка открыть рилс.png';

// Figma MCP assets
const footerLogo = "https://www.figma.com/api/mcp/asset/3bd9d147-154a-4929-aab7-9df5b0793789";
const backArrow = "https://www.figma.com/api/mcp/asset/df23cbdc-6a1c-47c3-8b9f-97ecb4397784";
const homeVector1 = "https://www.figma.com/api/mcp/asset/8f6661d8-2d62-49c8-ae88-5e19d118e967";
const homeVector2 = "https://www.figma.com/api/mcp/asset/4a9951a6-1fa4-45c0-a766-090a909e4bed";
const profilePhotoMCP = "https://www.figma.com/api/mcp/asset/fc0179c8-cc8e-471f-8274-5942d8c65827";
const reelCoverMCP = "https://www.figma.com/api/mcp/asset/74ef0920-3323-42e3-9861-7cc651a7d55c";
const playIconMCP = "https://www.figma.com/api/mcp/asset/3a4076c0-f5b7-4650-b1b8-abaaa5b4c1e9";
const likeIconMCP = "https://www.figma.com/api/mcp/asset/e8ca30c1-14d4-4122-b07f-081df50ef9ed";
const statusBarIconsMCP = "https://www.figma.com/api/mcp/asset/4a231acf-1b1e-4cec-9150-e77681537ce5";
const instaLogoMCP = "https://www.figma.com/api/mcp/asset/19e1de1d-26ef-46f5-9058-54e116ccfea0";

export const LabaAnalysisScreen: React.FC = () => {
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

        {/* Title "ИИ-анализ контента" - 7:756 */}
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
          lineHeight: '1',
        }}>
          ИИ-анализ контента
        </div>

        {/* Subtitle - 7:800 */}
        <div style={{
          position: 'absolute',
          left: '85px',
          top: '292px',
          width: '882px',
          fontFamily: 'Gotham Pro, sans-serif',
          fontWeight: 300,
          fontSize: '40px',
          color: 'white',
          lineHeight: '40px',
        }}>
          искусственный интеллект проанализирует виральность и напишет сценарий
        </div>

        {/* Outer background layer - 292:630 (главная подложка) */}
        <div style={{
          position: 'absolute',
          left: '88px',
          top: '381px',
          width: '1004px',
          height: '1661px',
          backdropFilter: 'blur(50px)',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '4px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '30px',
        }} />

        {/* Main card container - 292:631 (подложка вторая черная) */}
        <div style={{
          position: 'absolute',
          left: '141px',
          top: '437px',
          width: '898px',
          height: '1536px',
          backdropFilter: 'blur(50px)',
          background: 'black',
          border: '4px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '30px',
          overflow: 'hidden',
        }}>
          {/* Reel cover image - 292:652 */}
          <div style={{
            position: 'absolute',
            left: '53px',
            top: '47px',
            width: '796px',
            height: '748px',
            border: '2px solid rgba(0, 0, 0, 0.3)',
            borderRadius: '20px',
            overflow: 'hidden',
          }}>
            <img
              src={reelCoverMCP}
              alt=""
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '20px',
              }}
            />
          </div>

          {/* Badge "новое" - 292:658 */}
          <div style={{
            position: 'absolute',
            left: '627px',
            top: '97px',
            width: '173px',
            height: '58px',
            backdropFilter: 'blur(50px)',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '62px',
            overflow: 'clip',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{
              fontFamily: 'Gotham Pro, sans-serif',
              fontWeight: 500,
              fontSize: '30px',
              color: 'white',
              textAlign: 'center',
            }}>
              новое
            </div>
          </div>

          {/* Like icon - 292:660 */}
          <div style={{
            position: 'absolute',
            left: '102px',
            top: '90px',
            width: '72px',
            height: '72px',
          }}>
            <img src={likeIconMCP} alt="" style={{ width: '100%', height: '100%' }} />
          </div>

          {/* Play button - 292:735 */}
          <div style={{
            position: 'absolute',
            left: '403px',
            top: '363px',
            width: '98px',
            height: '98px',
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
              <img src={playIconMCP} alt="" style={{ width: '100%', height: '100%', maxWidth: 'none' }} />
            </div>
          </div>

          {/* Status bar - 292:661 */}
          <div style={{
            position: 'absolute',
            left: '174px',
            top: '688px',
            width: '550px',
            height: '89px',
            backdropFilter: 'blur(50px)',
            background: 'black',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '62px',
            overflow: 'clip',
          }}>
            {/* Views icon - 292:662 */}
            <div style={{
              position: 'absolute',
              height: '56px',
              left: '55px',
              top: '17px',
              width: '66px',
            }}>
              <div style={{
                position: 'absolute',
                inset: 0,
                overflow: 'hidden',
                pointerEvents: 'none',
              }}>
                <img 
                  src={statusBarIconsMCP}
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

            {/* Likes icon - 292:663 */}
            <div style={{
              position: 'absolute',
              height: '64px',
              left: '221px',
              top: '13px',
              width: '66px',
            }}>
              <div style={{
                position: 'absolute',
                inset: 0,
                overflow: 'hidden',
                pointerEvents: 'none',
              }}>
                <img 
                  src={statusBarIconsMCP}
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

            {/* Comments icon - 292:664 */}
            <div style={{
              position: 'absolute',
              height: '66px',
              left: '371px',
              top: '11px',
              width: '68px',
            }}>
              <div style={{
                position: 'absolute',
                inset: 0,
                overflow: 'hidden',
                pointerEvents: 'none',
              }}>
                <img 
                  src={statusBarIconsMCP}
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

            {/* 227к - 292:665 */}
            <div style={{
              position: 'absolute',
              left: '121px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '109px',
              fontFamily: 'Gotham Pro, sans-serif',
              fontWeight: 500,
              fontSize: '35px',
              color: 'white',
              textAlign: 'left',
            }}>
              227к
            </div>

            {/* 40к - 292:666 */}
            <div style={{
              position: 'absolute',
              left: '287px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '92px',
              fontFamily: 'Gotham Pro, sans-serif',
              fontWeight: 500,
              fontSize: '35px',
              color: 'white',
              textAlign: 'left',
            }}>
              40к
            </div>

            {/* 2к - 292:667 */}
            <div style={{
              position: 'absolute',
              left: '439px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '67px',
              fontFamily: 'Gotham Pro, sans-serif',
              fontWeight: 500,
              fontSize: '35px',
              color: 'white',
              textAlign: 'left',
            }}>
              2к
            </div>
          </div>

          {/* Date badge "2 месяца назад" - 292:668 */}
          <div style={{
            position: 'absolute',
            left: '286px',
            top: '777px',
            width: '326px',
            height: '57px',
            backdropFilter: 'blur(50px)',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '62px',
            overflow: 'clip',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{
              fontFamily: 'Gotham Pro, sans-serif',
              fontWeight: 500,
              fontSize: '32px',
              color: 'white',
              textAlign: 'center',
            }}>
              2 месяца назад
            </div>
          </div>

          {/* Profile photo - 292:675 */}
          <div style={{
            position: 'absolute',
            left: '53px',
            top: '850px',
            width: '190px',
            height: '190px',
            borderRadius: '640px',
            overflow: 'hidden',
          }}>
            <img
              src={profilePhotoMCP}
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

          {/* Instagram logo - 292:676 */}
          <div style={{
            position: 'absolute',
            left: '259px',
            top: '857px',
            width: '64px',
            height: '78px',
          }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              opacity: 0.6,
              overflow: 'hidden',
              pointerEvents: 'none',
            }}>
              <img
                src={instaLogoMCP}
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

          {/* Username - 292:677 */}
          <div style={{
            position: 'absolute',
            left: '259px',
            top: '935px',
            width: '334px',
            height: '42px',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 700,
            fontSize: '40px',
            color: 'white',
            textAlign: 'center',
            lineHeight: '42px',
          }}>
            @mishchenko.is
          </div>

          {/* Followers - 292:678 */}
          <div style={{
            position: 'absolute',
            left: '256px',
            top: '992px',
            width: '350px',
            height: '26px',
            fontFamily: 'Gotham Pro, sans-serif',
            fontWeight: 300,
            fontSize: '32px',
            color: 'white',
            textAlign: 'center',
            lineHeight: '26px',
          }}>
            275,5к подписчиков
          </div>

          {/* Description label - 292:680 */}
          <div style={{
            position: 'absolute',
            left: '53px',
            top: '1095px',
            width: '373px',
            height: '46px',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 700,
            fontSize: '40px',
            color: 'white',
            lineHeight: '46px',
          }}>
            описание
          </div>

          {/* Description text - 292:682 */}
          <div style={{
            position: 'absolute',
            left: '53px',
            top: '1148px',
            width: '723px',
            fontFamily: 'Gotham Pro, sans-serif',
            fontWeight: 300,
            fontSize: '35px',
            color: 'white',
            lineHeight: '42px',
          }}>
            а вы знали, что так вообще возможно?
          </div>

          {/* Button "следить" - 292:694 */}
          <img
            src={followButtonPNG}
            alt="следить"
            style={{
              position: 'absolute',
              left: '602px',
              top: '854px',
              width: '246.93px',
              height: '79.25px',
              cursor: 'pointer',
            }}
          />

          {/* Button "открыть" - 292:742 */}
          <img
            src={openButtonPNG}
            alt="открыть"
            style={{
              position: 'absolute',
              left: '663px',
              top: '933px',
              width: '186px',
              height: '79px',
              cursor: 'pointer',
            }}
          />

          {/* Under blur frame - 292:734 (под фон закрытый) */}
          <div style={{
            position: 'absolute',
            left: '84px',
            top: '1267px',
            width: '350px',
            height: '161px',
          }}>
            {/* Instagram logo - 292:730 */}
            <div style={{
              position: 'absolute',
              left: '3px',
              top: '0px',
              width: '64px',
              height: '78px',
            }}>
              <div style={{
                position: 'absolute',
                inset: 0,
                opacity: 0.6,
                overflow: 'hidden',
                pointerEvents: 'none',
              }}>
                <img
                  src={instaLogoMCP}
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

            {/* @mishchenko.is - 292:731 */}
            <div style={{
              position: 'absolute',
              left: '3px',
              top: '78px',
              width: '334px',
              height: '42px',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 700,
              fontSize: '40px',
              color: '#d5fc44',
              textAlign: 'center',
              lineHeight: '42px',
            }}>
              @mishchenko.is
            </div>

            {/* 275,5к подписчиков - 292:732 */}
            <div style={{
              position: 'absolute',
              left: '0px',
              top: '135px',
              width: '350px',
              height: '26px',
              fontFamily: 'Gotham Pro, sans-serif',
              fontWeight: 300,
              fontSize: '32px',
              color: '#d5fc44',
              textAlign: 'center',
              lineHeight: '26px',
            }}>
              275,5к подписчиков
            </div>
          </div>

          {/* Blur frame overlay - 292:684 */}
          <div style={{
            position: 'absolute',
            left: '53px',
            top: '1207px',
            width: '796px',
            height: '282px',
            backdropFilter: 'blur(50px)',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '30px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '20px',
            zIndex: 5,
          }}>
            {/* Button "начать анализ" - 292:719 */}
            <img
              src={startAnalysisButtonPNG}
              alt="начать анализ 100"
              style={{
                width: '530px',
                height: '139px',
                cursor: 'pointer',
              }}
            />

            {/* Text "вы можете пополнить баланс" - 292:726 */}
            <div style={{
              width: '495px',
              fontFamily: 'Gotham Pro, sans-serif',
              fontWeight: 300,
              fontSize: '32px',
              color: 'white',
              textAlign: 'center',
              lineHeight: '32px',
            }}>
              вы можете пополнить баланс <span style={{ fontWeight: 500 }}>в личном кабинете</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          position: 'absolute',
          height: '124px',
          left: 'calc(50% - 5px)',
          top: '2071px',
          transform: 'translateX(-50%)',
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
