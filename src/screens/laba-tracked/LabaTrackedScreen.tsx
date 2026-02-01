import React from 'react';
import { useNavigate } from 'react-router-dom';

// API and types
import { 
  getTrackedAccounts, 
  getTrackedReels, 
  untrackAccount,
  getTelegramUserId,
  toggleFavorite,
  scrapeAccountReels,
  convertInstagramImageUrl 
} from '../../utils/labaApi';
import { TrackedAccount, Reel } from '../../types/laba';

// Components
import { ReelCard } from '../../components/ReelCard';
import { BlurReelCard } from '../../components/BlurReelCard';

// Background & header from laba-main
import bgPattern from '../../assets/figma-welcome/pattern.png';
import smallLogo from '../../assets/figma-welcome/logo-small.png';
import supportButtonPNG from '../../assets/tour-video/support-button.png';
import socialsIconsFooter from '../../assets/welcome-elements/socials-icons.png';
import logoFooter from '../../assets/figma-welcome/logo-footer.png';

// Filter buttons from laba-main
import returnButtonPNG from '../../assets/laba-tracked/кнопка вернуть.png';
import sortButtonInactivePNG from '../../assets/laba-main/кнопка сортировка неактив.png';
import sortButtonActivePNG from '../../assets/laba-main/кнопка сортировка актив.png';
import likesBadgeInactivePNG from '../../assets/laba-main/плашка лайки неактив.png';
import likesBadgeActivePNG from '../../assets/laba-main/плашка лайки актив.png';
import newBadgePNG from '../../assets/laba-main/плашка новое.png';
import removeAccountButtonPNG from '../../assets/laba-main/кнопка убрать аккаунт.png';

// Card assets from laba-main
import analysisButtonPNG from '../../assets/laba-main/кнопка анализ.png';
import cardImage from '../../assets/laba-main/картинка в карточке промпта.png';

// No tracked screen assets
import blurOverlay from '../../assets/laba-no-tracked/блюр на отслеживание.png';
import peopleImageNoTracked from '../../assets/laba-no-tracked/люди друг на друге.png';

// Laba icons
import playIcon from '../../assets/tour-video/play-icon.png';
import viewsIcon from '../../assets/laba-icons/иконка просмотры.png';
import likesIcon from '../../assets/laba-icons/иконка лайки.png';
import commentsIcon from '../../assets/laba-icons/иконка комментарии.png';
import instaLogoIcon from '../../assets/laba-icons/лого инста.png';
import plusIcon from '../../assets/laba-icons/emojione-monotone_heavy-plus-sign.png';
import profilePhoto from '../../assets/laba-icons/фото профиля поменьше.png';

const instagramIcon = instaLogoIcon;
const peopleImage = peopleImageNoTracked;

