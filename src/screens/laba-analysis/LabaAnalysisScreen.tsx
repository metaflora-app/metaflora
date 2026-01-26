import React from 'react';
import { useNavigate } from 'react-router-dom';
import { trackMetacoinsSpend } from '../../utils/supabase';

// Background & header
import bgPattern from '../../assets/figma-welcome/pattern.png';
import smallLogo from '../../assets/figma-welcome/logo-small.png';
import supportButtonPNG from '../../assets/tour-video/support-button.png';
import socialsIconsFooter from '../../assets/welcome-elements/socials-icons.png';

// Analysis-specific assets
import openButtonPNG from '../../assets/laba-analysis/кнопка открыть рилс.png';
import followButtonPNG from '../../assets/laba-analysis/кнопка следить.png';
import unfollowButtonPNG from '../../assets/laba-analysis/кнопка не следить если отмена.png';
import startAnalysisButtonPNG from '../../assets/laba-analysis/поменьше кнопка начать анализ.png';
import createScenarioButtonPNG from '../../assets/laba-analysis/поменьше кнопка создать сценарий.png';
import peopleBackground from '../../assets/laba-no-tracked/люди друг на друге.png';

// Real images from assets
import reelCoverImage from '../../assets/laba-real/обложка рилс.png';
import profilePhotoImage from '../../assets/laba-real/фото профиля.png';
import instaLogoImage from '../../assets/laba-real/лого инста.png';

// Laba icons
import playIcon from '../../assets/laba-icons/кнопка плей.png';
import viewsIcon from '../../assets/laba-icons/иконка просмотры.png';
import likesIcon from '../../assets/laba-icons/иконка лайки.png';
import commentsIcon from '../../assets/laba-icons/иконка комментарии.png';

// Use real images
const profilePhotoMCP = profilePhotoImage;
const reelCoverMCP = reelCoverImage;
const instaLogoMCP = instaLogoImage;

