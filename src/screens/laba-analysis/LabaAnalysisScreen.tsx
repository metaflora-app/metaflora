import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// API and types
import { 
  analyzeReel, 
  generateScenario, 
  getTelegramUserId,
  formatCount,
  formatTimeAgo,
  convertInstagramImageUrl,
  trackAccount 
} from '../../utils/labaApi';
import { Reel, Analysis, Scenario } from '../../types/laba';

// Components
import { BlurAnalysisCard } from '../../components/BlurAnalysisCard';

// Background & header
import bgPattern from '../../assets/figma-welcome/pattern.png';
import smallLogo from '../../assets/figma-welcome/logo-small.png';
import supportButtonPNG from '../../assets/tour-video/support-button.png';
import socialsIconsFooter from '../../assets/welcome-elements/socials-icons.png';
import logoFooter from '../../assets/figma-welcome/logo-footer.png';
import mainBackdrop from '../../assets/shared-redesign/главная подложка новая.png';

// Analysis-specific assets
import openButtonPNG from '../../assets/laba-analysis/кнопка открыть рилс.png';
import followButtonPNG from '../../assets/laba-analysis/кнопка следить активирована.png';
import unfollowButtonPNG from '../../assets/laba-analysis/кнопка не следить если отмена.png';
import startAnalysisButtonPNG from '../../assets/laba-analysis/поменьше кнопка начать анализ.png';
import createScenarioButtonPNG from '../../assets/laba-analysis/поменьше кнопка создать сценарий.png';

// Real images from assets
import reelCoverImage from '../../assets/laba-real/обложка рилс.png';
import profilePhotoImage from '../../assets/laba-real/фото профиля.png';
import instaLogoImage from '../../assets/laba-real/лого инста.png';

// Laba icons
import playIcon from '../../assets/tour-video/play-icon.png';
import viewsIcon from '../../assets/laba-icons/иконка просмотры.png';
import likesIcon from '../../assets/laba-icons/иконка лайки.png';
import commentsIcon from '../../assets/laba-icons/иконка комментарии.png';

// Use real images
const profilePhotoMCP = profilePhotoImage;
const instaLogoMCP = instaLogoImage;

