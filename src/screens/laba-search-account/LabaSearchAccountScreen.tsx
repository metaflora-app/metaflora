import React from 'react';
import { useNavigate } from 'react-router-dom';
import { InstagramLogoMark } from '../../components/laba/InstagramLogoMark';
import { LabaSearchInput } from '../../components/laba/LabaSearchInput';
import { useUIState } from '../../contexts/UIStateContext';
import {
  findTrackedAccountByUsername,
  formatFollowersLabel,
  getCachedTrackedAccounts,
  getInstagramAvatarSources,
  getTelegramUserId,
  refreshTrackedAccounts,
  searchAccount,
  showMessage,
  trackAccount,
} from '../../utils/labaApi';
import type { InstagramAccount } from '../../types/laba';
import { Footer, Header, ThreeBg } from '../../components/ScreenLayout';
import metacoinSmall from '../../assets/metacoins-redesign/новый метакоин маленький.png';
import searchIcon from '../../assets/laba-icons/иконка поиска.png';
import searchUnderlay from '../../assets/laba-search-account/главная подложка новая.png';

const textFont = 'Cygre, sans-serif';

export const LabaSearchAccountScreen: React.FC = () => {
  const navigate = useNavigate();
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;
  const {
    labaAccountLinkQuery,
    setLabaAccountLinkQuery,
    labaAccountNicknameQuery,
    setLabaAccountNicknameQuery,
  } = useUIState();
  const [foundAccount, setFoundAccount] = React.useState<InstagramAccount | null>(null);
  const [searching, setSearching] = React.useState(false);
  const [tracking, setTracking] = React.useState(false);
  const [hasSearchAttempted, setHasSearchAttempted] = React.useState(false);
  const [isLinkFocused, setIsLinkFocused] = React.useState(false);
  const [isNicknameFocused, setIsNicknameFocused] = React.useState(false);
  const [trackedAccounts, setTrackedAccounts] = React.useState(() => {
    const userId = getTelegramUserId();
    return userId ? getCachedTrackedAccounts(userId) : [];
  });

  const avatarSources = React.useMemo(() => {
    if (!foundAccount) return [];
    return getInstagramAvatarSources(foundAccount.username, foundAccount.profilePhotoUrl);
  }, [foundAccount]);
  const [avatarIndex, setAvatarIndex] = React.useState(0);

  React.useEffect(() => {
    setAvatarIndex(0);
  }, [avatarSources]);

  const avatarUrl = avatarSources[avatarIndex] || null;
  const foundTrackedAccount = React.useMemo(
    () => findTrackedAccountByUsername(trackedAccounts, foundAccount?.username),
    [foundAccount?.username, trackedAccounts]
  );

  React.useEffect(() => {
    const userId = getTelegramUserId();
    if (!userId) return;

    void refreshTrackedAccounts(userId)
      .then(setTrackedAccounts)
      .catch((error) => {
        console.error('Ошибка загрузки tracked accounts:', error);
      });
  }, []);

  const handleSearch = async () => {
    const nicknameQuery = labaAccountNicknameQuery.trim().replace(/^@+/, '');
    const linkQuery = labaAccountLinkQuery.trim();
    const query = nicknameQuery || linkQuery;
    if (!query) {
      window.Telegram?.WebApp?.showPopup?.({ message: 'введите ссылку или ник аккаунта' });
      return;
    }

    try {
      setHasSearchAttempted(true);
      setSearching(true);
      setFoundAccount(null);
      showMessage('начался поиск аккаунта. Пожалуйста, подождите 10 секунд', 'popup');
      const account = await searchAccount(query);
      setFoundAccount(account);
      showMessage('аккаунт успешно найден', 'popup');
    } catch (error: any) {
      console.error('Search account error:', error);
      setFoundAccount(null);
      showMessage(error.message || 'ничего не найдено', 'popup');
    } finally {
      setSearching(false);
    }
  };

  const handleStartTracking = async () => {
    if (!foundAccount) return;
    const userId = getTelegramUserId();
    if (!userId) return;

    if (foundTrackedAccount) {
      navigate(`/laba-tracked?accountId=${encodeURIComponent(foundTrackedAccount.id)}`, {
        state: {
          trackedAccountId: foundTrackedAccount.id,
        },
      });
      return;
    }

    try {
      setTracking(true);
      showMessage('ИИ-агент начал собирать рилс. Пожалуйста, подождите 30-40 секунд', 'popup');
      const result = await trackAccount(foundAccount.username, userId);
      navigate(`/laba-tracked?accountId=${encodeURIComponent(result.accountId)}`, {
        state: {
          trackingStarted: true,
          trackedAccountId: result.accountId,
        },
      });
    } catch (error: any) {
      console.error('Track account error:', error);
      showMessage(error.message || 'ошибка отслеживания', 'popup');
    } finally {
      setTracking(false);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100vw', minHeight: '100vh', background: '#020101', overflow: 'hidden' }}>
      <div style={{ position: 'relative', width: '1180px', minHeight: '2550px', transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <ThreeBg />
        <Header onLogoClick={() => navigate('/main-dashboard-premium')} />

        <div style={{ position: 'absolute', left: '85px', top: '193px', width: '1020px' }}>
          <p style={{ margin: 0, fontFamily: textFont, fontWeight: 700, fontSize: '80px', lineHeight: '1', color: '#fff' }}>поиск аккаунта</p>
        </div>

        <div style={{ position: 'absolute', left: '85px', top: '273px', width: '882px' }}>
          <p style={{ margin: 0, fontFamily: textFont, fontWeight: 400, fontSize: '40px', lineHeight: '1', color: '#fff' }}>
            найдите аккаунт для отслеживания: вставьте ссылку или введите юзернейм
          </p>
        </div>

        <img
          src={searchUnderlay}
          alt=""
          style={{
            position: 'absolute',
            left: '27px',
            top: '397px',
            width: '1162px',
            height: '1646px',
            objectFit: 'contain',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            position: 'absolute',
            left: '175px',
            top: '437px',
            width: '826px',
            height: '1569px',
            backdropFilter: 'blur(50px)',
            background: 'black',
            border: '4px solid rgba(255,255,255,0.3)',
            borderRadius: '30px',
            overflow: 'hidden',
          }}
        >
          <p style={{ position: 'absolute', left: '41px', top: '63px', margin: 0, fontFamily: textFont, fontWeight: 700, fontSize: '40px', lineHeight: '1', color: '#fff' }}>
            добавить ссылку
          </p>

          <div
            style={{
              position: 'absolute',
              left: '37px',
              top: '136px',
              width: '755px',
              height: '79px',
              transform: isLinkFocused ? 'scale(1.04)' : 'scale(1)',
              transformOrigin: 'center',
              transition: 'transform 560ms cubic-bezier(0.22, 1, 0.36, 1), filter 260ms ease',
              filter: isLinkFocused ? 'brightness(1.08)' : 'none',
            }}
          >
            <LabaSearchInput
              value={labaAccountLinkQuery}
              onChange={setLabaAccountLinkQuery}
              onEnter={() => void handleSearch()}
              onFocusChange={setIsLinkFocused}
              placeholder="вставьте ссылку напрямую"
              iconSrc={searchIcon}
              style={{
                left: 0,
                top: 0,
                width: '755px',
                height: '79px',
              }}
            />
          </div>

          <p style={{ position: 'absolute', left: '41px', top: '241px', margin: 0, fontFamily: textFont, fontWeight: 700, fontSize: '40px', lineHeight: '1', color: '#fff' }}>
            найти по нику
          </p>

          <div
            style={{
              position: 'absolute',
              left: '37px',
              top: '308px',
              width: '755px',
              height: '79px',
              transform: isNicknameFocused ? 'scale(1.04)' : 'scale(1)',
              transformOrigin: 'center',
              transition: 'transform 560ms cubic-bezier(0.22, 1, 0.36, 1), filter 260ms ease',
              filter: isNicknameFocused ? 'brightness(1.08)' : 'none',
            }}
          >
            <LabaSearchInput
              value={labaAccountNicknameQuery}
              onChange={setLabaAccountNicknameQuery}
              onEnter={() => void handleSearch()}
              onFocusChange={setIsNicknameFocused}
              placeholder="напишите юзернейм"
              iconSrc={searchIcon}
              style={{
                left: 0,
                top: 0,
                width: '755px',
                height: '79px',
              }}
            />
          </div>

          <button
            type="button"
            onClick={() => void handleSearch()}
            className="premium-button-shell button-inner-glow motion-press-grow"
            style={{
              position: 'absolute',
              left: '290px',
              top: '417px',
              width: '247px',
              height: '80px',
              borderRadius: '62px',
              color: '#fff',
              fontFamily: textFont,
              fontWeight: 700,
              fontSize: '27px',
              lineHeight: '1',
              cursor: searching ? 'default' : 'pointer',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: searching ? 0.85 : 1,
              overflow: 'hidden',
            }}
            disabled={searching}
          >
            <div className="premium-button-inner" />
            <div className="premium-button-content" style={{ position: 'relative', width: '100%', height: '100%' }}>
              <span
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: '1',
                  textAlign: 'center',
                  transform: 'translateY(-4px)',
                }}
              >
                найти
              </span>
            </div>
          </button>

          {hasSearchAttempted ? (
            <p style={{ position: 'absolute', left: '41px', top: '547px', margin: 0, fontFamily: textFont, fontWeight: 700, fontSize: '40px', lineHeight: '1', color: '#fff' }}>
              результат
            </p>
          ) : null}

          {hasSearchAttempted && searching ? (
            <SearchAccountLoadingState />
          ) : null}

          {hasSearchAttempted && foundAccount ? (
            <>
              <div style={{ position: 'absolute', left: '41px', top: '620px', width: '190px', height: '190px', borderRadius: '50%', overflow: 'hidden', background: 'rgba(255,255,255,0.1)' }}>
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={foundAccount.username}
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

              <InstagramLogoMark style={{ left: '247px', top: '627px' }} />

              <p style={{ position: 'absolute', left: '257px', top: '700px', margin: 0, width: '334px', fontFamily: textFont, fontWeight: 700, fontSize: '40px', lineHeight: '42px', color: '#fff', whiteSpace: 'nowrap' }}>
                @{foundAccount.username}
              </p>

              <p style={{ position: 'absolute', left: '254px', top: '746px', margin: 0, width: '350px', fontFamily: textFont, fontWeight: 400, fontSize: '32px', lineHeight: '1', color: '#fff', whiteSpace: 'nowrap' }}>
                {formatFollowersLabel(foundAccount.followersCount)}
              </p>

              <button
                type="button"
                onClick={() => void handleStartTracking()}
                className="premium-button-shell button-inner-glow motion-press-grow"
                style={{
                  position: 'absolute',
                  left: '150px',
                  top: '878px',
                  width: '530px',
                  height: '139px',
                  borderRadius: '62px',
                  color: '#fff',
                  cursor: tracking ? 'default' : 'pointer',
                  padding: 0,
                  overflow: 'hidden',
                }}
                disabled={tracking}
              >
                <div className="premium-button-inner" />
                <div className="premium-button-content" style={{ position: 'relative', width: '100%', height: '100%' }}>
                  <div
                    style={{
                      position: 'absolute',
                      left: '29px',
                      top: '45px',
                      width: '473px',
                      fontFamily: textFont,
                      fontWeight: 700,
                      fontSize: '32px',
                      lineHeight: '1',
                      textAlign: 'center',
                      whiteSpace: 'pre',
                    }}
                  >
                    {foundTrackedAccount ? 'к аккаунту' : 'начать отслеживание    100'}
                  </div>
                  {!foundTrackedAccount ? (
                    <div style={{ position: 'absolute', left: '402px', top: '52px', width: '25px', height: '25px' }}>
                      <img
                        src={metacoinSmall}
                        alt=""
                        style={{ width: '25px', height: '25px', objectFit: 'contain', display: 'block' }}
                      />
                    </div>
                  ) : null}
                </div>
              </button>

              <div
                style={{
                  position: 'absolute',
                  left: '177px',
                  top: '1028px',
                  width: '477px',
                  height: '64px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: textFont,
                  fontWeight: 400,
                  fontSize: '32px',
                  lineHeight: '32px',
                  color: 'rgba(255,255,255,0.6)',
                  textAlign: 'center',
                }}
              >
                <span>вы можете пополнить баланс</span>
                <span>в личном кабинете</span>
              </div>
            </>
          ) : null}
        </div>

        <Footer />
      </div>
    </div>
  );
};

const SearchAccountLoadingState: React.FC = () => (
  <>
    <div
      className="blur-shimmer-bar"
      style={{
        position: 'absolute',
        left: '41px',
        top: '620px',
        width: '190px',
        height: '190px',
        borderRadius: '50%',
      }}
    />

    <div
      className="blur-shimmer-bar"
      style={{
        position: 'absolute',
        left: '247px',
        top: '632px',
        width: '58px',
        height: '70px',
        opacity: 0.72,
      }}
    />

    <div
      className="blur-shimmer-bar"
      style={{
        position: 'absolute',
        left: '257px',
        top: '706px',
        width: '246px',
        height: '40px',
      }}
    />

    <div
      className="blur-shimmer-bar"
      style={{
        position: 'absolute',
        left: '254px',
        top: '760px',
        width: '316px',
        height: '28px',
        opacity: 0.78,
      }}
    />

    <div
      className="blur-shimmer-frame"
      style={{
        position: 'absolute',
        left: '150px',
        top: '878px',
        width: '530px',
        height: '139px',
        padding: '30px 34px',
      }}
    >
      <div className="blur-shimmer-bar" style={{ width: '100%', height: '52px', borderRadius: '62px' }} />
    </div>

    <div
      className="blur-shimmer-bar"
      style={{
        position: 'absolute',
        left: '220px',
        top: '1041px',
        width: '388px',
        height: '24px',
        opacity: 0.56,
      }}
    />

    <div
      className="blur-shimmer-bar"
      style={{
        position: 'absolute',
        left: '260px',
        top: '1077px',
        width: '308px',
        height: '24px',
        opacity: 0.44,
      }}
    />
  </>
);
