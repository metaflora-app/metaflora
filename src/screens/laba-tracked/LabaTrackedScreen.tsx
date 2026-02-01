import React from 'react';
import { useNavigate } from 'react-router-dom';

// API and types
import { 
  getTrackedAccounts, 
  getTrackedReels, 
  untrackAccount,
  getTelegramUserId,
  toggleFavorite 
} from '../../utils/labaApi';
import { TrackedAccount, Reel } from '../../types/laba';
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

  // Load tracked accounts
  React.useEffect(() => {
    const fetchAccounts = async () => {
      const userId = getTelegramUserId();
      if (!userId) return;
      
      try {
        setLoading(true);
        const trackedAccounts = await getTrackedAccounts(userId);
        setAccounts(trackedAccounts);
        
        if (trackedAccounts.length > 0) {
          setSelectedAccountId(trackedAccounts[0].id);
        }
      } catch (error) {
        console.error('Ошибка загрузки аккаунтов:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAccounts();
  }, []);

  // Load reels for selected account
  React.useEffect(() => {
    if (!selectedAccountId) return;
    
    const fetchReels = async () => {
      const userId = getTelegramUserId();
      if (!userId) return;
      
      try {
        const accountReels = await getTrackedReels(selectedAccountId, userId);
        // No limit - render all cards with optimized performance
        setReels(accountReels);
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

        {/* Horizontal scroll with tracked accounts */}
        <div style={{
          position: 'absolute',
          left: '151px',
          top: '405px',
          width: '878px',
          height: '162px',
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex',
            gap: '20px',
            overflowX: 'auto',
            overflowY: 'hidden',
            height: '100%',
            paddingRight: '20px',
          }}>
            {/* Tracked accounts */}
            {accounts.map((account, idx) => (
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
                  top: '24px',
                  width: '98px',
                  height: '98px',
                  borderRadius: '640px',
                  overflow: 'hidden',
                }}>
                  <img
                    src={account.profilePhotoUrl || profilePhoto}
                    alt=""
                    crossOrigin="anonymous"
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
                  top: '21px',
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
                  top: '72px',
                  width: '235px',
                  height: '42px',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 700,
                  fontSize: '27px',
                  color: 'white',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  @{account.username}
                </div>

                {/* Followers */}
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
                  alignItems: 'center',
                }}>
                  {(account.followersCount / 1000).toFixed(1)}к подписчиков
                </div>

                {/* Button "удалить" */}
                <img
                  src={removeAccountButtonPNG}
                  alt="удалить"
                  onClick={async (e) => {
                    e.stopPropagation();
                    const userId = getTelegramUserId();
                    if (!userId) return;
                    
                    await untrackAccount(account.id, userId);
                    setAccounts(accounts.filter(a => a.id !== account.id));
                    
                    if (window.Telegram?.WebApp?.showPopup) {
                      window.Telegram.WebApp.showPopup({
                        message: 'аккаунт удален из отслеживаемых'
                      });
                    }
                  }}
                  style={{
                    position: 'absolute',
                    left: '184px',
                    top: '18px',
                    width: '126px',
                    height: '54px',
                    cursor: 'pointer',
                    objectFit: 'contain',
                    zIndex: 100,
                  }}
                />
              </div>
            ))}
            
            {/* Plus button - всегда справа от последнего аккаунта */}
            <div 
              onClick={() => navigate('/laba-search-account')}
              className="blur-wave"
              style={{
                flexShrink: 0,
                width: '162px',
                height: '162px',
                backdropFilter: 'blur(50px)',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '30px',
                overflow: 'clip',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}>
              <img 
                src={plusIcon} 
                alt="добавить" 
                style={{ 
                  width: '60px', 
                  height: '60px',
                  objectFit: 'contain',
                }} 
              />
            </div>
          </div>
        </div>

        {/* OLD CODE - удалить после проверки */}
        {false && (
          <div 
            onClick={() => navigate('/laba-search-account')}
            className="blur-wave"
            style={{
              position: 'absolute',
              left: '175px',
              top: '429px',
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
        )}

        {/* Filter buttons - вернуть - 174:774 PNG: 247x80 */}
        {!accountRemoved && (
          <img
            src={returnButtonPNG}
            alt="вернуть"
            onClick={() => {
              setSelectedSort(null);
              setLikedCards(new Set());
            }}
            style={{
              position: 'absolute',
              left: '788px',
              top: '406px',
              width: '246.93px',
              height: '79.25px',
              objectFit: 'contain',
              cursor: 'pointer',
            }}
          />
        )}

        {/* Filter buttons - сортировка - 174:780 PNG: 247x80 */}
        {!accountRemoved && (
          <img
            src={selectedSort ? sortButtonActivePNG : sortButtonInactivePNG}
            alt="сортировка"
            onClick={handleSortClick}
            style={{
              position: 'absolute',
              left: '788px',
              top: '485px',
              width: '246.93px',
              height: '79.25px',
              objectFit: 'contain',
              cursor: 'pointer',
            }}
          />
        )}

        {/* Badge likes - 174:768 PNG with dynamic text */}
        {!accountRemoved && (
          <div style={{
            position: 'absolute',
            left: '788px',
            top: '564px',
            width: '186px',
            height: '79px',
          }}>
            <img
              src={selectedSort ? likesBadgeActivePNG : likesBadgeInactivePNG}
              alt="badge"
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
        )}

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
          {!loading && reels.map((reel, index) => (
            <ReelCard
              key={reel.id}
              reel={reel}
              index={index}
              isFavorite={likedCards.has(reel.id)}
              onToggleFavorite={(reelId) => {
                const newLiked = new Set(likedCards);
                if (newLiked.has(reelId)) {
                  newLiked.delete(reelId);
                } else {
                  newLiked.add(reelId);
                }
                setLikedCards(newLiked);
                const userId = getTelegramUserId();
                if (userId) {
                  toggleFavorite(reelId, userId);
                }
              }}
            />
          ))}
          
          {/* СТАРЫЕ ХАРДКОД КАРТОЧКИ - УДАЛИТЬ */}
          {false && (
          <div>
          {/* Карточка 1 - Верхняя левая */}
          <div style={{
            position: 'absolute',
            left: '22px',
            top: '23px',
            width: '410px',
            height: '782px',
          }}>
            <div className="blur-wave" style={{
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

            {/* Badge "новое" - 432:929 - x=269, y=44 relative to card */}
            <img
              src={newBadgePNG}
              alt="новое"
              className="button-inner-glow"
              style={{
                position: 'absolute',
                left: '269px',
                top: '44px',
                width: '101px',
                height: '36px',
                objectFit: 'contain',
              }}
            />

            {/* Like icon - 173:652 - x=42, y=44 relative to card */}
            <div 
              onClick={() => {
                setLikedCards(prev => {
                  const newSet = new Set(prev);
                  if (newSet.has(1)) {
                    newSet.delete(1);
                  } else {
                    newSet.add(1);
                  }
                  return newSet;
                });
              }}
              style={{
                position: 'absolute',
                left: '42px',
                top: '44px',
                width: '36px',
                height: '36px',
                cursor: 'pointer',
              }}
            >
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <path d="M18 30L6 18C3 15 3 9 6 6C9 3 15 3 18 6C21 3 27 3 30 6C33 9 33 15 30 18L18 30Z" 
                  stroke={likedCards.has(1) ? '#FF0000' : 'white'} 
                  strokeWidth="2" 
                  fill={likedCards.has(1) ? '#FF0000' : 'none'} />
              </svg>
            </div>

            {/* Play кнопка */}
            <div className="blur-wave" style={{
              position: 'absolute',
              left: 'calc(50% - 49px)',
              top: '178px',
              width: '98px',
              height: '98px',
              backdropFilter: 'blur(50px)',
              background: 'rgba(0, 0, 0, 0.1)',
              border: '4px solid rgba(255, 255, 0.3)',
              borderRadius: '62px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
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

            <div className="blur-wave" style={{
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

            {/* Instagram лого PNG */}
            <img 
              src={instaLogoIcon}
              alt=""
              style={{
                position: 'absolute',
                left: '30px',
                top: '448px',
                width: '64px',
                height: '78px',
                opacity: 0.6,
                objectFit: 'contain',
              }}
            />

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
              className="button-inner-glow"
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

            <div className="blur-wave button-inner-glow" style={{
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
            <div className="blur-wave" style={{
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

            {/* Like icon - 173:680 - x=42, y=44 relative to card */}
            <div 
              onClick={() => {
                setLikedCards(prev => {
                  const newSet = new Set(prev);
                  if (newSet.has(2)) {
                    newSet.delete(2);
                  } else {
                    newSet.add(2);
                  }
                  return newSet;
                });
              }}
              style={{
                position: 'absolute',
                left: '42px',
                top: '44px',
                width: '36px',
                height: '36px',
                cursor: 'pointer',
              }}
            >
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <path d="M18 30L6 18C3 15 3 9 6 6C9 3 15 3 18 6C21 3 27 3 30 6C33 9 33 15 30 18L18 30Z" 
                  stroke={likedCards.has(2) ? '#FF0000' : 'white'} 
                  strokeWidth="2" 
                  fill={likedCards.has(2) ? '#FF0000' : 'none'} />
              </svg>
            </div>

            {/* Play кнопка */}
            <div className="blur-wave" style={{
              position: 'absolute',
              left: 'calc(50% - 49px)',
              top: '178px',
              width: '98px',
              height: '98px',
              backdropFilter: 'blur(50px)',
              background: 'rgba(0, 0, 0, 0.1)',
              border: '4px solid rgba(255, 255, 0.3)',
              borderRadius: '62px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
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

            <div className="blur-wave" style={{
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

            {/* Instagram лого PNG */}
            <img 
              src={instaLogoIcon}
              alt=""
              style={{
                position: 'absolute',
                left: '30px',
                top: '448px',
                width: '64px',
                height: '78px',
                opacity: 0.6,
                objectFit: 'contain',
              }}
            />

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
              className="button-inner-glow"
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

            <div className="blur-wave button-inner-glow" style={{
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
            <div className="blur-wave" style={{
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

            {/* Like icon - 173:708 - x=42, y=44 relative to card */}
            <div 
              onClick={() => {
                setLikedCards(prev => {
                  const newSet = new Set(prev);
                  if (newSet.has(3)) {
                    newSet.delete(3);
                  } else {
                    newSet.add(3);
                  }
                  return newSet;
                });
              }}
              style={{
                position: 'absolute',
                left: '42px',
                top: '44px',
                width: '36px',
                height: '36px',
                cursor: 'pointer',
              }}
            >
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <path d="M18 30L6 18C3 15 3 9 6 6C9 3 15 3 18 6C21 3 27 3 30 6C33 9 33 15 30 18L18 30Z" 
                  stroke={likedCards.has(3) ? '#FF0000' : 'white'} 
                  strokeWidth="2" 
                  fill={likedCards.has(3) ? '#FF0000' : 'none'} />
              </svg>
            </div>

            {/* Play кнопка */}
            <div className="blur-wave" style={{
              position: 'absolute',
              left: 'calc(50% - 49px)',
              top: '178px',
              width: '98px',
              height: '98px',
              backdropFilter: 'blur(50px)',
              background: 'rgba(0, 0, 0, 0.1)',
              border: '4px solid rgba(255, 255, 0.3)',
              borderRadius: '62px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
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

            <div className="blur-wave" style={{
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

            {/* Instagram лого PNG */}
            <img 
              src={instaLogoIcon}
              alt=""
              style={{
                position: 'absolute',
                left: '30px',
                top: '448px',
                width: '64px',
                height: '78px',
                opacity: 0.6,
                objectFit: 'contain',
              }}
            />

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
              className="button-inner-glow"
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

            <div className="blur-wave button-inner-glow" style={{
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
            <div className="blur-wave" style={{
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

            {/* Like icon - 173:736 - x=42, y=44 relative to card */}
            <div 
              onClick={() => {
                setLikedCards(prev => {
                  const newSet = new Set(prev);
                  if (newSet.has(4)) {
                    newSet.delete(4);
                  } else {
                    newSet.add(4);
                  }
                  return newSet;
                });
              }}
              style={{
                position: 'absolute',
                left: '42px',
                top: '44px',
                width: '36px',
                height: '36px',
                cursor: 'pointer',
              }}
            >
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <path d="M18 30L6 18C3 15 3 9 6 6C9 3 15 3 18 6C21 3 27 3 30 6C33 9 33 15 30 18L18 30Z" 
                  stroke={likedCards.has(4) ? '#FF0000' : 'white'} 
                  strokeWidth="2" 
                  fill={likedCards.has(4) ? '#FF0000' : 'none'} />
              </svg>
            </div>

            {/* Play кнопка */}
            <div className="blur-wave" style={{
              position: 'absolute',
              left: 'calc(50% - 49px)',
              top: '178px',
              width: '98px',
              height: '98px',
              backdropFilter: 'blur(50px)',
              background: 'rgba(0, 0, 0, 0.1)',
              border: '4px solid rgba(255, 255, 0.3)',
              borderRadius: '62px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
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

            <div className="blur-wave" style={{
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

            {/* Instagram лого PNG */}
            <img 
              src={instaLogoIcon}
              alt=""
              style={{
                position: 'absolute',
                left: '30px',
                top: '448px',
                width: '64px',
                height: '78px',
                opacity: 0.6,
                objectFit: 'contain',
              }}
            />

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
              className="button-inner-glow"
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

            <div className="blur-wave button-inner-glow" style={{
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
          )}
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
