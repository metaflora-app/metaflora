import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Footer, Header, ThreeBg } from '../../components/ScreenLayout';
import { LabaFeedCard, LabaFeedPlaceholderCard } from '../../components/laba/LabaFeedCard';
import { Reel, TrackedAccount } from '../../types/laba';
import {
  convertInstagramImageUrl,
  getTelegramUserId,
  getTrackedAccounts,
  getTrackedReels,
  scrapeAccountReels,
  showMessage,
  toggleFavorite,
  untrackAccount,
} from '../../utils/labaApi';
import instaLogoIcon from '../../assets/laba-icons/лого инста.png';
import reelsScrollWindowNew from '../../assets/laba-main/reels-scroll-window-new.png';

const textFont = 'Cygre, sans-serif';

export const LabaTrackedScreen: React.FC = () => {
  const navigate = useNavigate();
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;

  const [accounts, setAccounts] = React.useState<TrackedAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = React.useState<string | null>(null);
  const [reels, setReels] = React.useState<Reel[]>([]);
  const [loadingAccounts, setLoadingAccounts] = React.useState(true);
  const [loadingReels, setLoadingReels] = React.useState(false);
  const [likedCards, setLikedCards] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    const fetchAccounts = async () => {
      const userId = getTelegramUserId();
      if (!userId) return;

      setLoadingAccounts(true);
      try {
        const trackedAccounts = await getTrackedAccounts(userId);
        setAccounts(trackedAccounts);
        setSelectedAccountId((current) => current && trackedAccounts.some((item) => item.id === current) ? current : trackedAccounts[0]?.id || null);
      } catch (error) {
        console.error('Ошибка загрузки аккаунтов:', error);
      } finally {
        setLoadingAccounts(false);
      }
    };

    void fetchAccounts();
  }, []);

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

  const removeAccount = async (accountId: string) => {
    const userId = getTelegramUserId();
    if (!userId) return;

    try {
      await untrackAccount(accountId, userId);
      const nextAccounts = accounts.filter((account) => account.id !== accountId);
      setAccounts(nextAccounts);
      setSelectedAccountId(nextAccounts[0]?.id || null);
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

        <div
          style={{
            position: 'absolute',
            left: '143px',
            top: '366px',
            width: '894px',
            height: '268px',
            overflowX: 'auto',
            overflowY: 'hidden',
          }}
        >
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
                  />
                ))}
          </div>
        </div>

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
            {loadingReels
              ? Array.from({ length: 2 }).map((_, index) => <LabaFeedPlaceholderCard key={index} />)
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
}> = ({ account, selected, onSelect, onRemove }) => {
  const avatarUrl = convertInstagramImageUrl(account.profilePhotoUrl) || account.profilePhotoUrl;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="blur-wave"
      style={{
        position: 'relative',
        width: '522px',
        height: '162px',
        borderRadius: '30px',
        border: '4px solid rgba(255,255,255,0.3)',
        background: selected ? 'rgba(255,255,255,0.16)' : '#000',
        cursor: 'pointer',
      }}
    >
      <div style={{ position: 'absolute', left: '20px', top: '15px', width: '98px', height: '98px', borderRadius: '50%', overflow: 'hidden', background: 'rgba(255,255,255,0.1)' }}>
        {avatarUrl ? <img src={avatarUrl} alt={account.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
      </div>
      <img src={instaLogoIcon} alt="" style={{ position: 'absolute', left: '132px', top: '13px', width: '42px', height: '51px', opacity: 0.6 }} />
      <div style={{ position: 'absolute', left: '131px', top: '60px', width: '240px', fontFamily: textFont, fontWeight: 700, fontSize: '27px', lineHeight: '1', color: '#fff', textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        @{account.username}
      </div>
      <div style={{ position: 'absolute', left: '131px', top: '95px', width: '250px', fontFamily: textFont, fontWeight: 400, fontSize: '24px', lineHeight: '1', color: '#fff', textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {account.followersCount.toLocaleString('ru-RU')} подписчиков
      </div>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onRemove();
        }}
        className="button-inner-glow"
        style={{
          position: 'absolute',
          right: '18px',
          top: '12px',
          width: '126px',
          height: '54px',
          borderRadius: '62px',
          border: '4px solid rgba(255,255,255,0.3)',
          background: 'rgba(0,0,0,0.9)',
          color: '#fff',
          fontFamily: textFont,
          fontWeight: 700,
          fontSize: '20px',
          cursor: 'pointer',
        }}
      >
        убрать
      </button>
    </button>
  );
};

const TrackedAccountCardSkeleton: React.FC = () => (
  <div
    className="blur-wave"
    style={{
      width: '522px',
      height: '162px',
      borderRadius: '30px',
      border: '4px solid rgba(255,255,255,0.2)',
      background: 'rgba(255,255,255,0.08)',
      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    }}
  />
);
