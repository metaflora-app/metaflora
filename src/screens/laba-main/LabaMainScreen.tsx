import React from 'react';
import { useNavigate } from 'react-router-dom';

// API and types
import { 
  getTopReels, 
  searchReels, 
  toggleFavorite, 
  formatCount, 
  formatTimeAgo, 
  getTelegramUserId,
  showMessage 
} from '../../utils/labaApi';
import { Reel } from '../../types/laba';
import { ReelCard } from '../../components/ReelCard';
import { BlurReelCard } from '../../components/BlurReelCard';
import { useUIState } from '../../contexts/UIStateContext';

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
import buttonAccount from '../../assets/laba-main-buttons/кнопка аккаунт неактив.png';
import buttonAccountActive from '../../assets/laba-main-buttons/кнопка аккаунт.png';
import buttonFormat from '../../assets/laba-main-buttons/кнопка формат.png';
import badgeLikes from '../../assets/laba-main-buttons/плашка лайки неактив.png';
import badgeTimeslot from '../../assets/laba-main-buttons/плашка таймслот неактив.png';
import badgeRussian from '../../assets/laba-main-buttons/плашка русский неактив.png';
import badgeScores from '../../assets/laba-main-buttons/плашка баллы неактив.png';
import badgeAccount from '../../assets/laba-main-buttons/плашка аккаунт неактив.png';
import badgeEmptyActive from '../../assets/laba-main-buttons/плашка пустая активная.png';
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

