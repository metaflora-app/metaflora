import React from 'react';
import { useNavigate } from 'react-router-dom';

// API and types
import { getFavorites, toggleFavorite, getTelegramUserId } from '../../utils/labaApi';
import { Reel } from '../../types/laba';
import { ReelCard } from '../../components/ReelCard';

// REUSED from prompt-first screen
import smallLogo from '../../assets/figma-welcome/logo-small.png';
import supportButtonPNG from '../../assets/tour-video/support-button.png';
import socialsIconsFooter from '../../assets/welcome-elements/socials-icons.png';
import logoFooter from '../../assets/figma-welcome/logo-footer.png';
import bgPattern from '../../assets/figma-welcome/pattern.png';

// Laba-main PNG assets
import analysisButtonPNG from '../../assets/laba-main/кнопка анализ.png';
import cardImage from '../../assets/laba-main/картинка в карточке промпта.png';
import newBadgePNG from '../../assets/laba-main/плашка новое.png';

// Filter buttons PNG
import buttonReturn from '../../assets/laba-main-buttons/кнопка вернуть.png';
import buttonSort from '../../assets/laba-main-buttons/кнопка сортировка неактив.png';
import buttonSortActive from '../../assets/laba-main-buttons/кнопка сортировка.png';
import buttonDate from '../../assets/laba-main-buttons/кнопка дата неактив.png';
import buttonDateActive from '../../assets/laba-main-buttons/кнопка дата.png';
import buttonLanguage from '../../assets/laba-main-buttons/кнопка язык неактив.png';
import buttonLanguageActive from '../../assets/laba-main-buttons/кнопка язык.png';
import buttonVirality from '../../assets/laba-main-buttons/кнопка виральность неактив.png';
import buttonViralityActive from '../../assets/laba-main-buttons/кнопка виральность.png';
import buttonAccount from '../../assets/laba-main-buttons/кнопка аккаунт неактив.png';
import buttonAccountActive from '../../assets/laba-main-buttons/кнопка аккаунт.png';
import buttonFormat from '../../assets/laba-main-buttons/кнопка формат.png';
import badgeLikes from '../../assets/laba-main-buttons/плашка лайки неактив.png';
import badgeLikesActive from '../../assets/laba-main-buttons/плашка лайки.png';
import badgeTimeslot from '../../assets/laba-main-buttons/плашка таймслот неактив.png';
import badgeTimeslotActive from '../../assets/laba-main-buttons/плашка таймслот.png';
import badgeRussian from '../../assets/laba-main-buttons/плашка русский неактив.png';
import badgeRussianActive from '../../assets/laba-main-buttons/плашка русский.png';
import badgeScores from '../../assets/laba-main-buttons/плашка баллы неактив.png';
import badgeScoresActive from '../../assets/laba-main-buttons/плашка баллы.png';
import badgeAccount from '../../assets/laba-main-buttons/плашка аккаунт неактив.png';
import badgeAccountActive from '../../assets/laba-main-buttons/плашка аккаунт.png';
import badgeReels from '../../assets/laba-main-buttons/плашка рилс.png';
import badgeStartSearch from '../../assets/laba-main-buttons/плашка начать поиск.png';
import peopleBackground from '../../assets/laba-no-tracked/люди друг на друге.png';

// REUSED: heart icon from prompt-first
// REUSED: footer and header components from prompt-first

// Laba icons
import searchIcon from '../../assets/laba-icons/иконка поиска.png';
import playIcon from '../../assets/tour-video/play-icon.png';
import viewsIcon from '../../assets/laba-icons/иконка просмотры.png';
import likesIcon from '../../assets/laba-icons/иконка лайки.png';
import commentsIcon from '../../assets/laba-icons/иконка комментарии.png';
import instaLogo from '../../assets/laba-icons/лого инста.png';