export const LabaTrackedScreen: React.FC = () => {
  const navigate = useNavigate();
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;

  // Tracking cost is charged when user adds account (in LabaSearchAccountScreen)
  const [selectedSort, setSelectedSort] = React.useState<string | null>(null);
  const [likedCards, setLikedCards] = React.useState<Set<string>>(new Set());
  const [accountRemoved, setAccountRemoved] = React.useState(false);
  
  // Tracked accounts data
  const [accounts, setAccounts] = React.useState<TrackedAccount[]>([]);
  const [reels, setReels] = React.useState<Reel[]>([]);
  const [selectedAccountId, setSelectedAccountId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [scraping, setScraping] = React.useState(false);

  // Load tracked accounts - перезагружаем при каждом возврате на экран
  React.useEffect(() => {
    const fetchAccounts = async () => {
      const userId = getTelegramUserId();
      if (!userId) return;
      
      try {
        setLoading(true);
        const trackedAccounts = await getTrackedAccounts(userId);
        console.log('[TRACKED] Загружены аккаунты:', trackedAccounts);
        trackedAccounts.forEach(acc => {
          console.log(`[TRACKED] ${acc.username}: profilePhotoUrl=${acc.profilePhotoUrl}, followers=${acc.followersCount}`);
        });
        setAccounts(trackedAccounts);
        
        // Если есть аккаунты, выбираем первый или сохраняем текущий выбор
        if (trackedAccounts.length > 0) {
          if (!selectedAccountId || !trackedAccounts.find(a => a.id === selectedAccountId)) {
            setSelectedAccountId(trackedAccounts[0].id);
          }
        } else {
          setSelectedAccountId(null);
        }
      } catch (error) {
        console.error('Ошибка загрузки аккаунтов:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAccounts();
    
    // Перезагружаем при возврате на экран
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchAccounts();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Load reels for selected account
  React.useEffect(() => {
    if (!selectedAccountId) return;
    
    const fetchReels = async () => {
      const userId = getTelegramUserId();
      if (!userId) return;
      
      try {
        const accountReels = await getTrackedReels(selectedAccountId, userId);
        setReels(accountReels);
        
        // Если reels нет - запускаем скрапинг АВТОМАТИЧЕСКИ
        if (accountReels.length === 0) {
          try {
            const result = await scrapeAccountReels(selectedAccountId, userId);
            
            // Показываем результат
            if (result.showPopup && window.Telegram?.WebApp?.showPopup) {
              window.Telegram.WebApp.showPopup({
                message: result.popupMessage || `найдено ${result.reelsAdded} reels`
              });
            }
            
            // Перезагружаем reels
            const updatedReels = await getTrackedReels(selectedAccountId, userId);
            setReels(updatedReels);
          } catch (error: any) {
            console.error('Ошибка скрапинга:', error);
            if (window.Telegram?.WebApp?.showPopup) {
              window.Telegram.WebApp.showPopup({
                message: error.message || 'ошибка загрузки reels'
              });
            }
          }
        }
      } catch (error) {
        console.error('Ошибка загрузки reels:', error);
      }
    };
    
    fetchReels();
  }, [selectedAccountId]);

  // Handle remove account
  const handleRemoveAccount = async () => {
    if (!selectedAccountId) return;
    
    const userId = getTelegramUserId();
    if (!userId) return;
    
    try {
      await untrackAccount(selectedAccountId, userId);
      
      if (window.Telegram?.WebApp?.showPopup) {
        window.Telegram.WebApp.showPopup({
          message: 'аккаунт удален из отслеживаемых'
        });
      }
      
      const updatedAccounts = accounts.filter(a => a.id !== selectedAccountId);
      setAccounts(updatedAccounts);
      setSelectedAccountId(updatedAccounts[0]?.id || null);
      setAccountRemoved(true);
    } catch (error) {
      console.error('Ошибка удаления:', error);
    }
  };

  const sortOptions = [
    { id: 'views_desc', label: '>просмотров' },
    { id: 'views_asc', label: '<просмотров' },
    { id: 'likes_desc', label: '>лайков' },
    { id: 'likes_asc', label: '<лайков' },
    { id: 'comments_desc', label: '>комментариев' },
    { id: 'comments_asc', label: '<комментариев' },
    { id: 'old', label: 'старые' },
    { id: 'new', label: 'новые' },
    { id: 'viral', label: 'виральные' },
  ];

  const handleSortClick = () => {
    if (window.Telegram?.WebApp?.showPopup) {
      window.Telegram.WebApp.showPopup({
        message: 'сортировка\n\n>просмотров\n<просмотров\n>лайков\n<лайков\n>комментариев\n<комментариев\nстарые\nновые\nвиральные'
      });
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

        {/* Title "отслеживание контента" - 174:801 x=85, y=193, w=1020, h=80 */}
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
          textAlign: 'left',
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
          textAlign: 'left',
          lineHeight: '40px',
        }}>
          добавьте аккаунт для отслеживания
        </div>

        {/* Show no-tracked elements when account removed */}
        {accountRemoved && (
          <>
            {/* People image PNG (7:1357) - x=143, y=916, 892x1050 */}
            <img 
              src={peopleImageNoTracked}
              alt=""
              style={{
                position: 'absolute',
                left: '143px',
                top: '916px',
                width: '892px',
                height: '1050px',
                objectFit: 'contain',
                pointerEvents: 'none',
                zIndex: 1,
              }}
            />

            {/* Blur overlay PNG (7:1360) - x=143, y=402, 892x1643 */}
            <img 
              src={blurOverlay}
              alt=""
              onClick={() => navigate('/laba-search-account')}
              style={{
                position: 'absolute',
                left: '143px',
                top: '402px',
                width: '892px',
                height: '1643px',
                objectFit: 'fill',
                borderRadius: '30px',
                cursor: 'pointer',
                zIndex: 2,
              }}
            />
          </>
        )}

        {/* Horizontal scroll with tracked accounts - показываем только если есть аккаунты */}
        {accounts.length > 0 && (
        <div style={{
          position: 'absolute',
          left: '151px',
          top: '405px',
          width: '878px',
          height: '162px',
          overflow: 'hidden',
          maskImage: 'linear-gradient(to right, black 0%, black calc(100% - 40px), transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, black 0%, black calc(100% - 40px), transparent 100%)',
        }}>
          <div style={{
            display: 'flex',
            gap: '1px',
            overflowX: 'auto',
            overflowY: 'hidden',
            height: '100%',
            paddingRight: '40px',
          }}>
            {/* Tracked accounts */}
            {accounts.map((account) => (
              <div 
                key={account.id}
                className="blur-wave" 
                style={{
                  flexShrink: 0,
                  width: '522px',
                  height: '162px',
                  backdropFilter: 'blur(50px)',
                  background: selectedAccountId === account.id 
                    ? 'rgba(255, 255, 255, 0.2)' 
                    : 'rgba(255, 255, 255, 0.1)',
                  border: '4px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '30px',
                  position: 'relative',
                  cursor: 'pointer',
                }}
                onClick={() => setSelectedAccountId(account.id)}
              >
                {/* Profile photo */}
                <div style={{
                  position: 'absolute',
                  left: '24px',
                  top: '16px',
                  width: '98px',
                  height: '98px',
                  borderRadius: '640px',
                  overflow: 'hidden',
                  background: 'rgba(255, 255, 255, 0.1)',
                }}>
                  <img
                    src={convertInstagramImageUrl(account.profilePhotoUrl) || profilePhoto}
                    alt=""
                    crossOrigin="anonymous"
                    onError={(e) => {
                      console.error('[AVATAR] Ошибка загрузки аватарки:', account.profilePhotoUrl);
                      console.error('[AVATAR] Прокси URL:', convertInstagramImageUrl(account.profilePhotoUrl));
                      (e.target as HTMLImageElement).src = profilePhoto;
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
                </div>

                {/* Instagram icon */}
                <div style={{
                  position: 'absolute',
                  left: '129px',
                  top: '13px',
                  width: '49px',
                  height: '59px',
                  opacity: 0.6,
                }}>
                  <img
                    src={instagramIcon}
                    alt=""
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                    }}
                  />
                </div>

                {/* Username */}
                <div style={{
                  position: 'absolute',
                  left: '129px',
                  top: '64px',
                  width: '235px',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 700,
                  fontSize: '27px',
                  color: 'white',
                }}>
                  @{account.username}
                </div>

                {/* Followers */}
                <div style={{
                  position: 'absolute',
                  left: '129px',
                  top: '95px',
                  fontFamily: 'Gotham Pro, sans-serif',
                  fontWeight: 300,
                  fontSize: '24px',
                  color: 'white',
                }}>
                  {account.followersCount?.toLocaleString('ru-RU')} подписчиков
                </div>

                {/* Button "убрать аккаунт" */}
                <img
                  src={removeAccountButtonPNG}
                  alt="убрать"
                  onClick={async (e) => {
                    e.stopPropagation();
                    const userId = getTelegramUserId();
                    if (!userId) return;
                    
                    try {
                      await untrackAccount(account.id, userId);
                      setAccounts(accounts.filter(a => a.id !== account.id));
                      
                      if (selectedAccountId === account.id) {
                        const remaining = accounts.filter(a => a.id !== account.id);
                        setSelectedAccountId(remaining.length > 0 ? remaining[0].id : null);
                      }
                      
                      if (window.Telegram?.WebApp?.showPopup) {
                        window.Telegram.WebApp.showPopup({
                          message: 'аккаунт удален из отслеживаемых'
                        });
                      }
                    } catch (error) {
                      console.error('Ошибка удаления аккаунта:', error);
                    }
                  }}
                  style={{
                    position: 'absolute',
                    left: '184px',
                    top: '10px',
                    width: '126px',
                    height: '54px',
                    cursor: 'pointer',
                    objectFit: 'contain',
                  }}
                />
              </div>
            ))}
            
          </div>
        </div>
        )}

        {/* Кнопка + (плюс) - строго слева */}
        <div 
          onClick={() => navigate('/laba-search-account')}
          className="blur-wave button-inner-glow"
          style={{
            position: 'absolute',
            left: '85px',
            top: '586px',
            width: '79px',
            height: '79px',
            backdropFilter: 'blur(50px)',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '79px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}>
          <img src={plusIcon} alt="+" style={{ width: '57%', height: '57%', objectFit: 'contain' }} />
        </div>

        {/* Кнопка вернуть */}
        <img
          src={returnButtonPNG}
          alt="вернуть"
          onClick={() => {
            setSelectedSort(null);
            setLikedCards(new Set());
          }}
          className="button-inner-glow"
          style={{
            position: 'absolute',
            left: '184px',
            top: '586px',
            width: '270px',
            height: '79px',
            objectFit: 'contain',
            cursor: 'pointer',
          }}
        />

        {/* Кнопка сортировка */}
        <img
          src={selectedSort ? sortButtonActivePNG : sortButtonInactivePNG}
          alt="сортировка"
          onClick={handleSortClick}
          className="button-inner-glow"
          style={{
            position: 'absolute',
            left: '474px',
            top: '586px',
            width: '310px',
            height: '79px',
            objectFit: 'contain',
            cursor: 'pointer',
          }}
        />

        {/* Кнопка выбрать */}
        <div style={{
          position: 'absolute',
          left: '804px',
          top: '586px',
          width: '270px',
          height: '79px',
        }}>
          <img
            src={selectedSort ? likesBadgeActivePNG : likesBadgeInactivePNG}
            alt="badge"
            className="button-inner-glow"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Gotham Pro, sans-serif',
            fontWeight: 500,
            fontSize: '27px',
            color: 'white',
            textAlign: 'center',
          }}>
            {selectedSort ? sortOptions.find(opt => opt.id === selectedSort)?.label || 'выбрать' : 'выбрать'}
          </div>
        </div>

        {/* People image behind frame - hide when account removed */}
        {!accountRemoved && (
          <img
            src={peopleImage}
            alt=""
            style={{
              position: 'absolute',
              left: '143px',
              top: '898px',
              width: '892px',
              height: '1050px',
              objectFit: 'contain',
              zIndex: 0,
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Main content window - hide when account removed */}
        {!accountRemoved && (
          <div className="blur-wave" style={{
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
          {/* Blur placeholder cards - показываем пока идет загрузка */}
          {loading && Array.from({ length: 40 }).map((_, index) => (
            <BlurReelCard key={`blur-${index}`} index={index} />
          ))}
          
          {/* Reels cards - Dynamic rendering */}
          {/* Показываем блюр карточки пока скрапинг идет */}
          {scraping && (
            <>
              <BlurReelCard index={0} />
              <BlurReelCard index={1} />
              <BlurReelCard index={2} />
              <BlurReelCard index={3} />
            </>
          )}
          
          {/* Показываем реальные карточки когда загрузились */}
          {!loading && !scraping && reels.map((reel, index) => (
            <ReelCard
              key={reel.id}
              reel={reel}
              index={index}
              isFavorite={likedCards.has(reel.id)}
              onToggleFavorite={async (reelId) => {
                const userId = getTelegramUserId();
                if (!userId) return;
                
                try {
                  const newFavoriteStatus = await toggleFavorite(reelId, userId);
                  
                  setLikedCards(prev => {
                    const newSet = new Set(prev);
                    if (newFavoriteStatus) {
                      newSet.add(reelId);
                    } else {
                      newSet.delete(reelId);
                    }
                    return newSet;
                  });
                } catch (error) {
                  console.error('Ошибка переключения избранного:', error);
                }
              }}
            />
          ))}
        </div>
        )}

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
