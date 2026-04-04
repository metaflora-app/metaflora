import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Footer, Header, ThreeBg } from '../../components/ScreenLayout';
import { LabaFeedCard, LabaFeedPlaceholderCard } from '../../components/laba/LabaFeedCard';
import { Reel, TrackedAccount } from '../../types/laba';
import {
  cacheFavorites,
  cacheTrackedAccounts,
  cacheTrackedReels,
  clearTrackedReelsCache,
  FIGMA_INSTAGRAM_LOGO_URL,
  formatFollowersLabel,
  getCachedFavorites,
  getCachedTrackedAccounts,
  getCachedTrackedReels,
  getInstagramAvatarSources,
  getTelegramUserId,
  getTrackedReels,
  refreshTrackedAccounts,
  scrapeAccountReels,
  setCachedFavoriteState,
  showMessage,
  toggleFavorite,
  untrackAccount,
} from '../../utils/labaApi';
import reelsScrollWindow from '../../assets/laba-main/reels-scroll-window.png';
import trackedAddUnderlay from '../../assets/laba-tracked/tracked-add-underlay.png';
import avatarUnfollowButtonFull from '../../assets/laba-tracked/avatar-unfollow-button-full.png';
import desktopAiAnalysisButton from '../../assets/laba-main-buttons/desktop-ai-analysis.png';

const textFont = 'Cygre, sans-serif';

