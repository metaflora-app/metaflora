import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Footer, Header, ThreeBg } from '../../components/ScreenLayout';
import { LabaFilterButton } from '../../components/laba/LabaFilterButton';
import { LabaFeedCard, LabaFeedPlaceholderCard } from '../../components/laba/LabaFeedCard';
import { LabaSearchInput } from '../../components/laba/LabaSearchInput';
import { useUIState } from '../../contexts/UIStateContext';
import { LABA_COSTS, Reel } from '../../types/laba';
import { getTelegramUserId, getTopReels, searchReels, showMessage, toggleFavorite, trackAccount } from '../../utils/labaApi';
import metacoinSmall from '../../assets/metacoins-redesign/новый метакоин маленький.png';
import reelsScrollWindowNew from '../../assets/laba-main/reels-scroll-window-new.png';
import searchIcon from '../../assets/иконка поиск.png';
import desktopAiAnalysisButton from '../../assets/laba-main-buttons/desktop-ai-analysis.png';

const textFont = 'Cygre, sans-serif';
const sortOptions = ['>просмотров', '<просмотров', '>лайков', '<лайков', '>комментов', '<комментов'];
const dateOptions = ['7 дней', '14 дней', '30 дней', '6 месяцев', '1 год'];
const languageOptions = ['русский', 'английский', 'испанский', 'турецкий'];
const accountOptions = ['0-10к', '10к-100к', '100к-300к', '300к-1млн', '>1млн'];

export const LabaMainScreen: React.FC = () => {
  const navigate = useNavigate();
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;
  const {
    labaReelsCache,
    setLabaReelsCache,
    labaMainSearchQuery,
    setLabaMainSearchQuery,
  } = useUIState();

  const [reels, setReels] = React.useState<Reel[]>(labaReelsCache);
  const [loading, setLoading] = React.useState(labaReelsCache.length === 0);
  const [selectedSort, setSelectedSort] = React.useState<string | null>(null);
  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = React.useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = React.useState<string | null>(null);
  const [likedCards, setLikedCards] = React.useState<Set<string>>(new Set());
  const [searching, setSearching] = React.useState(false);

  const loadTopReels = React.useCallback(async () => {
    setLoading(true);
    try {
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
      console.error('Ошибка загрузки reels:', error);
      showMessage('ошибка загрузки reels', 'alert');
    } finally {
      setLoading(false);
    }
  }, [setLabaReelsCache]);

  React.useEffect(() => {
    void loadTopReels();
  }, [loadTopReels]);

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
    showMessage('начался поиск рилс. Пожалуйста, подождите 30-40 секунд', 'popup');
    try {
      const foundReels = await searchReels(keyword, userId);
      setReels(foundReels);
      setLabaReelsCache(foundReels);
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

    try {
      const nextIsFavorite = await toggleFavorite(reelId, userId);
      setLikedCards((prev) => {
        const next = new Set(prev);
        if (nextIsFavorite) next.add(reelId);
        else next.delete(reelId);
        return next;
      });
      showMessage(nextIsFavorite ? 'рилс добавлен в избранное' : 'рилс удален из избранного', 'popup');
    } catch (error) {
      console.error('Ошибка избранного:', error);
    }
  };

  const handleTrackFromCard = async (reel: Reel) => {
    const userId = getTelegramUserId();
    if (!userId) {
      showMessage('ошибка получения telegram user id', 'popup');
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
    setLikedCards(new Set());
    setLabaMainSearchQuery('');
    await loadTopReels();
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

        <LabaSearchInput
          value={labaMainSearchQuery}
          onChange={setLabaMainSearchQuery}
          onEnter={() => void handleSearch()}
          placeholder="найти видео по ключевому слову"
          iconSrc={searchIcon}
          textRightInset="190px"
          style={{
            left: '152px',
            top: '376px',
            width: '876px',
            height: '79px',
          }}
        />

        <button
          type="button"
          onClick={() => void handleSearch()}
          className="blur-wave"
          style={{
            position: 'absolute',
            left: '900px',
            top: '378px',
            width: '129px',
            height: '73px',
            borderRadius: '62px',
            border: '4px solid rgba(255,255,255,0.3)',
            background: '#000',
            color: '#fff',
            cursor: 'pointer',
            padding: 0,
            backdropFilter: 'blur(50px)',
          }}
        >
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
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '34px' }}>
            {loading || searching
              ? Array.from({ length: 2 }).map((_, index) => <LabaFeedPlaceholderCard key={index} />)
              : visibleReels.map((reel) => (
                  <LabaFeedCard
                    key={reel.id}
                    reel={reel}
                    isFavorite={likedCards.has(reel.id)}
                    onToggleFavorite={handleToggleFavorite}
                    onAction={() => void handleTrackFromCard(reel)}
                    onOpenAnalysis={() => navigate('/laba-analysis', { state: { reel } })}
                    actionLabel="следить"
                    actionCost={100}
                    openAnalysisButtonSrc={desktopAiAnalysisButton}
                  />
                ))}
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
};