export const LabaAnalysisScreen: React.FC = () => {
  const navigate = useNavigate();
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;
  const [showAnalysisResults, setShowAnalysisResults] = React.useState(false);
  const [showScenario, setShowScenario] = React.useState(false);
  const [isFollowing, setIsFollowing] = React.useState(false);

  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      minHeight: '100vh',
      background: '#020101',
      overflow: 'hidden',
    }}>
      {/* Background pattern - full screen */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${bgPattern})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'repeat',
        }}
      />
      {/* Background pattern - full screen */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${bgPattern})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'repeat',
        }}
      />

      <div style={{
        position: 'relative',
        width: '1180px',
        minHeight: '2550px',
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
      }}>
        {/* Header - Logo */}
        <div 
          onClick={() => navigate('/main-dashboard-premium')}
          style={{
            position: 'absolute',
            height: '131px',
            left: '500px',
            top: '61px',
            width: '186px',
            cursor: 'pointer',
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

        {/* Люди друг на друге - ПОД фреймом */}
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
              src={peopleBackground}
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

        {/* Outer background layer - 292:630 (главная подложка) */}
        <div className="blur-wave" style={{
          position: 'absolute',
          left: '88px',
          top: '399px',
          width: '1004px',
          height: '1643px',
          backdropFilter: 'blur(50px)',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '4px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '30px',
        }} />

        {/* Main card container - 292:631 (подложка вторая черная) */}
        <div className="blur-wave" style={{
          position: 'absolute',
          left: '141px',
          top: '455px',
          width: '898px',
          height: '1536px',
          backdropFilter: 'blur(50px)',
          background: 'black',
          border: '4px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '30px',
          overflow: showAnalysisResults ? 'auto' : 'hidden',
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


          {/* Play button - 292:735 */}
          <div className="blur-wave" style={{
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
              <img src={playIcon} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
          </div>

          {/* Status bar - 292:661 */}
          <div className="blur-wave" style={{
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
                  src={viewsIcon}
                  alt=""
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
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
                  src={likesIcon}
                  alt=""
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
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
                  src={commentsIcon}
                  alt=""
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
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
          <div className="blur-wave" style={{
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

          {/* Button "следить" / "не следить" - 292:694 */}
          <img
            src={isFollowing ? unfollowButtonPNG : followButtonPNG}
            alt={isFollowing ? 'не следить' : 'следить'}
            onClick={() => {
              setIsFollowing(!isFollowing);
              const message = !isFollowing ? 'теперь вы отслеживаете данный профиль' : 'вы больше не отслеживаете данный профиль';
              
              if (window.Telegram?.WebApp?.showPopup) {
                window.Telegram.WebApp.showPopup({
                  message: message
                });
              } else {
                alert(message);
              }
            }}
            className="button-inner-glow"
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
            className="button-inner-glow"
            style={{
              position: 'absolute',
              left: '663px',
              top: '933px',
              width: '186px',
              height: '79px',
              cursor: 'pointer',
            }}
          />

          {/* Under blur frame - 292:734 (под фон закрытый) - HIDE when analysis started */}
          {!showAnalysisResults && (
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
          )}

          {/* Blur frame overlay - 292:684 - HIDE when analysis started */}
          {!showAnalysisResults && (
            <div className="blur-wave" style={{
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
              {/* Кнопка "начать анализ" PNG */}
              <img
                src={startAnalysisButtonPNG}
                alt="начать анализ"
                onClick={async () => {
                  const success = await trackMetacoinsSpend('analysis', 100);
                  if (success) {
                    setShowAnalysisResults(true);
                  } else {
                    console.error('Failed to track analysis spend');
                    if (window.Telegram?.WebApp?.showPopup) {
                      window.Telegram.WebApp.showPopup({
                        message: 'Недостаточно метакоинов или ошибка сервера'
                      });
                    } else {
                      alert('Недостаточно метакоинов или ошибка сервера');
                    }
                  }
                }}
                className="button-inner-glow"
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
          )}

          {/* Analysis results - SHOW when button clicked */}
          {showAnalysisResults && (
            <div style={{
              position: 'absolute',
              left: '53px',
              top: '1250px',
              width: '796px',
            }}>
              {/* виральность - 292:893 */}
              <div style={{
                position: 'absolute',
                left: '0px',
                top: '0px',
                width: '373px',
                height: '46px',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 700,
                fontSize: '40px',
                color: 'white',
                lineHeight: '46px',
              }}>
                виральность
              </div>

              {/* 7.7 баллов - 292:899 */}
              <div style={{
                position: 'absolute',
                left: '0px',
                top: '53px',
                width: '373px',
                height: '46px',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 700,
                fontSize: '40px',
                color: '#d5fc44',
                lineHeight: '46px',
              }}>
                7.7 баллов
              </div>

              {/* Text 1 - 292:894 */}
              <div style={{
                position: 'absolute',
                left: '0px',
                top: '106px',
                width: '797px',
                fontFamily: 'Gotham Pro, sans-serif',
                fontWeight: 300,
                fontSize: '35px',
                color: 'white',
                lineHeight: '42px',
              }}>
                а вы знали, что так вообще возможно?
              </div>

              {/* хук - 292:896 */}
              <div style={{
                position: 'absolute',
                left: '0px',
                top: '195px',
                width: '373px',
                height: '46px',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 700,
                fontSize: '40px',
                color: 'white',
                lineHeight: '46px',
              }}>
                хук
              </div>

              {/* Text 2 - 292:897 */}
              <div style={{
                position: 'absolute',
                left: '0px',
                top: '248px',
                width: '797px',
                fontFamily: 'Gotham Pro, sans-serif',
                fontWeight: 300,
                fontSize: '35px',
                color: 'white',
                lineHeight: '42px',
              }}>
                а вы знали, что так вообще возможно?
              </div>

              {/* транскрибация - 292:901 */}
              <div style={{
                position: 'absolute',
                left: '0px',
                top: '337px',
                width: '373px',
                height: '46px',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 700,
                fontSize: '40px',
                color: 'white',
                lineHeight: '46px',
              }}>
                транскрибация
              </div>

              {/* Text 3 - 292:902 */}
              <div style={{
                position: 'absolute',
                left: '0px',
                top: '390px',
                width: '797px',
                fontFamily: 'Gotham Pro, sans-serif',
                fontWeight: 300,
                fontSize: '35px',
                color: 'white',
                lineHeight: '42px',
              }}>
                а вы знали, что так вообще возможно?
              </div>

              {/* суть видео - 292:904 */}
              <div style={{
                position: 'absolute',
                left: '0px',
                top: '479px',
                width: '373px',
                height: '46px',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 700,
                fontSize: '40px',
                color: 'white',
                lineHeight: '46px',
              }}>
                суть видео
              </div>

              {/* Text 4 - 292:905 */}
              <div style={{
                position: 'absolute',
                left: '0px',
                top: '532px',
                width: '797px',
                fontFamily: 'Gotham Pro, sans-serif',
                fontWeight: 300,
                fontSize: '35px',
                color: 'white',
                lineHeight: '42px',
              }}>
                а вы знали, что так вообще возможно?
              </div>

              {/* Кнопка "создать сценарий" PNG */}
              {!showScenario && (
                <img
                  src={createScenarioButtonPNG}
                  alt="создать сценарий"
                  onClick={async () => {
                    const success = await trackMetacoinsSpend('scenario', 50);
                    if (success) {
                      setShowScenario(true);
                    } else {
                      console.error('Failed to track scenario spend');
                      if (window.Telegram?.WebApp?.showPopup) {
                        window.Telegram.WebApp.showPopup({
                          message: 'Недостаточно метакоинов или ошибка сервера'
                        });
                      } else {
                        alert('Недостаточно метакоинов или ошибка сервера');
                      }
                    }
                  }}
                  className="button-inner-glow"
                  style={{
                    position: 'absolute',
                    left: '131px',
                    top: '621px',
                    width: '530px',
                    height: '139px',
                    cursor: 'pointer',
                  }}
                />
              )}

              {/* Text про баланс - 292:914 - HIDE when scenario created */}
              {!showScenario && (
                <div style={{
                  position: 'absolute',
                  left: '149px',
                  top: '778px',
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
              )}

              {/* Scenario results - SHOW when "создать сценарий" clicked */}
              {showScenario && (
                <>
                  {/* новый сценарий - 292:916 */}
                  <div style={{
                    position: 'absolute',
                    left: '0px',
                    top: '621px',
                    width: '373px',
                    height: '46px',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 700,
                    fontSize: '40px',
                    color: 'white',
                    lineHeight: '46px',
                  }}>
                    новый сценарий
                  </div>

                  {/* Text под сценарием - 292:917 */}
                  <div style={{
                    position: 'absolute',
                    left: '0px',
                    top: '674px',
                    width: '797px',
                    fontFamily: 'Gotham Pro, sans-serif',
                    fontWeight: 300,
                    fontSize: '35px',
                    color: 'white',
                    lineHeight: '42px',
                  }}>
                    а вы знали, что так вообще возможно?
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          position: 'absolute',
          left: 'calc(50% - 5px)',
          top: '2071px',
          transform: 'translateX(-50%)',
          width: '888px',
          height: '124px',
        }}>
          {/* Логотип в подвале */}
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
                src={socialsIconsFooter}
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
          
          {/* Copyright текст */}
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
          
          {/* Подложка под соцсети */}
          <div className="blur-wave" style={{
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
          
          {/* Иконки соцсетей */}
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
                  src={socialsIconsFooter}
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
                  src={socialsIconsFooter}
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
