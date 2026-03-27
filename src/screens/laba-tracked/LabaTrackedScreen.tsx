import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Footer, Header, ThreeBg } from '../../components/ScreenLayout';
import { LabaFeedCard, LabaFeedPlaceholderCard } from '../../components/laba/LabaFeedCard';
import { Reel, TrackedAccount } from '../../types/laba';
import {
  formatFollowersLabel,
  getInstagramAvatarSources,
  getTelegramUserId,
  getTrackedAccounts,
  getTrackedReels,
  scrapeAccountReels,
  showMessage,
  toggleFavorite,
  untrackAccount,
} from '../../utils/labaApi';
import instaLogoIcon from '../../assets/laba-icons/лого инста.png';
import reelsScrollWindow from '../../assets/laba-main/reels-scroll-window.png';
import trackedAddUnderlay from '../../assets/laba-tracked/tracked-add-underlay.png';
import avatarUnfollowButton from '../../assets/laba-tracked/avatar-unfollow-button.png';
import desktopAiAnalysisButton from '../../assets/laba-main-buttons/desktop-ai-analysis.png';

const textFont = 'Cygre, sans-serif';

export const LabaTrackedScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;
  const navigationState = (location.state as { trackingStarted?: boolean; trackedAccountId?: string } | null) ?? null;
  const preselectedAccountId = React.useMemo(
    () => new URLSearchParams(location.search).get('accountId'),
    [location.search]
  );

  const [accounts, setAccounts] = React.useState<TrackedAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = React.useState<string | null>(null);
  const [reels, setReels] = React.useState<Reel[]>([]);
  const [loadingAccounts, setLoadingAccounts] = React.useState(true);
  const [loadingReels, setLoadingReels] = React.useState(false);
  const [likedCards, setLikedCards] = React.useState<Set<string>>(new Set());
  const [showAvatarRemoveForId, setShowAvatarRemoveForId] = React.useState<string | null>(null);
  const hasShownTrackingStartPopupRef = React.useRef(false);
  const pendingTrackedAccountIdRef = React.useRef<string | null>(navigationState?.trackedAccountId ?? null);
  const hasShownTrackingSuccessPopupRef = React.useRef(false);

  React.useEffect(() => {
    if (!navigationState?.trackingStarted || hasShownTrackingStartPopupRef.current) return;
    hasShownTrackingStartPopupRef.current = true;
    showMessage('ИИ-агент начал собирать рилс. Пожалуйста, подождите 30-40 секунд', 'popup');
  }, [navigationState?.trackingStarted]);

  React.useEffect(() => {
    const fetchAccounts = async () => {
      const userId = getTelegramUserId();
      if (!userId) return;

      setLoadingAccounts(true);
      try {
        const trackedAccounts = await getTrackedAccounts(userId);
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
  }, [preselectedAccountId]);

  React.useEffect(() => {
    const fetchReels = async () => {
      if (!selectedAccountId) return;
      const userId = getTelegramUserId();
      if (!userId) return;

      setLoadingReels(true);
      try {
        let trackedReels = await getTrackedReels(selectedAccountId, userId);
        if (trackedReels.length === 0) {
          await scrapeAccountReels(selectedAccountId, userId);
          trackedReels = await getTrackedReels(selectedAccountId, userId);
        }
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
        console.error('Ошибка загрузки reels:', error);
        showMessage(error.message || 'ошибка загрузки reels', 'popup');
      } finally {
        setLoadingReels(false);
      }
    };

    void fetchReels();
  }, [selectedAccountId]);

  React.useEffect(() => {
    if (!loadingAccounts && accounts.length === 0) {
      navigate('/laba-no-tracked');
    }
  }, [accounts.length, loadingAccounts, navigate]);

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

  const removeAccount = async (accountId: string) => {
    const userId = getTelegramUserId();
    if (!userId) return;

    try {
      await untrackAccount(accountId, userId);
      const nextAccounts = accounts.filter((account) => account.id !== accountId);
      setAccounts(nextAccounts);
      setSelectedAccountId(nextAccounts[0]?.id || null);
      setShowAvatarRemoveForId((current) => (current === accountId ? null : current));
      showMessage('аккаунт удален из отслеживаемых', 'popup');
    } catch (error) {
      console.error('Ошибка удаления аккаунта:', error);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100vw', minHeight: '100vh', background: '#020101', overflow: 'hidden' }}>
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

        <div style={{ position: 'absolute', left: '143px', top: '366px', width: '894px', height: '268px', overflowX: 'auto', overflowY: 'hidden' }}>
          <div style={{ display: 'flex', gap: '22px', minWidth: 'max-content', paddingRight: '180px' }}>
            {loadingAccounts
              ? Array.from({ length: 2 }).map((_, index) => <TrackedAccountCardSkeleton key={index} />)
              : accounts.map((account) => (
                  <TrackedAccountCard
                    key={account.id}
                    account={account}
                    selected={selectedAccountId === account.id}
                    onSelect={() => setSelectedAccountId(account.id)}
                    onRemove={() => void removeAccount(account.id)}
                    showRemoveOverlay={showAvatarRemoveForId === account.id}
                    onAvatarClick={() => setShowAvatarRemoveForId((current) => (current === account.id ? null : account.id))}
                  />
                ))}
          </div>
        </div>

        <div style={{ position: 'absolute', left: '141px', top: '672px', width: '894px', height: '1369px', pointerEvents: 'none' }}>
          <img src={reelsScrollWindow} alt="" style={{ width: '100%', height: '100%', objectFit: 'fill' }} />
        </div>
        <div
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
              ? Array.from({ length: 40 }).map((_, index) => <LabaFeedPlaceholderCard key={index} />)
              : reels.map((reel) => (
                  <LabaFeedCard
                    key={reel.id}
                    reel={reel}
                    isFavorite={likedCards.has(reel.id)}
                    onToggleFavorite={handleToggleFavorite}
                    onOpenAnalysis={() => navigate('/laba-analysis', { state: { reel } })}
                    onAction={() => {
                      if (selectedAccountId) void removeAccount(selectedAccountId);
                    }}
                    actionLabel="не следить"
                    actionVariant="light"
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
        style={{ position: 'absolute', left: '70px', top: '43px', width: '190px', height: '190px', border: 'none', borderRadius: '50%', overflow: 'hidden', padding: 0, background: 'transparent', cursor: 'pointer' }}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={account.username}
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
        {showRemoveOverlay ? (
          <img
            src={avatarUnfollowButton}
            alt="не следить"
            onClick={(event) => {
              event.stopPropagation();
              onRemove();
            }}
            style={{ position: 'absolute', left: '39px', top: '39px', width: '112px', height: '112px', objectFit: 'contain', cursor: 'pointer' }}
          />
        ) : null}
      </button>

      <div style={{ position: 'absolute', left: '278px', top: '47px', width: '64px', height: '78px', overflow: 'hidden', opacity: 0.6 }}>
        <img src={instaLogoIcon} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
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