export const LabaMainScreen: React.FC = () => {
  const navigate = useNavigate();
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;
  const { labaReelsCache, setLabaReelsCache } = useUIState();
  
  // Reels data - восстанавливаем из кэша при возврате
  const [reels, setReels] = React.useState<Reel[]>(labaReelsCache);
  const [loading, setLoading] = React.useState(labaReelsCache.length === 0);
  const [searchLoading, setSearchLoading] = React.useState(false);
  const [showBlurCards, setShowBlurCards] = React.useState(false);
  const [loadedReelsCount, setLoadedReelsCount] = React.useState(0);
  
  // UI state
  const [selectedSort, setSelectedSort] = React.useState<string | null>(null);
  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = React.useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = React.useState<string | null>(null);
  const [likedCards, setLikedCards] = React.useState<Set<string>>(new Set());
  const [searchValue, setSearchValue] = React.useState('');
  const [isSearchFocused, setIsSearchFocused] = React.useState(false);

  // Load top reels on mount (ВСЕГДА загружаем свежие данные)
  React.useEffect(() => {
    const fetchTopReels = async () => {
      try {
        setLoading(true);
        
        // КРИТИЧНО: Загружаем ВСЕ 4 категории и объединяем
        const [neuro, marketing, content, promotion] = await Promise.all([
          getTopReels('нейросети'),
          getTopReels('маркетинг'),
          getTopReels('контент'),
          getTopReels('продвижение'),
        ]);
        
        // Объединяем ВСЕ reels из всех категорий (не ограничиваем)
        const allReels = [...neuro, ...marketing, ...content, ...promotion];
        
        setReels(allReels);
        setLabaReelsCache(allReels);
      } catch (error) {
        console.error('Ошибка загрузки топ reels:', error);
        showMessage('ошибка загрузки топ reels', 'alert');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTopReels();
  }, [setLabaReelsCache]);
  
  // Сохраняем reels в кэш при изменении
  React.useEffect(() => {
    if (reels.length > 0) {
      setLabaReelsCache(reels);
    }
  }, [reels, setLabaReelsCache]);

  // Фильтрация и сортировка reels при изменении фильтров
  React.useEffect(() => {
    const applyFilters = async () => {
      // Если нет активных фильтров - показываем все reels из кэша
      if (!selectedSort && !selectedDate && !selectedLanguage && !selectedAccount) {
        return;
      }

      try {
        setLoading(true);
        
        // Загружаем ВСЕ reels
        const [neuro, marketing, content, promotion] = await Promise.all([
          getTopReels('нейросети'),
          getTopReels('маркетинг'),
          getTopReels('контент'),
          getTopReels('продвижение'),
        ]);
        
        let filteredReels = [...neuro, ...marketing, ...content, ...promotion];
        
        // Фильтр по дате
        if (selectedDate) {
          const now = new Date();
          let daysAgo = 7;
          
          if (selectedDate === '14 дней') daysAgo = 14;
          else if (selectedDate === '30 дней') daysAgo = 30;
          else if (selectedDate === '6 месяцев') daysAgo = 180;
          else if (selectedDate === '1 год') daysAgo = 365;
          
          const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
          filteredReels = filteredReels.filter(reel => new Date(reel.publishedAt) >= cutoffDate);
        }
        
        // Фильтр по размеру аккаунта
        if (selectedAccount) {
          filteredReels = filteredReels.filter(reel => {
            const followers = reel.accountFollowers;
            if (selectedAccount === '0-10к') return followers < 10000;
            if (selectedAccount === '10к-100к') return followers >= 10000 && followers < 100000;
            if (selectedAccount === '100к-300к') return followers >= 100000 && followers < 300000;
            if (selectedAccount === '300к-1млн') return followers >= 300000 && followers < 1000000;
            if (selectedAccount === '>1млн') return followers >= 1000000;
            return true;
          });
        }
        
        // Фильтр по языку (определяем по описанию)
        if (selectedLanguage) {
          filteredReels = filteredReels.filter(reel => {
            const detectedLang = detectLanguage(reel.caption);
            return detectedLang === selectedLanguage;
          });
        }
        
        // Сортировка
        if (selectedSort) {
          filteredReels.sort((a, b) => {
            if (selectedSort === '>просмотров') return b.viewsCount - a.viewsCount;
            if (selectedSort === '<просмотров') return a.viewsCount - b.viewsCount;
            if (selectedSort === '>лайков') return b.likesCount - a.likesCount;
            if (selectedSort === '<лайков') return a.likesCount - b.likesCount;
            if (selectedSort === '>комментов') return b.commentsCount - a.commentsCount;
            if (selectedSort === '<комментов') return a.commentsCount - b.commentsCount;
            return 0;
          });
        }
        
        setReels(filteredReels);
      } catch (error) {
        console.error('Ошибка фильтрации:', error);
      } finally {
        setLoading(false);
      }
    };
    
    applyFilters();
  }, [selectedSort, selectedDate, selectedLanguage, selectedAccount]);

  // Handle search - с popup перед запуском
  const handleSearch = async () => {
    if (!searchValue.trim()) {
      if ((window as any).Telegram?.WebApp?.showPopup) {
        (window as any).Telegram.WebApp.showPopup({
          message: 'введите ключевое слово для поиска'
        });
      }
      return;
    }
    
    const userId = getTelegramUserId();
    if (!userId) {
      if ((window as any).Telegram?.WebApp?.showPopup) {
        (window as any).Telegram.WebApp.showPopup({
          message: 'ошибка получения telegram user id'
        });
      }
      return;
    }
    
    // Сохраняем значение (НЕ очищаем поле!)
    const keyword = searchValue.trim();
    
    // УБИРАЕМ КЛАВИАТУРУ
    const inputElement = document.querySelector('input[type="text"]') as HTMLInputElement;
    if (inputElement) {
      inputElement.blur();
    }
    
    // Показываем popup ПЕРЕД запуском поиска
    if ((window as any).Telegram?.WebApp?.showPopup) {
      (window as any).Telegram.WebApp.showPopup({
        message: 'начинаем поиск reels...\n\nэто займет 30-40 секунд\nнажмите ок и дождитесь загрузки',
        buttons: [
          {
            id: 'start_search',
            type: 'default',
            text: 'ок'
          }
        ]
      }, async (buttonId: string) => {
        // Функция запускается ТОЛЬКО после нажатия ОК
        if (buttonId === 'start_search') {
          // СРАЗУ показываем 40 блюр-карточек
          setShowBlurCards(true);
          setLoadedReelsCount(0);
          setReels([]);
          
          try {
            setSearchLoading(true);
            const foundReels = await searchReels(keyword, userId);
            
            // Показываем результат
            if ((window as any).Telegram?.WebApp?.showPopup) {
              if (foundReels.length === 0) {
                setShowBlurCards(false);
                (window as any).Telegram.WebApp.showPopup({
                  message: 'ничего не найдено\n\nпопробуйте другое ключевое слово'
                }, () => {
                  setSearchValue('');
                });
              } else {
                // Прогрессивная загрузка по 20% (8 reels за раз из 40)
                const chunkSize = Math.ceil(foundReels.length * 0.2);
                let currentIndex = 0;
                
                const loadNextChunk = () => {
                  if (currentIndex < foundReels.length) {
                    const nextChunk = foundReels.slice(currentIndex, currentIndex + chunkSize);
                    setReels(prev => [...prev, ...nextChunk]);
                    setLoadedReelsCount(prev => prev + nextChunk.length);
                    currentIndex += chunkSize;
                    
                    // Загружаем следующий чунк через 300ms
                    setTimeout(loadNextChunk, 300);
                  } else {
                    // Все загружено - убираем лишние блюр-карточки
                    setShowBlurCards(false);
                  }
                };
                
                // Запускаем загрузку
                loadNextChunk();
                
                (window as any).Telegram.WebApp.showPopup({
                  message: 'reels успешно найдены'
                }, () => {
                  setSearchValue('');
                });
              }
            }
          } catch (error: any) {
            console.error('Ошибка поиска:', error);
            setShowBlurCards(false);
            if ((window as any).Telegram?.WebApp?.showPopup) {
              (window as any).Telegram.WebApp.showPopup({
                message: error.message || 'ошибка поиска\n\nпопробуйте позже'
              }, () => {
                setSearchValue('');
              });
            }
          } finally {
            setSearchLoading(false);
          }
        }
      });
    }
  };

  // Handle favorite toggle - ОПТИМИСТИЧНОЕ ОБНОВЛЕНИЕ (UI меняется сразу)
  const handleToggleFavorite = async (reelId: string) => {
    const userId = getTelegramUserId();
    if (!userId) return;
    
    // СРАЗУ меняем UI (оптимистичное обновление)
    const wasLiked = likedCards.has(reelId);
    setLikedCards(prev => {
      const newSet = new Set(prev);
      if (wasLiked) {
        newSet.delete(reelId);
      } else {
        newSet.add(reelId);
      }
      return newSet;
    });
    
    // Затем отправляем запрос на сервер
    try {
      await toggleFavorite(reelId, userId);
    } catch (error) {
      console.error('Ошибка избранного:', error);
      // Откатываем изменения при ошибке
      setLikedCards(prev => {
        const newSet = new Set(prev);
        if (wasLiked) {
          newSet.add(reelId);
        } else {
          newSet.delete(reelId);
        }
        return newSet;
      });
    }
  };

  // Массивы значений для каждого фильтра
  const sortOptions = ['>просмотров', '<просмотров', '>лайков', '<лайков', '>комментов', '<комментов'];
  const dateOptions = ['7 дней', '14 дней', '30 дней', '6 месяцев', '1 год'];
  const languageOptions = ['русский', 'английский', 'испанский', 'турецкий'];
  const accountOptions = ['0-10к', '10к-100к', '100к-300к', '300к-1млн', '>1млн'];

  // Функция определения языка по тексту описания
  const detectLanguage = (text: string | null): string => {
    if (!text) return 'unknown';
    
    const lowerText = text.toLowerCase();
    
    // Русский: кириллица
    const cyrillicPattern = /[а-яё]/i;
    if (cyrillicPattern.test(text)) return 'русский';
    
    // Турецкий: специфичные буквы (ğ, ı, ş, ç, ö, ü)
    const turkishPattern = /[ğışçöü]/i;
    if (turkishPattern.test(text)) return 'турецкий';
    
    // Испанский: специфичные слова и буквы (ñ, á, é, í, ó, ú, ü, ¿, ¡)
    const spanishPattern = /[ñáéíóúü¿¡]|(\b(el|la|los|las|un|una|de|del|que|es|en|por|para|con|como)\b)/i;
    if (spanishPattern.test(lowerText)) return 'испанский';
    
    // Английский: латиница без специфичных букв других языков
    const latinPattern = /[a-z]/i;
    if (latinPattern.test(text)) return 'английский';
    
    return 'unknown';
  };

  // Обработчик кнопки сортировка - показывает popup и устанавливает первое значение
  const handleSortClick = () => {
    if (selectedSort) {
      // Если уже активна - сбрасываем
      setSelectedSort(null);
    } else {
      // Активируем с первым значением
      if (window.Telegram?.WebApp?.showPopup) {
        window.Telegram.WebApp.showPopup({
          message: 'сортировка\n\n>просмотров\n<просмотров\n>лайков\n<лайков\n>комментов\n<комментов'
        });
      }
      setSelectedSort(sortOptions[0]);
    }
  };

  // Обработчик клика по плашке сортировки - циклическое переключение
  const handleSortBadgeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedSort) return;
    const currentIndex = sortOptions.indexOf(selectedSort);
    const nextIndex = (currentIndex + 1) % sortOptions.length;
    setSelectedSort(sortOptions[nextIndex]);
  };

  // Обработчик кнопки дата
  const handleDateClick = () => {
    if (selectedDate) {
      setSelectedDate(null);
    } else {
      if (window.Telegram?.WebApp?.showPopup) {
        window.Telegram.WebApp.showPopup({
          message: 'дата публикации\n\nпоследние 7 дней\nпоследние 14 дней\nпоследние 30 дней\nпоследние 6 месяцев\nпоследний год'
        });
      }
      setSelectedDate(dateOptions[0]);
    }
  };

  const handleDateBadgeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedDate) return;
    const currentIndex = dateOptions.indexOf(selectedDate);
    const nextIndex = (currentIndex + 1) % dateOptions.length;
    setSelectedDate(dateOptions[nextIndex]);
  };

  // Обработчик кнопки язык
  const handleLanguageClick = () => {
    if (selectedLanguage) {
      setSelectedLanguage(null);
    } else {
      if (window.Telegram?.WebApp?.showPopup) {
        window.Telegram.WebApp.showPopup({
          message: 'язык\n\nрусский\nанглийский\nиспанский\nтурецкий'
        });
      }
      setSelectedLanguage(languageOptions[0]);
    }
  };

  const handleLanguageBadgeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedLanguage) return;
    const currentIndex = languageOptions.indexOf(selectedLanguage);
    const nextIndex = (currentIndex + 1) % languageOptions.length;
    setSelectedLanguage(languageOptions[nextIndex]);
  };

  // Обработчик кнопки аккаунт
  const handleAccountClick = () => {
    if (selectedAccount) {
      setSelectedAccount(null);
    } else {
      if (window.Telegram?.WebApp?.showPopup) {
        window.Telegram.WebApp.showPopup({
          message: 'размер аккаунта\n\n0-10к\n10к-100к\n100к-300к\n300к-1млн\nбольше 1млн'
        });
      }
      setSelectedAccount(accountOptions[0]);
    }
  };

  const handleAccountBadgeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedAccount) return;
    const currentIndex = accountOptions.indexOf(selectedAccount);
    const nextIndex = (currentIndex + 1) % accountOptions.length;
    setSelectedAccount(accountOptions[nextIndex]);
  };

  const handleReturnClick = async () => {
    // Сбрасываем все фильтры
    setSelectedSort(null);
    setSelectedDate(null);
    setSelectedLanguage(null);
    setSelectedAccount(null);
    setLikedCards(new Set());
    
    // Перезагружаем исходные reels
    try {
      setLoading(true);
      
      const [neuro, marketing, content, promotion] = await Promise.all([
        getTopReels('нейросети'),
        getTopReels('маркетинг'),
        getTopReels('контент'),
        getTopReels('продвижение'),
      ]);
      
      const allReels = [...neuro, ...marketing, ...content, ...promotion];
      
      setReels(allReels);
      setLabaReelsCache(allReels);
    } catch (error) {
      console.error('Ошибка загрузки топ reels:', error);
      showMessage('ошибка загрузки топ reels', 'alert');
    } finally {
      setLoading(false);
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
          onClick={() => {
            // Очищаем результаты поиска при выходе на главную
            setReels([]);
            setLabaReelsCache([]);
            navigate('/main-dashboard-premium');
          }}
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

        {/* Search bar + 25 badge - EXACT Figma coordinates */}
        <div className="blur-wave" style={{
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
              <img src={searchIcon} alt="" style={{ width: '100%', height: '100%' }} />
            </div>
          </div>

          {/* Search input */}
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
onBlur={() => {
              setTimeout(() => {
                setIsSearchFocused(false);
                setSearchValue('');
              }, 100);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
            placeholder={isSearchFocused ? '' : 'найти видео по ключевому слову'}
            enterKeyHint="search"
            style={{
              position: 'absolute',
              left: '70px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '612px',
              fontFamily: 'Gotham Pro, sans-serif',
              fontWeight: 300,
              fontSize: '32px',
              color: '#848484',
              background: 'transparent',
              border: 'none',
              outline: 'none',
            }}
          />

          {/* Badge "начать поиск" - PNG из Desktop */}
          <img 
            src={badgeStartSearch}
            alt="начать поиск"
            onClick={handleSearch}
            className="button-inner-glow"
            style={{
              position: 'absolute',
              left: 'calc(50% + 373px)',
              top: '-2px',
              transform: 'translateX(-50%)',
              width: '130px',
              height: '72px',
              cursor: 'pointer',
            }}
          />
        </div>

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
          onClick={handleDateClick}
          className="button-inner-glow"
          style={{ position: 'absolute', left: '593px', top: '327px', width: '247px', height: '79px', cursor: 'pointer' }} 
        />
        <img 
          src={selectedLanguage ? buttonLanguageActive : buttonLanguage} 
          alt="язык" 
          onClick={handleLanguageClick}
          className="button-inner-glow"
          style={{ position: 'absolute', left: '840px', top: '327px', width: '247px', height: '79px', cursor: 'pointer' }} 
        />

        {/* Filter buttons - Row 2 - EXACT Figma coordinates */}
        <img 
          src={selectedAccount ? buttonAccountActive : buttonAccount}
          alt="аккаунт"
          onClick={handleAccountClick}
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
          src={buttonVirality}
          alt="виральность"
          style={{
            position: 'absolute',
            left: '464px',
            top: '485px',
            width: '247px',
            height: '79px',
            opacity: 0.5,
            cursor: 'not-allowed',
          }}
        />

        <img 
          src={buttonFormat}
          alt="формат"
          style={{
            position: 'absolute',
            left: '711px',
            top: '485px',
            width: '247px',
            height: '79px',
            opacity: 0.5,
            cursor: 'not-allowed',
          }}
        />

        {/* Filter badges - Row 2 - EXACT Figma coordinates */}
        <div
          onClick={handleSortBadgeClick}
          style={{
            position: 'absolute',
            left: '407px',
            top: '406px',
            width: '186px',
            height: '79px',
            cursor: selectedSort ? 'pointer' : 'default',
          }}
        >
          <img 
            src={selectedSort ? badgeEmptyActive : badgeLikes}
            alt="сортировка"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />
          {selectedSort && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'Gotham Pro, sans-serif',
              fontWeight: 500,
              fontSize: '25px',
              color: 'white',
              textAlign: 'center',
              pointerEvents: 'none',
              padding: '0 10px',
              lineHeight: '1.2',
            }}>
              {selectedSort}
            </div>
          )}
        </div>

        <div
          onClick={handleDateBadgeClick}
          style={{
            position: 'absolute',
            left: '654px',
            top: '406px',
            width: '186px',
            height: '79px',
            cursor: selectedDate ? 'pointer' : 'default',
          }}
        >
          <img 
            src={selectedDate ? badgeEmptyActive : badgeTimeslot}
            alt="дата"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />
          {selectedDate && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'Gotham Pro, sans-serif',
              fontWeight: 500,
              fontSize: '25px',
              color: 'white',
              textAlign: 'center',
              pointerEvents: 'none',
              padding: '0 10px',
              lineHeight: '1.2',
            }}>
              {selectedDate}
            </div>
          )}
        </div>

        <div
          onClick={handleLanguageBadgeClick}
          style={{
            position: 'absolute',
            left: '901px',
            top: '406px',
            width: '186px',
            height: '79px',
            cursor: selectedLanguage ? 'pointer' : 'default',
          }}
        >
          <img 
            src={selectedLanguage ? badgeEmptyActive : badgeRussian}
            alt="язык"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />
          {selectedLanguage && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'Gotham Pro, sans-serif',
              fontWeight: 500,
              fontSize: '25px',
              color: 'white',
              textAlign: 'center',
              pointerEvents: 'none',
              padding: '0 10px',
              lineHeight: '1.2',
            }}>
              {selectedLanguage}
            </div>
          )}
        </div>

        {/* Filter badges - Row 3 - активные плашки с Desktop */}
        <div
          onClick={handleAccountBadgeClick}
          style={{
            position: 'absolute',
            left: '281px',
            top: '564px',
            width: '186px',
            height: '79px',
            cursor: selectedAccount ? 'pointer' : 'default',
          }}
        >
          <img 
            src={selectedAccount ? badgeEmptyActive : badgeAccount}
            alt="аккаунт"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />
          {selectedAccount && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'Gotham Pro, sans-serif',
              fontWeight: 500,
              fontSize: '25px',
              color: 'white',
              textAlign: 'center',
              pointerEvents: 'none',
              padding: '0 10px',
              lineHeight: '1.2',
            }}>
              {selectedAccount}
            </div>
          )}
        </div>

        <img 
          src={badgeScores}
          alt="9-10 баллов"
          style={{
            position: 'absolute',
            left: '525px',
            top: '564px',
            width: '186px',
            height: '79px',
            opacity: 0.5,
          }}
        />

        <img 
          src={badgeReels}
          alt="IG reels"
          style={{
            position: 'absolute',
            left: '772px',
            top: '564px',
            width: '186px',
            height: '79px',
            opacity: 0.5,
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

        {/* Main content window - с СКРОЛЛОМ БЕЗ ФЕЙДА - ТОЛЬКО ВЕРТИКАЛЬНЫЙ */}
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
          overflowX: 'hidden',
          overflowY: 'auto',
          zIndex: 10,
        }}>
          {/* Blur placeholder cards - показываем 40 штук пока идет загрузка */}
          {showBlurCards && Array.from({ length: 40 }).map((_, index) => {
            // Показываем блюр-карточку только если reel еще не загружен
            if (index >= reels.length) {
              return <BlurReelCard key={`blur-${index}`} index={index} />;
            }
            return null;
          })}
          
          {/* Reels cards - Dynamic rendering с прогрессивной загрузкой */}
          {reels.map((reel, index) => (
            <ReelCard
              key={reel.id}
              reel={reel}
              index={index}
              isFavorite={likedCards.has(reel.id)}
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