export const LabaFavoritesScreen: React.FC = () => {
  const navigate = useNavigate();
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;
  
  // Favorites data
  const [reels, setReels] = React.useState<Reel[]>([]);
  const [loading, setLoading] = React.useState(true);
  
  // UI state
  const [selectedSort, setSelectedSort] = React.useState<string | null>(null);
  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = React.useState<string | null>(null);
  const [selectedVirality, setSelectedVirality] = React.useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = React.useState<string | null>(null);
  const [likedCards, setLikedCards] = React.useState<Set<number>>(new Set());
  const [searchValue, setSearchValue] = React.useState('');
  const [isSearchFocused, setIsSearchFocused] = React.useState(false);
  
  // Load favorites on mount
  React.useEffect(() => {
    const fetchFavorites = async () => {
      const userId = getTelegramUserId();
      if (!userId) return;
      
      try {
        setLoading(true);
        const favoriteReels = await getFavorites(userId);
        setReels(favoriteReels);
        
        // Если нет избранных - показываем popup
        if (favoriteReels.length === 0) {
          if ((window as any).Telegram?.WebApp?.showPopup) {
            (window as any).Telegram.WebApp.showPopup({
              message: 'reels не добавлены в избранное'
            });
          }
        }
        
        // Pre-populate liked cards (static cards use numbers 1-4)
        setLikedCards(new Set([1, 2, 3, 4]));
      } catch (error) {
        console.error('Ошибка загрузки избранного:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFavorites();
  }, []);

  const handleSortClick = () => {
    if (window.Telegram?.WebApp?.showPopup) {
      window.Telegram.WebApp.showPopup({
        message: 'сортировка\n\n>просмотров\n<просмотров\n>лайков\n<лайков\n>комментариев\n<комментариев'
      });
      setSelectedSort('selected');
    }
  };

  const handleFilterClick = (filterType: string) => {
    if (window.Telegram?.WebApp?.showPopup) {
      let message = '';
      
      switch(filterType) {
        case 'date':
          message = 'дата публикации\n\nпоследние 7 дней\nпоследние 14 дней\nпоследние 30 дней\nпоследние 6 месяцев\nпоследний год';
          setSelectedDate('selected');
          break;
        case 'language':
          message = 'язык\n\nрусский\nанглийский\nиспанский\nтурецкий\nфранцузский';
          setSelectedLanguage('selected');
          break;
        case 'virality':
          message = 'виральность\n\n0-2 балла\n3-5 баллов\n6-8 баллов\n9-10 баллов';
          setSelectedVirality('selected');
          break;
        case 'account':
          message = 'размер аккаунта\n\n0-10к\n10к-100к\n100к-300к\n300к-1млн\nбольше 1млн';
          setSelectedAccount('selected');
          break;
      }
      
      window.Telegram.WebApp.showPopup({ message });
    }
  };

  const handleReturnClick = () => {
    setSelectedSort(null);
    setSelectedDate(null);
    setSelectedLanguage(null);
    setSelectedVirality(null);
    setSelectedAccount(null);
    setLikedCards(new Set());
  };

  // Handle favorite toggle - УДАЛЕНИЕ ИЗ ИЗБРАННОГО (оптимистичное обновление)
  const handleToggleFavorite = async (reelId: string) => {
    const userId = getTelegramUserId();
    if (!userId) return;
    
    // СРАЗУ удаляем из UI (оптимистичное обновление)
    const removedReel = reels.find(r => r.id === reelId);
    setReels(prev => prev.filter(r => r.id !== reelId));
    
    // Затем отправляем запрос на сервер
    try {
      await toggleFavorite(reelId, userId);
    } catch (error) {
      console.error('Ошибка удаления из избранного:', error);
      // Откатываем изменения при ошибке (возвращаем reel обратно)
      if (removedReel) {
        setReels(prev => [...prev, removedReel]);
      }
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
        {/* Header - Logo - REUSED */}
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

        {/* Filter buttons - Row 1 - EXACT Figma coordinates */}
        <img 
          src={buttonReturn} 
          alt="вернуть" 
          onClick={handleReturnClick}
          style={{ position: 'absolute', left: '99px', top: '327px', width: '247px', height: '79px', cursor: 'pointer' }} 
        />
        <img 
          src={selectedSort ? buttonSortActive : buttonSort} 
          alt="сортировка" 
          onClick={handleSortClick}
          className="button-inner-glow"
          style={{ position: 'absolute', left: '346px', top: '327px', width: '247px', height: '79px', cursor: 'pointer' }} 
        />
        <img 
          src={selectedDate ? buttonDateActive : buttonDate} 
          alt="дата" 
          onClick={() => handleFilterClick('date')}
          className="button-inner-glow"
          style={{ position: 'absolute', left: '593px', top: '327px', width: '247px', height: '79px', cursor: 'pointer' }} 
        />
        <img 
          src={selectedLanguage ? buttonLanguageActive : buttonLanguage} 
          alt="язык" 
          onClick={() => handleFilterClick('language')}
          className="button-inner-glow"
          style={{ position: 'absolute', left: '840px', top: '327px', width: '247px', height: '79px', cursor: 'pointer' }} 
        />

        {/* Filter buttons - Row 2 - EXACT Figma coordinates */}
        <img 
          src={selectedVirality ? buttonViralityActive : buttonVirality}
          alt="виральность"
          onClick={() => handleFilterClick('virality')}
          className="button-inner-glow"
          style={{
            position: 'absolute',
            left: '220px',
            top: '485px',
            width: '247px',
            height: '79px',
            cursor: 'pointer',
          }}
        />

        <img 
          src={selectedAccount ? buttonAccountActive : buttonAccount}
          alt="аккаунт"
          onClick={() => handleFilterClick('account')}
          className="button-inner-glow"
          style={{
            position: 'absolute',
            left: '464px',
            top: '485px',
            width: '247px',
            height: '79px',
            cursor: 'pointer',
          }}
        />

        <img 
          src={buttonFormat}
          alt="формат"
          className="button-inner-glow"
          style={{
            position: 'absolute',
            left: '711px',
            top: '485px',
            width: '247px',
            height: '79px',
          }}
        />

        {/* Filter badges - Row 2 - EXACT Figma coordinates */}
        <img 
          src={selectedSort ? badgeLikesActive : badgeLikes}
          alt=">лайков"
          style={{
            position: 'absolute',
            left: '407px',
            top: '406px',
            width: '186px',
            height: '79px',
          }}
        />

        <img 
          src={selectedDate ? badgeTimeslotActive : badgeTimeslot}
          alt="14 дней"
          style={{
            position: 'absolute',
            left: '654px',
            top: '406px',
            width: '186px',
            height: '79px',
          }}
        />

        <img 
          src={selectedLanguage ? badgeRussianActive : badgeRussian}
          alt="русский"
          style={{
            position: 'absolute',
            left: '901px',
            top: '406px',
            width: '186px',
            height: '79px',
          }}
        />

        {/* Filter badges - Row 3 - активные плашки с Desktop */}
        <img 
          src={selectedVirality ? badgeScoresActive : badgeScores}
          alt="9-10 баллов"
          style={{
            position: 'absolute',
            left: '278px',
            top: '564px',
            width: '186px',
            height: '79px',
          }}
        />

        <img 
          src={selectedAccount ? badgeAccountActive : badgeAccount}
          alt="0-10к"
          style={{
            position: 'absolute',
            left: '516px',
            top: '564px',
            width: '186px',
            height: '79px',
          }}
        />

        <img 
          src={badgeReels}
          alt="IG reels"
          style={{
            position: 'absolute',
            left: '754px',
            top: '564px',
            width: '186px',
            height: '79px',
          }}
        />

        {/* Люди друг на друге - ПОД фреймом */}
        <img 
          src={peopleBackground}
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

        {/* Main content window - с СКРОЛЛОМ */}
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
          {/* Reels cards - Dynamic rendering (БЕЗ текста "нет избранных") */}
          {reels.map((reel, index) => (
            <ReelCard
              key={reel.id}
              reel={reel}
              index={index}
              isFavorite={true}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
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