export const LabaTrackedScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;
  const telegramUserId = React.useMemo(() => getTelegramUserId(), []);
  const navigationState = (location.state as { trackingStarted?: boolean; trackedAccountId?: string } | null) ?? null;
  const preselectedAccountId = React.useMemo(
    () => new URLSearchParams(location.search).get('accountId'),
    [location.search]
  );
  const initialCachedAccounts = React.useMemo(
    () => telegramUserId ? getCachedTrackedAccounts(telegramUserId) : [],
    [telegramUserId]
  );
  const hasInitialCachedAccounts = initialCachedAccounts.length > 0;

  const [accounts, setAccounts] = React.useState<TrackedAccount[]>(initialCachedAccounts);
  const [selectedAccountId, setSelectedAccountId] = React.useState<string | null>(
    preselectedAccountId || initialCachedAccounts[0]?.id || null
  );
  const [reels, setReels] = React.useState<Reel[]>([]);
  const [loadingAccounts, setLoadingAccounts] = React.useState(initialCachedAccounts.length === 0);
  const [loadingReels, setLoadingReels] = React.useState(false);
  const [likedCards, setLikedCards] = React.useState<Set<string>>(
    () => new Set((telegramUserId ? getCachedFavorites(telegramUserId) : []).map((reel) => reel.id))
  );
  const [showAvatarRemoveForId, setShowAvatarRemoveForId] = React.useState<string | null>(null);
  const pendingTrackedAccountIdRef = React.useRef<string | null>(navigationState?.trackingStarted ? navigationState.trackedAccountId ?? null : null);
  const hasShownTrackingSuccessPopupRef = React.useRef(false);
  const accountScrollerRef = React.useRef<HTMLDivElement | null>(null);
  const hasAppliedInitialAccountScrollRef = React.useRef(false);
  const selectionFromScrollRef = React.useRef(false);
  const accountScrollTimeoutRef = React.useRef<number | null>(null);
  const reelsRequestTokenRef = React.useRef(0);
  const hiddenAccountIdsRef = React.useRef<Set<string>>(new Set());

  React.useEffect(() => {
    const fetchAccounts = async () => {
      const userId = telegramUserId;
      if (!userId) return;

      if (!hasInitialCachedAccounts) {
        setLoadingAccounts(true);
      }
      try {
        const trackedAccounts = (await refreshTrackedAccounts(userId)).filter(
          (item) => !hiddenAccountIdsRef.current.has(item.id)
        );
        setAccounts(trackedAccounts);
        setSelectedAccountId((current) => {
          if (preselectedAccountId && trackedAccounts.some((item) => item.id === preselectedAccountId)) {
            return preselectedAccountId;
          }

          return current && trackedAccounts.some((item) => item.id === current) ? current : trackedAccounts[0]?.id || null;
        });
      } catch (error) {
        console.error('Ошибка загрузки аккаунтов:', error);
      } finally {
        setLoadingAccounts(false);
      }
    };

    void fetchAccounts();
  }, [hasInitialCachedAccounts, preselectedAccountId, telegramUserId]);

  React.useEffect(() => {
    if (!selectedAccountId) return;
    const scroller = accountScrollerRef.current;
    const selectedIndex = accounts.findIndex((account) => account.id === selectedAccountId);
    if (!scroller || selectedIndex < 0) return;
    if (selectionFromScrollRef.current) {
      selectionFromScrollRef.current = false;
      return;
    }

    scroller.scrollTo({
      left: selectedIndex * (894 + 22),
      behavior: hasAppliedInitialAccountScrollRef.current ? 'smooth' : 'auto',
    });
    hasAppliedInitialAccountScrollRef.current = true;
  }, [selectedAccountId, accounts.length]);

  React.useEffect(() => {
    if (!telegramUserId) return;
    const cachedFavorites = getCachedFavorites(telegramUserId);
    if (cachedFavorites.length > 0) {
      setLikedCards(new Set(cachedFavorites.map((reel) => reel.id)));
    }
  }, [telegramUserId]);

  React.useEffect(() => {
    const fetchReels = async () => {
      if (!selectedAccountId) {
        setReels([]);
        setLoadingReels(false);
        return;
      }
      const userId = telegramUserId;
      if (!userId) return;

      const cachedTracked = getCachedTrackedReels(userId, selectedAccountId);
      const requestToken = reelsRequestTokenRef.current + 1;
      reelsRequestTokenRef.current = requestToken;
      if (cachedTracked.length > 0) {
        setReels(cachedTracked);
        setLoadingReels(false);
      } else {
        setReels([]);
        setLoadingReels(true);
      }
      try {
        const shouldHydrateTrackedReels = pendingTrackedAccountIdRef.current === selectedAccountId;
        let trackedReels = await getTrackedReels(selectedAccountId, userId);
        if (trackedReels.length === 0 && shouldHydrateTrackedReels) {
          await scrapeAccountReels(selectedAccountId, userId);
          trackedReels = await getTrackedReels(selectedAccountId, userId);
        }
        if (reelsRequestTokenRef.current !== requestToken) {
          return;
        }
        cacheTrackedReels(userId, selectedAccountId, trackedReels);
        setReels(trackedReels);
        if (
          !hasShownTrackingSuccessPopupRef.current &&
          pendingTrackedAccountIdRef.current &&
          pendingTrackedAccountIdRef.current === selectedAccountId &&
          trackedReels.length > 0
        ) {
          hasShownTrackingSuccessPopupRef.current = true;
          pendingTrackedAccountIdRef.current = null;
          showMessage('рилс успешно найдены', 'popup');
        }
      } catch (error: any) {
        if (reelsRequestTokenRef.current !== requestToken) {
          return;
        }
        console.error('Ошибка загрузки reels:', error);
        showMessage(error.message || 'ошибка загрузки reels', 'popup');
      } finally {
        if (reelsRequestTokenRef.current === requestToken) {
          setLoadingReels(false);
        }
      }
    };

    void fetchReels();
  }, [selectedAccountId, telegramUserId]);

  React.useEffect(() => {
    if (!loadingAccounts && accounts.length === 0) {
      navigate('/laba-no-tracked');
    }
  }, [accounts.length, loadingAccounts, navigate]);

  const handleToggleFavorite = async (reelId: string) => {
    const userId = telegramUserId;
    if (!userId) return;
    const targetReel = reels.find((item) => item.id === reelId);
    const currentIsFavorite = likedCards.has(reelId);
    const nextIsFavorite = !currentIsFavorite;
    const nextReels = reels.map((item) => item.id === reelId ? { ...item, isFavorite: nextIsFavorite } : item);

    setReels(nextReels);
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

  const removeAccount = async (accountId: string) => {
    const userId = telegramUserId;
    if (!userId) return;

    const previousAccounts = accounts;
    const previousReels = reels;
    const nextAccounts = accounts.filter((account) => account.id !== accountId);
    const nextSelectedAccountId = selectedAccountId === accountId
      ? nextAccounts[0]?.id || null
      : selectedAccountId;

    hiddenAccountIdsRef.current.add(accountId);
    setAccounts(nextAccounts);
    cacheTrackedAccounts(userId, nextAccounts);
    setSelectedAccountId(nextSelectedAccountId);
    if (selectedAccountId === accountId) {
      setReels([]);
      setLoadingReels(Boolean(nextSelectedAccountId));
    }
    clearTrackedReelsCache(userId, accountId);
    if (pendingTrackedAccountIdRef.current === accountId) {
      pendingTrackedAccountIdRef.current = null;
    }
    setShowAvatarRemoveForId((current) => (current === accountId ? null : current));
    showMessage('аккаунт удален из отслеживаемых', 'popup');

    try {
      await untrackAccount(accountId, userId);
      window.setTimeout(() => {
        void refreshTrackedAccounts(userId).then((freshAccounts) => {
          const visibleAccounts = freshAccounts.filter((item) => !hiddenAccountIdsRef.current.has(item.id));
          setAccounts(visibleAccounts);
          cacheTrackedAccounts(userId, visibleAccounts);
          setSelectedAccountId((current) => (
            current && visibleAccounts.some((item) => item.id === current)
              ? current
              : visibleAccounts[0]?.id || null
          ));
        }).catch((error) => {
          console.error('Ошибка синхронизации tracked accounts после удаления:', error);
        });
      }, 900);
    } catch (error) {
      console.error('Ошибка удаления аккаунта:', error);
      hiddenAccountIdsRef.current.delete(accountId);
      setAccounts(previousAccounts);
      cacheTrackedAccounts(userId, previousAccounts);
      setSelectedAccountId(selectedAccountId);
      if (selectedAccountId === accountId) {
        setReels(previousReels);
        setLoadingReels(false);
      }
    }
  };

  const handleAccountScrollerScroll = React.useCallback(() => {
    if (accountScrollTimeoutRef.current !== null) {
      window.clearTimeout(accountScrollTimeoutRef.current);
    }

    accountScrollTimeoutRef.current = window.setTimeout(() => {
      const scroller = accountScrollerRef.current;
      if (!scroller || accounts.length === 0) {
        accountScrollTimeoutRef.current = null;
        return;
      }

      const step = 894 + 22;
      const nextIndex = Math.max(0, Math.min(accounts.length - 1, Math.round(scroller.scrollLeft / step)));
      const nextAccountId = accounts[nextIndex]?.id ?? null;

      if (nextAccountId && nextAccountId !== selectedAccountId) {
        selectionFromScrollRef.current = true;
        setSelectedAccountId(nextAccountId);
      }

      accountScrollTimeoutRef.current = null;
    }, 110);
  }, [accounts, selectedAccountId]);

  React.useEffect(() => {
    return () => {
      if (accountScrollTimeoutRef.current !== null) {
        window.clearTimeout(accountScrollTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      onClick={() => setShowAvatarRemoveForId(null)}
      style={{ position: 'relative', width: '100vw', minHeight: '100vh', background: '#020101', overflow: 'hidden' }}
    >
      <div style={{ position: 'relative', width: '1180px', minHeight: '2550px', transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <ThreeBg />
        <Header onLogoClick={() => navigate('/main-dashboard-premium')} />

        <div style={{ position: 'absolute', left: '85px', top: '193px', width: '1020px' }}>
          <p style={{ margin: 0, fontFamily: textFont, fontWeight: 700, fontSize: '80px', lineHeight: '1', color: '#fff' }}>
            отслеживание контента
          </p>
        </div>

        <div style={{ position: 'absolute', left: '85px', top: '273px', width: '820px' }}>
          <p style={{ margin: 0, fontFamily: textFont, fontWeight: 400, fontSize: '40px', lineHeight: '1', color: '#fff' }}>
            следите за добавленными аккаунтами
          </p>
        </div>

        <div
          ref={accountScrollerRef}
          className="laba-feed-scroll"
          onScroll={handleAccountScrollerScroll}
          style={{
            position: 'absolute',
            left: '143px',
            top: '366px',
            width: '894px',
            height: '268px',
            overflowX: 'auto',
            overflowY: 'hidden',
            scrollSnapType: 'x mandatory',
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div style={{ display: 'flex', gap: '22px', minWidth: 'max-content' }}>
            {loadingAccounts
              ? Array.from({ length: 2 }).map((_, index) => (
                  <div key={index} style={{ flex: '0 0 894px', scrollSnapAlign: 'start', scrollSnapStop: 'always' }}>
                    <TrackedAccountCardSkeleton />
                  </div>
                ))
              : accounts.map((account) => (
                  <div
                    key={account.id}
                    style={{ flex: '0 0 894px', scrollSnapAlign: 'start', scrollSnapStop: 'always' }}
                  >
                    <TrackedAccountCard
                      account={account}
                      selected={selectedAccountId === account.id}
                      onSelect={() => setSelectedAccountId(account.id)}
                      onRemove={() => void removeAccount(account.id)}
                      showRemoveOverlay={showAvatarRemoveForId === account.id}
                      onAvatarClick={() => setShowAvatarRemoveForId((current) => (current === account.id ? null : account.id))}
                    />
                  </div>
                ))}
          </div>
        </div>

        <div style={{ position: 'absolute', left: '141px', top: '672px', width: '894px', height: '1369px', pointerEvents: 'none' }}>
          <img src={reelsScrollWindow} alt="" style={{ width: '100%', height: '100%', objectFit: 'fill' }} />
        </div>
        <div
          className="laba-feed-scroll"
          style={{
            position: 'absolute',
            left: '141px',
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
            {loadingReels
              ? Array.from({ length: 8 }).map((_, index) => <LabaFeedPlaceholderCard key={index} />)
              : reels.map((reel) => (
                  <LabaFeedCard
                    key={reel.id}
                    reel={reel}
                    isFavorite={likedCards.has(reel.id)}
                    onToggleFavorite={handleToggleFavorite}
                    onOpenAnalysis={() => navigate('/laba-analysis', { state: { reel: { ...reel, isFavorite: likedCards.has(reel.id) } } })}
                    onAction={() => {
                      if (selectedAccountId) void removeAccount(selectedAccountId);
                    }}
                    actionLabel="не следить"
                    actionVariant="light"
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

const TrackedAccountCard: React.FC<{
  account: TrackedAccount;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  showRemoveOverlay: boolean;
  onAvatarClick: () => void;
}> = ({ account, selected, onSelect, onRemove, showRemoveOverlay, onAvatarClick }) => {
  const avatarSources = React.useMemo(
    () => getInstagramAvatarSources(account.username, account.profilePhotoUrl),
    [account.profilePhotoUrl, account.username]
  );
  const [avatarIndex, setAvatarIndex] = React.useState(0);

  React.useEffect(() => {
    setAvatarIndex(0);
  }, [avatarSources]);

  const avatarUrl = avatarSources[avatarIndex] || null;

  return (
    <div
      onClick={onSelect}
      className="blur-wave"
      style={{
        position: 'relative',
        width: '894px',
        height: '268px',
        background: 'transparent',
        cursor: 'pointer',
        overflow: 'hidden',
        opacity: selected ? 1 : 0.92,
      }}
    >
      <img src={trackedAddUnderlay} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill', pointerEvents: 'none' }} />
      <div
        style={{
          position: 'absolute',
          left: '31px',
          top: '31px',
          width: '832px',
          height: '206px',
          background: '#000',
          border: '4px solid rgba(255,255,255,0.3)',
          borderRadius: '20px',
          boxSizing: 'border-box',
          pointerEvents: 'none',
        }}
      />

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onAvatarClick();
        }}
        style={{ position: 'absolute', left: '70px', top: '36px', width: '190px', height: '190px', border: 'none', borderRadius: '50%', overflow: 'visible', padding: 0, background: 'transparent', cursor: 'pointer', zIndex: 6 }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            overflow: 'hidden',
          }}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={account.username}
              loading="lazy"
              decoding="async"
              onError={() => {
                if (avatarIndex < avatarSources.length - 1) {
                  setAvatarIndex((current) => current + 1);
                  return;
                }
                setAvatarIndex(avatarSources.length);
              }}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : null}
        </div>
        {showRemoveOverlay ? (
          <img
            src={avatarUnfollowButtonFull}
            alt="не следить"
            onClick={(event) => {
              event.stopPropagation();
              onRemove();
            }}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', cursor: 'pointer', zIndex: 7 }}
          />
        ) : null}
      </button>

      <div style={{ position: 'absolute', left: '278px', top: '47px', width: '64px', height: '78px', overflow: 'hidden', opacity: 0.6 }}>
        <img src={FIGMA_INSTAGRAM_LOGO_URL} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      </div>

      <div style={{ position: 'absolute', left: '296px', top: '118px', width: '500px', height: '42px', display: 'flex', alignItems: 'center', fontFamily: textFont, fontWeight: 700, fontSize: '52px', lineHeight: '1', color: '#fff', textAlign: 'left', whiteSpace: 'nowrap' }}>
        @{account.username}
      </div>

      <div style={{ position: 'absolute', left: '293px', top: '170px', width: '500px', height: '26px', display: 'flex', alignItems: 'center', fontFamily: textFont, fontWeight: 400, fontSize: '32px', lineHeight: '1', color: '#fff', textAlign: 'left', whiteSpace: 'nowrap' }}>
        {formatFollowersLabel(account.followersCount)}
      </div>
    </div>
  );
};

const TrackedAccountCardSkeleton: React.FC = () => (
  <div
    className="blur-wave"
    style={{
      width: '894px',
      height: '268px',
      borderRadius: '30px',
      border: '4px solid rgba(255,255,255,0.2)',
      background: 'rgba(255,255,255,0.08)',
      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    }}
  />
);
