import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Footer, Header, ThreeBg } from '../../components/ScreenLayout';
import { LabaFeedCard, LabaFeedPlaceholderCard } from '../../components/laba/LabaFeedCard';
import { useUIState } from '../../contexts/UIStateContext';
import { LABA_COSTS, Reel } from '../../types/laba';
import { getTelegramUserId, getTopReels, searchReels, showMessage, toggleFavorite, trackAccount } from '../../utils/labaApi';
import searchIcon from '../../assets/laba-icons/иконка поиска.png';
import metacoinSmall from '../../assets/metacoins-redesign/новый метакоин маленький.png';

const textFont = 'Cygre, sans-serif';
const figmaPeopleLogo = 'https://www.figma.com/api/mcp/asset/70600abd-efb9-4e13-8419-fcd8c241b6d7';
const figmaBigDemoLogo = 'https://www.figma.com/api/mcp/asset/ae8d1963-710b-464a-a75a-cc7aac07d21d';
const figmaSearchIcon = 'https://www.figma.com/api/mcp/asset/599c0367-cbdd-45f8-b56f-00e99b9c2383';
const sortOptions = ['>просмотров', '<просмотров', '>лайков', '<лайков', '>комментов', '<комментов'];
const dateOptions = ['7 дней', '14 дней', '30 дней', '6 месяцев', '1 год'];
const languageOptions = ['русский', 'английский', 'испанский', 'турецкий'];
const accountOptions = ['0-10к', '10к-100к', '100к-300к', '300к-1млн', '>1млн'];

