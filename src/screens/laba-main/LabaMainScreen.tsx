import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Footer, Header, ThreeBg } from '../../components/ScreenLayout';
import { LabaFilterButton } from '../../components/laba/LabaFilterButton';
import { LabaFeedCard, LabaFeedPlaceholderCard } from '../../components/laba/LabaFeedCard';
import { LabaSearchInput } from '../../components/laba/LabaSearchInput';
import { useUIState } from '../../contexts/UIStateContext';
import { LABA_COSTS, Reel, TopReelCategory } from '../../types/laba';
import {
  cacheFavorites,
  cacheSearchReels,
  cacheTopReels,
  findTrackedAccountByUsername,
  getCachedFavorites,
  getCachedTrackedAccounts,
  getCachedSearchReels,
  getCachedTopReels,
  getFavorites,
  getTelegramUserId,
  getTopReels,
  refreshTrackedAccounts,
  searchReels,
  setCachedFavoriteState,
  showMessage,
  toggleFavorite,
  trackAccount,
} from '../../utils/labaApi';
import metacoinSmall from '../../assets/metacoins-redesign/новый метакоин маленький.png';
import reelsScrollWindowNew from '../../assets/laba-main/reels-scroll-window-new.png';
import searchIcon from '../../assets/иконка поиск.png';
import desktopAiAnalysisButton from '../../assets/laba-main-buttons/desktop-ai-analysis.png';

const textFont = 'Cygre, sans-serif';
const sortOptions = ['>просмотров', '<просмотров', '>лайков', '<лайков', '>комментов', '<комментов'];
const dateOptions = ['7 дней', '14 дней', '30 дней', '6 месяцев', '1 год'];
const languageOptions = ['русский', 'английский', 'испанский', 'турецкий'];
const accountOptions = ['0-10к', '10к-100к', '100к-300к', '300к-1млн', '>1млн'];
const DEFAULT_TOP_REELS_CATEGORY: TopReelCategory = 'нейросети';

