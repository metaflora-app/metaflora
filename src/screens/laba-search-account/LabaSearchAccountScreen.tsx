import React from 'react';
import { useNavigate } from 'react-router-dom';

// API and types
import { 
  searchAccount, 
  trackAccount, 
  getTelegramUserId 
} from '../../utils/labaApi';
import { InstagramAccount } from '../../types/laba';

// Reused assets
import bgPattern from '../../assets/figma-welcome/pattern.png';
import logoSmall from '../../assets/figma-welcome/logo-small.png';
import logoFooter from '../../assets/figma-welcome/logo-footer.png';
import socialsIcons from '../../assets/welcome-elements/socials-icons.png';
import supportButton from '../../assets/tour-video/support-button.png';

// Search account specific assets
import promptPlate from '../../assets/laba-search-account/промпт плашка.png';
import instaLogo from '../../assets/laba-search-account/лого инста.png';
import profilePhoto from '../../assets/laba-search-account/фото профиля.png';
import trackingButton from '../../assets/laba-search-account/укороченная кнопка начать отслеживание.png';
import peopleBackground from '../../assets/laba-search-account/люди друг на друге.png';
import searchIcon from '../../assets/laba-search-account/иконка поиск.png';

export const LabaSearchAccountScreen: React.FC = () => {
  const navigate = useNavigate();
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;
  
  const [linkInput, setLinkInput] = React.useState('');
  const [nicknameInput, setNicknameInput] = React.useState('');
  const [isLinkFocused, setIsLinkFocused] = React.useState(false);
  const [isNicknameFocused, setIsNicknameFocused] = React.useState(false);
  
  // Account data
  const [foundAccount, setFoundAccount] = React.useState<InstagramAccount | null>(null);
  const [searching, setSearching] = React.useState(false);
  const [tracking, setTracking] = React.useState(false);

  const handleSearch = async () => {
    const query = linkInput || nicknameInput;
    if (!query.trim()) {
      if (window.Telegram?.WebApp?.showPopup) {
        window.Telegram.WebApp.showPopup({
          message: 'введите ссылку или ник аккаунта'
        });
      }
      return;
    }
    
    try {
      setSearching(true);
      const account = await searchAccount(query);
      console.log('[SEARCH] Найден аккаунт:', account);
      console.log('[SEARCH] profilePhotoUrl:', account.profilePhotoUrl);
      setFoundAccount(account);
    } catch (error: any) {
      console.error('Ошибка поиска аккаунта:', error);
      if (window.Telegram?.WebApp?.showPopup) {
        window.Telegram.WebApp.showPopup({
          message: error.message || 'ничего не найдено. проверьте корректность ссылки или ника'
        });
      }
    } finally {
      setSearching(false);
    }
  };

  const handleStartTracking = async () => {
    if (!foundAccount) return;
    
    const userId = getTelegramUserId();
    if (!userId) {
      if ((window as any).Telegram?.WebApp?.showAlert) {
        (window as any).Telegram.WebApp.showAlert('ошибка получения telegram user id');
      }
      return;
    }
    
    try {
      setTracking(true);
      await trackAccount(foundAccount.username, userId);
      
      if (window.Telegram?.WebApp?.showPopup) {
        window.Telegram.WebApp.showPopup({
          message: 'аккаунт добавлен в отслеживаемые'
        });
      }
      
      navigate('/laba-tracked');
    } catch (error: any) {
      console.error('Ошибка отслеживания:', error);
      if ((window as any).Telegram?.WebApp?.showAlert) {
        (window as any).Telegram.WebApp.showAlert(error.message || 'ошибка отслеживания');
      }
    } finally {
      setTracking(false);
    }
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
        {/* Background pattern */}
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

        {/* Header */}
        
        <div 
          onClick={() => navigate('/main-dashboard-premium')}
          style={{
            position: 'absolute',
            left: '500px',
            top: '61px',
            width: '186px',
            height: '131px',
            cursor: 'pointer',
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

        {/* Support button PNG (109:609) */}
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

        {/* Main card (109:626) - главная подложка */}
        <div className="blur-wave" style={{
          position: 'absolute',
          left: '88px',
          top: '397px',
          width: '1004px',
          height: '1643px',
          backdropFilter: 'blur(50px)',
          background: 'rgba(255,255,255,0.1)',
          border: '4px solid rgba(255,255,255,0.3)',
          borderRadius: '30px',
        }} />

        {/* Black card (109:631) - подложка вторая черная */}
        <div className="blur-wave" style={{
          position: 'absolute',
          left: '141px',
          top: '453px',
          width: '898px',
          height: '1536px',
          backdropFilter: 'blur(50px)',
          background: 'black',
          border: '4px solid rgba(255,255,255,0.3)',
          borderRadius: '30px',
          overflow: 'hidden',
        }}>
          {/* "добавить ссылку" - CSS (109:640) - x=190, y=502 relative to frame, so 190-141=49, 502-453=49 */}
          <div style={{
            position: 'absolute',
            left: '49px',
            top: '49px',
            fontFamily: 'Inter',
            fontWeight: 700,
            fontSize: '40px',
            lineHeight: 1,
            color: 'white',
          }}>
            добавить ссылку
          </div>

          {/* Search input 1 (109:633) - x=190, y=575 relative to frame, so 190-141=49, 575-453=122 */}
          <div style={{
            position: 'absolute',
            left: '49px',
            top: '122px',
            width: '800px',
            height: '72px',
            border: '4px solid rgba(255,255,255,0.3)',
            borderRadius: '62px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: '18px',
          }}>
            <img 
              src={searchIcon}
              alt=""
              style={{
                width: '38px',
                height: '38px',
                marginRight: '15px',
              }}
            />
            <input
              type="text"
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
              onFocus={() => setIsLinkFocused(true)}
              onBlur={() => setIsLinkFocused(false)}
              placeholder={isLinkFocused ? '' : 'вставьте ссылку напрямую'}
              enterKeyHint="search"
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontFamily: 'Gotham Pro',
                fontWeight: 300,
                fontSize: '32px',
                color: 'white',
                paddingRight: '20px',
              }}
            />
          </div>

          {/* "найти по нику" - CSS (109:636) - x=190, y=674 relative to frame, so 190-141=49, 674-453=221 */}
          <div style={{
            position: 'absolute',
            left: '49px',
            top: '221px',
            fontFamily: 'Inter',
            fontWeight: 700,
            fontSize: '40px',
            lineHeight: 1,
            color: 'white',
          }}>
            найти по нику
          </div>

          {/* Search input 2 (109:637) - x=190, y=747 relative to frame, so 190-141=49, 747-453=294 */}
          <div style={{
            position: 'absolute',
            left: '49px',
            top: '294px',
            width: '800px',
            height: '72px',
            border: '4px solid rgba(255,255,255,0.3)',
            borderRadius: '62px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: '18px',
          }}>
            <img 
              src={searchIcon}
              alt=""
              style={{
                width: '38px',
                height: '38px',
                marginRight: '15px',
              }}
            />
            <input
              type="text"
              value={nicknameInput}
              onChange={(e) => setNicknameInput(e.target.value)}
              onFocus={() => setIsNicknameFocused(true)}
              onBlur={() => setIsNicknameFocused(false)}
              placeholder={isNicknameFocused ? '' : 'напишите юзернейм аккаунта через @'}
              enterKeyHint="search"
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontFamily: 'Gotham Pro',
                fontWeight: 300,
                fontSize: '32px',
                color: 'white',
                paddingRight: '20px',
              }}
            />
          </div>

          {/* Find button PNG (109:645) - x=467, y=870 relative to frame, so 467-141=326, 870-453=417 */}
          <img 
            src={promptPlate}
            alt="найти"
            onClick={handleSearch}
            className="button-inner-glow"
            style={{
              position: 'absolute',
              left: '326px',
              top: '417px',
              width: '246.93px',
              height: '79.25px',
              cursor: 'pointer',
            }}
          />

          {/* Loading state */}
          {searching && (
            <div style={{
              position: 'absolute',
              left: '50%',
              top: '700px',
              transform: 'translateX(-50%)',
              fontFamily: 'Gotham Pro, sans-serif',
              fontSize: '32px',
              color: 'white',
              textAlign: 'center',
            }}>
              ищем аккаунт...
            </div>
          )}

          {/* Result section - show only after search */}
          {!searching && foundAccount && (
            <>
              {/* "результат" - CSS (109:664) - x=190, y=986 relative to frame, so 190-141=49, 986-453=533 */}
              <div style={{
                position: 'absolute',
                left: '49px',
                top: '533px',
                fontFamily: 'Inter',
                fontWeight: 700,
                fontSize: '40px',
                lineHeight: 1,
                color: 'white',
              }}>
                результат
              </div>

              {/* Profile photo PNG (109:665) - РЕАЛЬНАЯ АВАТАРКА */}
              <div style={{
                position: 'absolute',
                left: '49px',
                top: '606px',
                width: '190px',
                height: '190px',
                borderRadius: '50%',
                overflow: 'hidden',
                background: 'rgba(255, 255, 255, 0.1)',
              }}>
                {foundAccount.profilePhotoUrl && foundAccount.profilePhotoUrl !== '' ? (
                  <img 
                    src={foundAccount.profilePhotoUrl}
                    alt={foundAccount.username}
                    onError={(e) => {
                      console.error('[AVATAR] Ошибка загрузки:', foundAccount.profilePhotoUrl);
                      console.error('[AVATAR] Тип URL:', typeof foundAccount.profilePhotoUrl);
                      console.error('[AVATAR] Длина URL:', foundAccount.profilePhotoUrl?.length);
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.parentElement?.querySelector('.fallback-avatar') as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                    onLoad={() => {
                      console.log('[AVATAR] Успешно загружена:', foundAccount.profilePhotoUrl);
                    }}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : null}
                <div 
                  className="fallback-avatar"
                  style={{
                    width: '100%',
                    height: '100%',
                    display: (foundAccount.profilePhotoUrl && foundAccount.profilePhotoUrl !== '') ? 'none' : 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '80px',
                    color: 'white',
                    fontWeight: 700,
                  }}>
                  {foundAccount.username.charAt(0).toUpperCase()}
                </div>
              </div>

          {/* Instagram logo PNG (109:666) - left 255px, width 64px */}
          <img 
            src={instaLogo}
            alt=""
            style={{
              position: 'absolute',
              left: '255px',
              top: '613px',
              width: '64px',
              height: '78px',
              opacity: 0.6,
            }}
          />

              {/* Username - выровнен по ПРАВОЙ границе лого: 255 + 64 = 319px */}
              <div style={{
                position: 'absolute',
                left: '319px',
                top: '691px',
                fontFamily: 'Inter',
                fontWeight: 700,
                fontSize: '40px',
                lineHeight: '42px',
                color: 'white',
                whiteSpace: 'nowrap',
              }}>
                @{foundAccount.username}
              </div>

              {/* Followers - выровнен по ПРАВОЙ границе лого: 319px */}
              <div style={{
                position: 'absolute',
                left: '319px',
                top: '748px',
                fontFamily: 'Gotham Pro',
                fontWeight: 300,
                fontSize: '32px',
                lineHeight: '26px',
                color: 'white',
                whiteSpace: 'nowrap',
              }}>
                {foundAccount.followersCount.toLocaleString()} подписчиков
              </div>

              {/* Tracking button (109:677) - x=325, y=1317 relative to frame, so 325-141=184, 1317-453=864 */}
              <img 
                src={trackingButton}
                alt="начать отслеживание"
                onClick={handleStartTracking}
                className="button-inner-glow"
                style={{
                  position: 'absolute',
                  left: '184px',
                  top: '864px',
                  width: '530px',
                  height: '139px',
                  cursor: tracking ? 'wait' : 'pointer',
                  opacity: tracking ? 0.6 : 1,
                }}
              />

              {/* Balance text (109:690) - x=343, y=1474 relative to frame, so 343-141=202, 1474-453=1021 */}
              <div style={{
                position: 'absolute',
                left: '202px',
                top: '1021px',
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
            </>
          )}

          {/* Background image PNG - REMOVED */}
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