export const LabaAnalysisScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;
  
  // Get reel from location state
  const reel = (location.state as { reel?: Reel })?.reel;
  
  // Analysis data
  const [analysis, setAnalysis] = React.useState<Analysis | null>(null);
  const [scenario, setScenario] = React.useState<Scenario | null>(null);
  
  // Loading states
  const [analyzing, setAnalyzing] = React.useState(false);
  const [generatingScenario, setGeneratingScenario] = React.useState(false);
  
  // UI state
  const [showAnalysisResults, setShowAnalysisResults] = React.useState(false);
  const [showScenario, setShowScenario] = React.useState(false);
  const [isFollowing, setIsFollowing] = React.useState(false);
  const [trackingAccount, setTrackingAccount] = React.useState(false);
  
  // Конвертируем Instagram URL в прокси URL
  const avatarUrl = React.useMemo(() => {
    return convertInstagramImageUrl(reel?.accountProfilePicUrl);
  }, [reel?.accountProfilePicUrl]);
  
  // Конвертируем обложку через прокси
  const coverUrl = React.useMemo(() => {
    return convertInstagramImageUrl(reel?.coverImageUrl) || reel?.coverImageUrl || '';
  }, [reel?.coverImageUrl]);
  
  // Redirect if no reel provided
  React.useEffect(() => {
    if (!reel) {
      navigate('/laba-main');
    }
  }, [reel, navigate]);

  // Handle start analysis
  const handleStartAnalysis = async () => {
    if (!reel || analyzing) return; // Защита от двойного вызова
    
    const userId = getTelegramUserId();
    if (!userId) {
      if ((window as any).Telegram?.WebApp?.showAlert) {
        (window as any).Telegram.WebApp.showAlert('ошибка получения telegram user id');
      }
      return;
    }
    
    try {
      setAnalyzing(true);
      const analysisResult = await analyzeReel(reel.id, userId);
      setAnalysis(analysisResult);
      setShowAnalysisResults(true);

      if ((window as any).Telegram?.WebApp?.showPopup) {
        (window as any).Telegram.WebApp.showPopup({ message: 'анализ успешно завершен' });
      }

      navigate('/laba-analysis-full', { state: { reel, analysis: analysisResult } });
    } catch (error: any) {
      console.error('Ошибка анализа:', error);
      if ((window as any).Telegram?.WebApp?.showPopup) {
        (window as any).Telegram.WebApp.showPopup({
          message: `${error.message || 'ошибка анализа'}\n\n(не закрывайте окно, иначе действие может прерваться)`
        });
      }
    } finally {
      setAnalyzing(false);
    }
  };

  // Handle track account (как handleStartTracking в LabaSearchAccountScreen)
  const handleTrackAccount = async () => {
    if (!reel) return;
    
    const userId = getTelegramUserId();
    if (!userId) {
      if ((window as any).Telegram?.WebApp?.showAlert) {
        (window as any).Telegram.WebApp.showAlert('ошибка получения telegram user id');
      }
      return;
    }
    
    // Показываем попап СРАЗУ при клике
    if ((window as any).Telegram?.WebApp?.showPopup) {
      (window as any).Telegram.WebApp.showPopup(
        {
          message: 'аккаунт будет добавлен в отслеживаемые вместе с последними опубликованными reels\n\nстоимость за каждое последующее видео после отслеживания — 15 метакоинов'
        },
        async () => {
          // После закрытия попапа - добавляем аккаунт и переходим
          try {
            setTrackingAccount(true);
            const result = await trackAccount(reel.accountUsername, userId);
            
            // Переходим на LabaTrackedScreen где начнется скрапинг
            navigate('/laba-tracked');
          } catch (error: any) {
            console.error('Ошибка отслеживания:', error);
            if ((window as any).Telegram?.WebApp?.showAlert) {
              (window as any).Telegram.WebApp.showAlert(error.message || 'ошибка отслеживания');
            }
          } finally {
            setTrackingAccount(false);
          }
        }
      );
    }
  };

  // Handle generate scenario
  const handleGenerateScenario = async () => {
    if (!analysis?.id) return;
    
    const userId = getTelegramUserId();
    if (!userId) {
      if ((window as any).Telegram?.WebApp?.showAlert) {
        (window as any).Telegram.WebApp.showAlert('ошибка получения telegram user id');
      }
      return;
    }
    
    try {
      setGeneratingScenario(true);
      const scenarioResult = await generateScenario(analysis.id, userId);
      setScenario(scenarioResult);
      setShowScenario(true);
      
      // Попап успешного завершения
      if ((window as any).Telegram?.WebApp?.showPopup) {
        (window as any).Telegram.WebApp.showPopup({
          message: 'сценарий успешно создан'
        });
      }
    } catch (error: any) {
      console.error('Ошибка генерации сценария:', error);
      if ((window as any).Telegram?.WebApp?.showPopup) {
        (window as any).Telegram.WebApp.showPopup({
          message: `${error.message || 'ошибка генерации сценария'}\n\n(не закрывайте окно, иначе действие может прерваться)`
        });
      }
    } finally {
      setGeneratingScenario(false);
    }
  };

  if (!reel) return null;

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

        {/* Outer background layer - 292:630 (главная подложка) */}
        <img
          src={mainBackdrop}
          alt=""
          style={{
            position: 'absolute',
            left: '88px',
            top: '399px',
            width: '1004px',
            height: '1643px',
            objectFit: 'fill',
            pointerEvents: 'none',
          }}
        />

        {/* Main card container - 292:631 (подложка вторая черная) - СКРОЛЛ СРАЗУ НА ТЕМНОЙ ОБЛАСТИ */}
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
          overflow: 'hidden',
          overflowY: 'auto',
          WebkitMaskImage: 'linear-gradient(to bottom, black calc(100% - 80px), transparent 100%)',
          maskImage: 'linear-gradient(to bottom, black calc(100% - 80px), transparent 100%)',
        }}>
          {/* Контент внутри скроллируемой области */}
          <div style={{
            position: 'relative',
            minHeight: '100%',
          }}>
          {/* Reel cover image - 292:652 - ЧЕРЕЗ ПРОКСИ */}
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
              src={coverUrl}
              alt=""
              crossOrigin="anonymous"
              onError={(e) => {
                console.error('[COVER] ❌ Ошибка загрузки:', coverUrl);
                console.error('[COVER] Оригинальный URL:', reel.coverImageUrl);
              }}
              onLoad={() => {
                console.log('[COVER] ✅ Загружена');
              }}
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

          {/* Play button */}
          <div 
            onClick={() => window.open(reel.reelUrl, '_blank')}
            className="blur-wave" 
            style={{
              position: 'absolute',
              left: '403px',
              top: '363px',
              width: '98px',
              height: '98px',
              backdropFilter: 'blur(50px)',
              background: 'rgba(0, 0, 0, 0.1)',
              border: '4px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '62px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}>
            <img 
              src={playIcon}
              alt="play"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
          </div>



          {/* Status bar - 292:661 - FLEX VERSION с кеглем 35px */}
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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '35px',
            padding: '0 45px',
          }}>
            {/* Views */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}>
              <img 
                src={viewsIcon}
                alt=""
                style={{
                  width: '66px',
                  height: '56px',
                  objectFit: 'contain',
                }}
              />
              <div style={{
                fontFamily: 'Gotham Pro, sans-serif',
                fontWeight: 500,
                fontSize: '35px',
                color: 'white',
                lineHeight: '1',
                display: 'flex',
                alignItems: 'center',
              }}>
                {formatCount(reel.viewsCount)}
              </div>
            </div>

            {/* Likes */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}>
              <img 
                src={likesIcon}
                alt=""
                style={{
                  width: '66px',
                  height: '64px',
                  objectFit: 'contain',
                }}
              />
              <div style={{
                fontFamily: 'Gotham Pro, sans-serif',
                fontWeight: 500,
                fontSize: '35px',
                color: 'white',
                lineHeight: '1',
                display: 'flex',
                alignItems: 'center',
              }}>
                {formatCount(reel.likesCount)}
              </div>
            </div>

            {/* Comments */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}>
              <img 
                src={commentsIcon}
                alt=""
                style={{
                  width: '68px',
                  height: '66px',
                  objectFit: 'contain',
                }}
              />
              <div style={{
                fontFamily: 'Gotham Pro, sans-serif',
                fontWeight: 500,
                fontSize: '35px',
                color: 'white',
                lineHeight: '1',
                display: 'flex',
                alignItems: 'center',
              }}>
                {formatCount(reel.commentsCount)}
              </div>
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
              {reel ? formatTimeAgo(reel.publishedAt) : ''}
            </div>
          </div>

          {/* Profile photo - 292:675 - РЕАЛЬНАЯ АВАТАРКА через прокси */}
          <div style={{
            position: 'absolute',
            left: '53px',
            top: '850px',
            width: '190px',
            height: '190px',
            borderRadius: '640px',
            overflow: 'hidden',
            background: 'rgba(255, 255, 255, 0.1)',
          }}>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={reel.accountUsername}
                crossOrigin="anonymous"
                onError={(e) => {
                  console.error('[ANALYSIS-AVATAR] ❌ Ошибка загрузки:', avatarUrl);
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.parentElement?.querySelector('.fallback-avatar') as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '640px',
                }}
              />
            ) : null}
            <div 
              className="fallback-avatar"
              style={{
                position: 'absolute',
                inset: 0,
                display: avatarUrl ? 'none' : 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '80px',
                color: 'white',
                fontWeight: 700,
              }}>
              {reel.accountUsername.charAt(0).toUpperCase()}
            </div>
          </div>

          {/* Instagram logo - 292:676 - НОРМАЛЬНОЕ */}
          <img 
            src={instaLogoMCP}
            alt=""
            style={{
              position: 'absolute',
              left: '259px',
              top: '870px',
              width: '64px',
              height: '78px',
              opacity: 0.6,
            }}
          />

          {/* Username и подписчики - В ОДНУ СТРОКУ слева под лого инста */}
          <div style={{
            position: 'absolute',
            left: '259px',
            top: '950px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}>
            {/* Username - 292:677 */}
            <div style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 700,
              fontSize: '40px',
              color: 'white',
              lineHeight: '42px',
            }}>
              @{reel.accountUsername}
            </div>

            {/* Followers - 292:678 */}
            <div style={{
              fontFamily: 'Gotham Pro, sans-serif',
              fontWeight: 300,
              fontSize: '32px',
              color: 'white',
              lineHeight: '26px',
            }}>
              {formatCount(reel.accountFollowers)} подписчиков
            </div>
          </div>

          {/* ПОЛНЫЙ БЛОК: описание + кнопка/анализ - ВСЕ ДИНАМИЧЕСКИ */}
          <div style={{
            position: 'absolute',
            left: '53px',
            top: '1095px',
            width: '796px',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {/* Description label */}
            <div style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 700,
              fontSize: '40px',
              color: 'white',
              lineHeight: '46px',
              marginBottom: '12px',
            }}>
              описание
            </div>

            {/* Description text */}
            <div style={{
              fontFamily: 'Gotham Pro, sans-serif',
              fontWeight: 300,
              fontSize: '35px',
              color: 'white',
              lineHeight: '42px',
              marginBottom: '30px',
            }}>
              {reel.caption || 'без описания'}
            </div>

            {/* Кнопка "начать анализ" ПОД описанием */}
            {!showAnalysisResults && !analyzing && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '20px',
                marginTop: '20px',
              }}>
                <img
                  src={startAnalysisButtonPNG}
                  alt="начать анализ"
                  onClick={() => {
                    if (window.Telegram?.WebApp?.showPopup) {
                      window.Telegram.WebApp.showPopup({
                        message: 'анализируем видео...\n\nэто может занять 30-60 секунд'
                      });
                    }
                    handleStartAnalysis();
                  }}
                  className="button-inner-glow"
                  style={{
                    width: '530px',
                    height: '139px',
                    cursor: 'pointer',
                  }}
                />
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

            {/* BlurAnalysisCard при analyzing */}
            {analyzing && !showAnalysisResults && (
              <div style={{ marginTop: '20px' }}>
                <BlurAnalysisCard />
              </div>
            )}

            {/* Analysis results - показываем ВСЕ блоки БЕЗ блюра */}
            {showAnalysisResults && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '30px',
                marginTop: '20px',
              }}>
                {/* виральность */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 700,
                    fontSize: '40px',
                    color: 'white',
                    lineHeight: '46px',
                  }}>
                    виральность
                  </div>
                  <div style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 700,
                    fontSize: '40px',
                    color: (analysis?.viralityScore || 0) < 4 
                      ? '#ff4444' // красный
                      : (analysis?.viralityScore || 0) < 7 
                        ? '#ffcc00' // желтый
                        : '#d5fc44', // зеленый
                    lineHeight: '46px',
                  }}>
                    {analysis?.viralityScore || 0} баллов
                  </div>
                  <div style={{
                    fontFamily: 'Gotham Pro, sans-serif',
                    fontWeight: 300,
                    fontSize: '35px',
                    color: 'white',
                    lineHeight: '42px',
                    whiteSpace: 'pre-wrap', // Сохраняем переносы строк
                  }}>
                    {analysis?.viralityExplanation || '...'}
                  </div>
                </div>

                {/* хук */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 700,
                    fontSize: '40px',
                    color: 'white',
                    lineHeight: '46px',
                  }}>
                    хук
                  </div>
                  <div style={{
                    fontFamily: 'Gotham Pro, sans-serif',
                    fontWeight: 300,
                    fontSize: '35px',
                    color: 'white',
                    lineHeight: '42px',
                  }}>
                    {analysis?.hookText || '...'}
                  </div>
                </div>

                {/* транскрибация */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 700,
                    fontSize: '40px',
                    color: 'white',
                    lineHeight: '46px',
                  }}>
                    транскрибация
                  </div>
                  <div style={{
                    fontFamily: 'Gotham Pro, sans-serif',
                    fontWeight: 300,
                    fontSize: '35px',
                    color: 'white',
                    lineHeight: '42px',
                  }}>
                    {analysis?.transcription || '...'}
                  </div>
                </div>

                {/* суть видео */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 700,
                    fontSize: '40px',
                    color: 'white',
                    lineHeight: '46px',
                  }}>
                    суть видео
                  </div>
                  <div style={{
                    fontFamily: 'Gotham Pro, sans-serif',
                    fontWeight: 300,
                    fontSize: '35px',
                    color: 'white',
                    lineHeight: '42px',
                  }}>
                    {analysis?.videoSummary || '...'}
                  </div>
                </div>

                {/* Кнопка "создать сценарий" БЕЗ блюра */}
                {!showScenario && !generatingScenario && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '20px',
                    marginTop: '20px',
                  }}>
                    <img
                      src={createScenarioButtonPNG}
                      alt="создать сценарий"
                      onClick={() => {
                        if (window.Telegram?.WebApp?.showPopup) {
                          window.Telegram.WebApp.showPopup({
                            message: 'создаем сценарий...\n\nэто может занять 20-40 секунд'
                          });
                        }
                        handleGenerateScenario();
                      }}
                      className="button-inner-glow"
                      style={{
                        width: '530px',
                        height: '139px',
                        cursor: 'pointer',
                      }}
                    />
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

                {/* BlurAnalysisCard ТОЛЬКО для блока сценария БЕЗ заголовка */}
                {generatingScenario && (
                  <div style={{
                    marginTop: '20px',
                  }}>
                    <BlurAnalysisCard />
                  </div>
                )}

                {/* Scenario results - после создания */}
                {showScenario && !generatingScenario && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
                    <div style={{
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 700,
                      fontSize: '40px',
                      color: 'white',
                      lineHeight: '46px',
                    }}>
                      новый сценарий
                    </div>
                    <div style={{
                      fontFamily: 'Gotham Pro, sans-serif',
                      fontWeight: 300,
                      fontSize: '35px',
                      color: 'white',
                      lineHeight: '42px',
                      whiteSpace: 'pre-wrap',
                    }}>
                      {scenario?.text || '...'}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Button "следить" - АКТИВНАЯ ВЕРСИЯ - ПОВЕРХ ВСЕХ СЛОЕВ */}
          <img
            src={followButtonPNG}
            alt="следить"
            onClick={handleTrackAccount}
            className="button-inner-glow"
            style={{
              position: 'absolute',
              left: '602px',
              top: '854px',
              width: '246.93px',
              height: '79.25px',
              cursor: 'pointer',
              zIndex: 999999,
              pointerEvents: 'auto',
            }}
          />

          {/* Button "открыть" - 292:742 */}
          <img
            src={openButtonPNG}
            alt="открыть"
            onClick={() => window.open(reel.reelUrl, '_blank')}
            className="button-inner-glow"
            style={{
              position: 'absolute',
              left: '663px',
              top: '933px',
              width: '186px',
              height: '79px',
              cursor: 'pointer',
              zIndex: 999999,
            }}
          />

          </div>
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