export const LabaMainScreen: React.FC = () => {
  const navigate = useNavigate();
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;
  const { labaReelsCache, setLabaReelsCache } = useUIState();

  const [reels, setReels] = React.useState<Reel[]>(labaReelsCache);
  const [loading, setLoading] = React.useState(labaReelsCache.length === 0);
  const [selectedSort, setSelectedSort] = React.useState<string | null>(null);
  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = React.useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = React.useState<string | null>(null);
  const [likedCards, setLikedCards] = React.useState<Set<string>>(new Set());
  const [searchValue, setSearchValue] = React.useState('');
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
    const keyword = searchValue.trim();
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
    try {
      const foundReels = await searchReels(keyword, userId);
      setReels(foundReels);
      setLabaReelsCache(foundReels);
      window.Telegram?.WebApp?.showPopup?.({
        message: foundReels.length ? 'reels успешно найдены' : 'ничего не найдено',
      });
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

    const wasLiked = likedCards.has(reelId);
    setLikedCards((prev) => {
      const next = new Set(prev);
      if (wasLiked) next.delete(reelId);
      else next.add(reelId);
      return next;
    });

    try {
      await toggleFavorite(reelId, userId);
    } catch (error) {
      console.error('Ошибка избранного:', error);
      setLikedCards((prev) => {
        const next = new Set(prev);
        if (wasLiked) next.add(reelId);
        else next.delete(reelId);
        return next;
      });
    }
  };

  const handleTrackFromCard = async (reel: Reel) => {
    const userId = getTelegramUserId();
    if (!userId) {
      showMessage('ошибка получения telegram user id', 'popup');
      return;
    }

    const webApp = (window as any).Telegram?.WebApp;
    if (webApp?.showPopup) {
      webApp.showPopup(
        {
          message:
            'аккаунт будет добавлен в отслеживаемые вместе с последними опубликованными reels\n\nстоимость за каждое последующее видео после отслеживания — 15 метакоинов',
        },
        async () => {
          try {
            await trackAccount(reel.accountUsername, userId);
            navigate('/laba-tracked');
          } catch (error: any) {
            console.error('Ошибка отслеживания:', error);
            showMessage(error.message || 'ошибка отслеживания', 'popup');
          }
        },
      );
    }
  };

  const resetFilters = async () => {
    setSelectedSort(null);
    setSelectedDate(null);
    setSelectedLanguage(null);
    setSelectedAccount(null);
    setLikedCards(new Set());
    setSearchValue('');
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

        <div
          className="blur-wave"
          style={{
            position: 'absolute',
            left: '152px',
            top: '376px',
            width: '876px',
            height: '79px',
            borderRadius: '62px',
            border: '4px solid rgba(255,255,255,0.3)',
            background: '#000',
          }}
        >
          <img src={figmaSearchIcon} alt="" style={{ position: 'absolute', left: '19px', top: '21px', width: '38px', height: '38px' }} />
          <div
            style={{
              position: 'absolute',
              left: '74px',
              top: 0,
              width: '612px',
              height: '79px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void handleSearch();
              }}
              placeholder="найти видео по ключевому слову"
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontFamily: textFont,
                fontWeight: 400,
                fontSize: '32px',
                lineHeight: '1',
                color: 'rgba(255,255,255,0.3)',
              }}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => void handleSearch()}
          className="button-inner-glow"
          style={{
            position: 'absolute',
            left: '900px',
            top: '380px',
            width: '129px',
            height: '73px',
            borderRadius: '62px',
            border: '4px solid rgba(255,255,255,0.3)',
            background: '#000',
            color: '#fff',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                position: 'absolute',
                right: '28px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontFamily: textFont,
                fontWeight: 700,
                fontSize: '27px',
                lineHeight: '1',
              }}
            >
              {LABA_COSTS.SEARCH_REELS}
            </span>
            <img
              src={metacoinSmall}
              alt=""
              style={{
                position: 'absolute',
                left: '33px',
                top: '22px',
                width: '19px',
                height: '19px',
                objectFit: 'contain',
              }}
            />
          </div>
        </button>

        <FilterButton label="вернуть" left={221} top={497} width={247} active onClick={() => void resetFilters()} />
        <FilterButton
          label={selectedSort || 'сортировка'}
          left={468}
          top={497}
          width={247}
          active={Boolean(selectedSort)}
          onClick={() => cycleFilter(selectedSort, setSelectedSort, sortOptions, 'сортировка')}
        />
        <FilterButton
          label={selectedDate || 'дата'}
          left={715}
          top={497}
          width={247}
          active={Boolean(selectedDate)}
          onClick={() => cycleFilter(selectedDate, setSelectedDate, dateOptions, 'дата публикации')}
        />
        <FilterButton
          label={selectedAccount || 'аккаунт'}
          left={282}
          top={576}
          width={247}
          active={Boolean(selectedAccount)}
          onClick={() => cycleFilter(selectedAccount, setSelectedAccount, accountOptions, 'размер аккаунта')}
        />
        <FilterButton
          label={selectedLanguage || 'язык'}
          left={529}
          top={576}
          width={247}
          active={Boolean(selectedLanguage)}
          onClick={() => cycleFilter(selectedLanguage, setSelectedLanguage, languageOptions, 'язык')}
        />

        <div style={{ position: 'absolute', left: '141px', top: '661px', width: '894px', height: '1382px', pointerEvents: 'none' }}>
          <img
            src={figmaPeopleLogo}
            alt=""
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />
        </div>

        <div style={{ position: 'absolute', left: '54px', top: '593px', width: '1119px', height: '1499px', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ width: '1499px', height: '1119px', transform: 'rotate(-90deg)', position: 'relative' }}>
            <div style={{ position: 'absolute', left: '12.32%', right: '10.09%', top: '11.46%', bottom: '14.26%' }}>
              <img
                src={figmaBigDemoLogo}
                alt=""
                style={{
                  position: 'absolute',
                  height: '252.58%',
                  left: '-46.02%',
                  top: '-71.61%',
                  width: '188.85%',
                  maxWidth: 'none',
                }}
              />
            </div>
          </div>
        </div>
        <div
          className="blur-wave"
          style={{
            position: 'absolute',
            left: '143px',
            top: '672px',
            width: '894px',
            height: '1369px',
            borderRadius: '30px',
            border: '4px solid rgba(255,255,255,0.3)',
            background: 'rgba(255,255,255,0.1)',
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
                  />
                ))}
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
};

const FilterButton: React.FC<{
  label: string;
  left: number;
  top: number;
  width: number;
  active?: boolean;
  onClick: () => void;
}> = ({ label, left, top, width, active = false, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="button-inner-glow"
    style={{
      position: 'absolute',
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: '79px',
      borderRadius: '62px',
      border: '4px solid rgba(255,255,255,0.3)',
      background: active ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.9)',
      color: '#fff',
      fontFamily: textFont,
      fontWeight: 700,
      fontSize: '27px',
      lineHeight: '1',
      cursor: 'pointer',
      boxShadow: active ? 'inset 0 0 30px rgba(255,255,255,0.14)' : 'none',
    }}
  >
    {label}
  </button>
);