export const LabaMainScreen: React.FC = () => {
  const navigate = useNavigate();
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;
  const {
    labaReelsCache,
    setLabaReelsCache,
    labaMainSearchQuery,
    setLabaMainSearchQuery,
  } = useUIState();
  const initialCachedSearchReels = React.useMemo(
    () => labaMainSearchQuery.trim() ? getCachedSearchReels(labaMainSearchQuery) : [],
    [labaMainSearchQuery]
  );
  const initialCachedTopReels = React.useMemo(
    () => getCachedTopReels(DEFAULT_TOP_REELS_CATEGORY),
    []
  );
  const hasActiveSearch = labaMainSearchQuery.trim().length > 0;
  const initialTrackedAccounts = React.useMemo(() => {
    const userId = getTelegramUserId();
    return userId ? getCachedTrackedAccounts(userId) : [];
  }, []);
  const initialReels = hasActiveSearch
    ? (initialCachedSearchReels.length > 0 ? initialCachedSearchReels : labaReelsCache)
    : initialCachedTopReels;

  const [reels, setReels] = React.useState<Reel[]>(initialReels);
  const [loading, setLoading] = React.useState(initialReels.length === 0);
  const [selectedSort, setSelectedSort] = React.useState<string | null>(null);
  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = React.useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = React.useState<string | null>(null);
  const [likedCards, setLikedCards] = React.useState<Set<string>>(new Set());
  const [searching, setSearching] = React.useState(false);
  const [isSearchFocused, setIsSearchFocused] = React.useState(false);
  const [isSearchPressed, setIsSearchPressed] = React.useState(false);
  const [hasSearchResults, setHasSearchResults] = React.useState(
    () => labaMainSearchQuery.trim().length > 0 && (initialCachedSearchReels.length > 0 || labaReelsCache.length > 0)
  );
  const [trackedAccounts, setTrackedAccounts] = React.useState(initialTrackedAccounts);
  const reelsScrollRef = React.useRef<HTMLDivElement | null>(null);
  const topReelsRetryTimeoutRef = React.useRef<number | null>(null);

  const loadTopReels = React.useCallback(async (attempt = 0) => {
    setLoading(true);
    try {
      const items = await getTopReels(DEFAULT_TOP_REELS_CATEGORY);
      if (items.length > 0) {
        if (topReelsRetryTimeoutRef.current !== null) {
          window.clearTimeout(topReelsRetryTimeoutRef.current);
          topReelsRetryTimeoutRef.current = null;
        }
        cacheTopReels(DEFAULT_TOP_REELS_CATEGORY, items);
        setReels(items);
      } else {
        cacheTopReels(DEFAULT_TOP_REELS_CATEGORY, []);
        setReels([]);
        if (attempt < 4) {
          topReelsRetryTimeoutRef.current = window.setTimeout(() => {
            void loadTopReels(attempt + 1);
          }, 3500);
        }
      }
      setHasSearchResults(false);
    } catch (error) {
      console.error('Ошибка загрузки reels:', error);
      showMessage('ошибка загрузки reels', 'alert');
    } finally {
      setLoading(false);
    }
  }, [setLabaReelsCache]);

  React.useEffect(() => {
    if (!labaMainSearchQuery.trim()) {
      setLabaReelsCache([]);
      void loadTopReels();
    }
  }, [labaMainSearchQuery, loadTopReels, setLabaReelsCache]);

  React.useEffect(() => {
    return () => {
      if (topReelsRetryTimeoutRef.current !== null) {
        window.clearTimeout(topReelsRetryTimeoutRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    const hydrateFavorites = async () => {
      const userId = getTelegramUserId();
      if (!userId) {
        return;
      }

      try {
        const cachedFavorites = getCachedFavorites(userId);
        if (cachedFavorites.length > 0) {
          setLikedCards(new Set(cachedFavorites.map((reel) => reel.id)));
        }
        const favoriteReels = await getFavorites(userId);
        cacheFavorites(userId, favoriteReels);
        setLikedCards(new Set(favoriteReels.map((reel) => reel.id)));
      } catch (error) {
        console.error('Ошибка загрузки избранного:', error);
      }
    };

    void hydrateFavorites();
  }, []);

  React.useEffect(() => {
    const userId = getTelegramUserId();
    if (!userId) return;

    void refreshTrackedAccounts(userId)
      .then(setTrackedAccounts)
      .catch((error) => {
        console.error('Ошибка загрузки tracked accounts:', error);
      });
  }, []);

  const detectLanguage = (text: string | null): string => {
    if (!text) return 'unknown';
    if (/[а-яё]/i.test(text)) return 'русский';
    if (/[ğışçöü]/i.test(text)) return 'турецкий';
    if (/[ñáéíóúü¿¡]/i.test(text)) return 'испанский';
    if (/[a-z]/i.test(text)) return 'английский';
    return 'unknown';
  };

  const applyFilters = React.useCallback((items: Reel[]) => {
    let filtered = [...items];

    if (selectedDate) {
      const daysMap: Record<string, number> = {
        '7 дней': 7,
        '14 дней': 14,
        '30 дней': 30,
        '6 месяцев': 180,
        '1 год': 365,
      };
      const cutoff = Date.now() - daysMap[selectedDate] * 24 * 60 * 60 * 1000;
      filtered = filtered.filter((reel) => new Date(reel.publishedAt).getTime() >= cutoff);
    }

    if (selectedAccount) {
      filtered = filtered.filter((reel) => {
        const followers = reel.accountFollowers;
        if (selectedAccount === '0-10к') return followers < 10000;
        if (selectedAccount === '10к-100к') return followers >= 10000 && followers < 100000;
        if (selectedAccount === '100к-300к') return followers >= 100000 && followers < 300000;
        if (selectedAccount === '300к-1млн') return followers >= 300000 && followers < 1000000;
        if (selectedAccount === '>1млн') return followers >= 1000000;
        return true;
      });
    }

    if (selectedLanguage) {
      filtered = filtered.filter((reel) => detectLanguage(reel.caption) === selectedLanguage);
    }

    if (selectedSort) {
      filtered.sort((a, b) => {
        if (selectedSort === '>просмотров') return b.viewsCount - a.viewsCount;
        if (selectedSort === '<просмотров') return a.viewsCount - b.viewsCount;
        if (selectedSort === '>лайков') return b.likesCount - a.likesCount;
        if (selectedSort === '<лайков') return a.likesCount - b.likesCount;
        if (selectedSort === '>комментов') return b.commentsCount - a.commentsCount;
        if (selectedSort === '<комментов') return a.commentsCount - b.commentsCount;
        return 0;
      });
    }

    return filtered;
  }, [selectedAccount, selectedDate, selectedLanguage, selectedSort]);

  const visibleReels = React.useMemo(() => applyFilters(reels), [applyFilters, reels]);

  const cycleFilter = (
    value: string | null,
    setter: React.Dispatch<React.SetStateAction<string | null>>,
    options: string[],
    popupTitle: string,
  ) => {
    if (!value) {
      window.Telegram?.WebApp?.showPopup?.({
        message: `${popupTitle}\n\n${options.join('\n')}`,
      });
      setter(options[0]);
      return;
    }
    const nextIndex = (options.indexOf(value) + 1) % options.length;
    setter(options[nextIndex]);
  };

  const handleSearch = async () => {
    const keyword = labaMainSearchQuery.trim();
    if (!keyword) {
      showMessage('введите ключевое слово для поиска', 'popup');
      return;
    }

    const userId = getTelegramUserId();
    if (!userId) {
      showMessage('ошибка получения telegram user id', 'popup');
      return;
    }

    setSearching(true);
    setLoading(true);
    reelsScrollRef.current?.scrollTo({ top: 0 });
    showMessage('начался поиск рилс. Пожалуйста, подождите 30-40 секунд', 'popup');
    try {
      const foundReels = await searchReels(keyword, userId);
      cacheSearchReels(keyword, foundReels);
      setReels(foundReels);
      setLabaReelsCache(foundReels);
      setHasSearchResults(true);
      showMessage(foundReels.length ? 'рилс успешно найдены' : 'ничего не найдено', 'popup');
    } catch (error: any) {
      console.error('Ошибка поиска:', error);
      showMessage(error.message || 'ошибка поиска', 'popup');
    } finally {
      setSearching(false);
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (reelId: string) => {
    const userId = getTelegramUserId();
    if (!userId) return;
    const targetReel = reels.find((item) => item.id === reelId);
    const currentIsFavorite = likedCards.has(reelId);
    const nextIsFavorite = !currentIsFavorite;
    const nextReels = reels.map((item) => item.id === reelId ? { ...item, isFavorite: nextIsFavorite } : item);

    setReels(nextReels);
    setLabaReelsCache(nextReels);
    setLikedCards((prev) => {
      const next = new Set(prev);
      if (nextIsFavorite) next.add(reelId);
      else next.delete(reelId);
      return next;
    });
    if (targetReel) {
      setCachedFavoriteState(userId, { ...targetReel, isFavorite: nextIsFavorite }, nextIsFavorite);
    }
    showMessage(nextIsFavorite ? 'рилс добавлен в избранное' : 'рилс удален из избранного', 'popup');

    try {
      const confirmedIsFavorite = await toggleFavorite(reelId, userId);
      if (confirmedIsFavorite === nextIsFavorite) {
        return;
      }

      const rollbackReels = reels.map((item) => item.id === reelId ? { ...item, isFavorite: confirmedIsFavorite } : item);
      setReels(rollbackReels);
      setLabaReelsCache(rollbackReels);
      setLikedCards((prev) => {
        const next = new Set(prev);
        if (confirmedIsFavorite) next.add(reelId);
        else next.delete(reelId);
        return next;
      });
      if (targetReel) {
        setCachedFavoriteState(userId, { ...targetReel, isFavorite: confirmedIsFavorite }, confirmedIsFavorite);
      }
    } catch (error) {
      console.error('Ошибка избранного:', error);
      setReels(reels);
      setLabaReelsCache(reels);
      setLikedCards((prev) => {
        const next = new Set(prev);
        if (currentIsFavorite) next.add(reelId);
        else next.delete(reelId);
        return next;
      });
      if (targetReel) {
        setCachedFavoriteState(userId, { ...targetReel, isFavorite: currentIsFavorite }, currentIsFavorite);
      }
    }
  };

  const handleTrackFromCard = async (reel: Reel) => {
    const userId = getTelegramUserId();
    if (!userId) {
      showMessage('ошибка получения telegram user id', 'popup');
      return;
    }

    const existingTrackedAccount = findTrackedAccountByUsername(trackedAccounts, reel.accountUsername);
    if (existingTrackedAccount) {
      navigate(`/laba-tracked?accountId=${encodeURIComponent(existingTrackedAccount.id)}`, {
        state: {
          trackedAccountId: existingTrackedAccount.id,
        },
      });
      return;
    }

    showMessage('ИИ-агент начал собирать рилс. Пожалуйста, подождите 30-40 секунд', 'popup');

    try {
      const result = await trackAccount(reel.accountUsername, userId);
      navigate(`/laba-tracked?accountId=${encodeURIComponent(result.accountId)}`, {
        state: {
          trackingStarted: true,
          trackedAccountId: result.accountId,
        },
      });
    } catch (error: any) {
      console.error('Ошибка отслеживания:', error);
      showMessage(error.message || 'ошибка отслеживания', 'popup');
    }
  };

  const resetFilters = async () => {
    setSelectedSort(null);
    setSelectedDate(null);
    setSelectedLanguage(null);
    setSelectedAccount(null);
    reelsScrollRef.current?.scrollTo({ top: 0 });
    if (!hasSearchResults && reels.length === 0) {
      await loadTopReels();
    }
  };

  return (
    <div style={{ position: 'relative', width: '100vw', minHeight: '100vh', background: '#020101', overflow: 'hidden' }}>
      <div style={{ position: 'relative', width: '1180px', minHeight: '2550px', transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <ThreeBg />
        <Header
          onLogoClick={() => {
            setReels([]);
            setLabaReelsCache([]);
            navigate('/main-dashboard-premium');
          }}
        />

        <div style={{ position: 'absolute', left: '85px', top: '193px', width: '1020px' }}>
          <p style={{ margin: 0, fontFamily: textFont, fontWeight: 700, fontSize: '80px', lineHeight: '1', color: '#fff' }}>
            виральные видео
          </p>
        </div>

        <div style={{ position: 'absolute', left: '85px', top: '273px', width: '820px' }}>
          <p style={{ margin: 0, fontFamily: textFont, fontWeight: 400, fontSize: '40px', lineHeight: '1', color: '#fff' }}>
            начните с поиска по ключевому слову
          </p>
        </div>

        <div
          style={{
            position: 'absolute',
            left: '152px',
            top: '376px',
            width: '876px',
            height: '79px',
            transform: isSearchFocused ? 'scale(1.04)' : 'scale(1)',
            transformOrigin: 'center',
            transition: 'transform 560ms cubic-bezier(0.22, 1, 0.36, 1), filter 260ms ease',
            filter: isSearchFocused ? 'brightness(1.08)' : 'none',
          }}
        >
          <LabaSearchInput
            value={labaMainSearchQuery}
            onChange={setLabaMainSearchQuery}
            onEnter={() => void handleSearch()}
            onFocusChange={setIsSearchFocused}
            placeholder="найти видео по ключевому слову"
            iconSrc={searchIcon}
            textRightInset="190px"
            style={{
              left: '0px',
              top: '0px',
              width: '876px',
              height: '79px',
            }}
          />

          <button
            type="button"
            onClick={() => void handleSearch()}
            className={`motion-press-grow ${isSearchPressed ? 'is-pressed' : ''}`}
            onPointerDown={() => setIsSearchPressed(true)}
            onPointerUp={() => setIsSearchPressed(false)}
            onPointerLeave={() => setIsSearchPressed(false)}
            onPointerCancel={() => setIsSearchPressed(false)}
            style={{
              position: 'absolute',
              left: '748px',
              top: '2px',
              width: '129px',
              height: '73px',
              borderRadius: '62px',
              color: '#fff',
              cursor: 'pointer',
              padding: 0,
              border: '4px solid rgba(255,255,255,0.3)',
              background: 'rgba(0,0,0,0.9)',
              backdropFilter: 'blur(50px)',
              zIndex: 2,
              boxShadow: '0 0 8px rgba(255,255,255,0.22), 0 0 18px rgba(255,255,255,0.12)',
              overflow: 'hidden',
            }}
          >
            <div style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', boxShadow: 'inset 0 0 8px rgba(255,255,255,0.18), inset 0 0 18px rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              <div
                style={{
                  position: 'absolute',
                  left: '55px',
                  top: '17px',
                  width: '42px',
                  height: '26px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: textFont,
                  fontWeight: 700,
                  fontSize: '27px',
                  lineHeight: '1',
                }}
              >
                {LABA_COSTS.SEARCH_REELS}
              </div>
              <div style={{ position: 'absolute', left: '41px', top: '23px', width: '19px', height: '19px', overflow: 'hidden' }}>
                <img
                  src={metacoinSmall}
                  alt=""
                  style={{
                    width: '19px',
                    height: '19px',
                    objectFit: 'contain',
                  }}
                />
              </div>
            </div>
          </button>
        </div>

        <LabaFilterButton label="вернуть" left={220} top={482} width={247} onClick={() => void resetFilters()} />
        <LabaFilterButton
          label={selectedSort || 'сортировка'}
          left={467}
          top={482}
          width={247}
          active={Boolean(selectedSort)}
          onClick={() => cycleFilter(selectedSort, setSelectedSort, sortOptions, 'сортировка')}
        />
        <LabaFilterButton
          label={selectedDate || 'дата'}
          left={714}
          top={482}
          width={247}
          active={Boolean(selectedDate)}
          onClick={() => cycleFilter(selectedDate, setSelectedDate, dateOptions, 'дата публикации')}
        />
        <LabaFilterButton
          label={selectedAccount || 'аккаунт'}
          left={343}
          top={561}
          width={247}
          active={Boolean(selectedAccount)}
          onClick={() => cycleFilter(selectedAccount, setSelectedAccount, accountOptions, 'размер аккаунта')}
        />
        <LabaFilterButton
          label={selectedLanguage || 'язык'}
          left={590}
          top={561}
          width={247}
          active={Boolean(selectedLanguage)}
          onClick={() => cycleFilter(selectedLanguage, setSelectedLanguage, languageOptions, 'язык')}
        />

        <div
          style={{
            position: 'absolute',
            left: '54px',
            top: '593px',
            width: '1119px',
            height: '1499px',
            pointerEvents: 'none',
          }}
        >
          <img src={reelsScrollWindowNew} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <div
          ref={reelsScrollRef}
          className="laba-feed-scroll"
          style={{
            position: 'absolute',
            left: '143px',
            top: '672px',
            width: '894px',
            height: '1369px',
            overflowY: 'auto',
            overflowX: 'hidden',
            paddingTop: '34px',
            paddingBottom: '44px',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            touchAction: 'pan-y',
            zIndex: 2,
            scrollBehavior: 'smooth',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '34px' }}>
            {loading || searching
              ? Array.from({ length: searching ? 8 : 2 }).map((_, index) => <LabaFeedPlaceholderCard key={index} />)
              : visibleReels.map((reel) => (
                  <LabaFeedCard
                    key={reel.id}
                    reel={reel}
                    isFavorite={likedCards.has(reel.id)}
                    onToggleFavorite={handleToggleFavorite}
                    onAction={() => void handleTrackFromCard(reel)}
                    onOpenAnalysis={() => navigate('/laba-analysis', { state: { reel: { ...reel, isFavorite: likedCards.has(reel.id) } } })}
                    actionLabel={findTrackedAccountByUsername(trackedAccounts, reel.accountUsername) ? 'к аккаунту' : 'следить'}
                    actionCost={findTrackedAccountByUsername(trackedAccounts, reel.accountUsername) ? undefined : 100}
                    likeEffectVariant="tiktok"
                    actionMotionVariant="premium"
                    openAnalysisButtonSrc={desktopAiAnalysisButton}
                    activityPillTop={674}
                  />
                ))}
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
};
