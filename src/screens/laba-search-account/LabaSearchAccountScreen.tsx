import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LabaSearchInput } from '../../components/laba/LabaSearchInput';
import { useUIState } from '../../contexts/UIStateContext';
import { formatFollowersLabel, getInstagramAvatarSources, getTelegramUserId, searchAccount, showMessage, trackAccount } from '../../utils/labaApi';
import type { InstagramAccount } from '../../types/laba';
import { Footer, Header, ThreeBg } from '../../components/ScreenLayout';
import metacoinSmall from '../../assets/metacoins-redesign/новый метакоин маленький.png';
import searchUnderlay from '../../assets/laba-search-account/главная подложка новая.png';

const textFont = 'Cygre, sans-serif';
const searchIcon = 'https://www.figma.com/api/mcp/asset/2b95cc27-5ad3-49a5-8c6c-2782419c868b';
const instagramLogo = 'https://www.figma.com/api/mcp/asset/01c1f7bc-b497-447d-926a-d8ba816a7ad2';

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

  const avatarSources = React.useMemo(() => {
    if (!foundAccount) return [];
    return getInstagramAvatarSources(foundAccount.username, foundAccount.profilePhotoUrl);
  }, [foundAccount]);
  const [avatarIndex, setAvatarIndex] = React.useState(0);

  React.useEffect(() => {
    setAvatarIndex(0);
  }, [avatarSources]);

  const avatarUrl = avatarSources[avatarIndex] || null;

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

          <LabaSearchInput
            value={labaAccountLinkQuery}
            onChange={setLabaAccountLinkQuery}
            onEnter={() => void handleSearch()}
            placeholder="вставьте ссылку напрямую"
            iconSrc={searchIcon}
            style={{
              left: '37px',
              top: '136px',
              width: '755px',
              height: '79px',
            }}
          />

          <p style={{ position: 'absolute', left: '41px', top: '241px', margin: 0, fontFamily: textFont, fontWeight: 700, fontSize: '40px', lineHeight: '1', color: '#fff' }}>
            найти по нику
          </p>

          <LabaSearchInput
            value={labaAccountNicknameQuery}
            onChange={setLabaAccountNicknameQuery}
            onEnter={() => void handleSearch()}
            placeholder="напишите юзернейм"
            iconSrc={searchIcon}
            style={{
              left: '37px',
              top: '308px',
              width: '755px',
              height: '79px',
            }}
          />

          <button
            type="button"
            onClick={() => void handleSearch()}
            className="button-inner-glow"
            style={{
              position: 'absolute',
              left: '290px',
              top: '417px',
              width: '247px',
              height: '80px',
              borderRadius: '62px',
              border: '4px solid rgba(255,255,255,0.3)',
              background: 'rgba(0,0,0,0.9)',
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
            }}
            disabled={searching}
          >
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '29px',
                lineHeight: '1',
                textAlign: 'center',
                position: 'relative',
                top: '-4px',
              }}
            >
              найти
            </span>
          </button>

          {hasSearchAttempted ? (
            <p style={{ position: 'absolute', left: '41px', top: '547px', margin: 0, fontFamily: textFont, fontWeight: 700, fontSize: '40px', lineHeight: '1', color: '#fff' }}>
              результат
            </p>
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

              <div style={{ position: 'absolute', left: '247px', top: '627px', width: '64px', height: '78px', overflow: 'hidden', opacity: 0.6 }}>
                <img
                  src={instagramLogo}
                  alt=""
                  style={{ position: 'absolute', height: '339.84%', left: '-56.27%', top: '-118.33%', width: '620.89%', maxWidth: 'none' }}
                />
              </div>

              <p style={{ position: 'absolute', left: '257px', top: '700px', margin: 0, width: '334px', fontFamily: textFont, fontWeight: 700, fontSize: '40px', lineHeight: '42px', color: '#fff', whiteSpace: 'nowrap' }}>
                @{foundAccount.username}
              </p>

              <p style={{ position: 'absolute', left: '254px', top: '746px', margin: 0, width: '350px', fontFamily: textFont, fontWeight: 400, fontSize: '32px', lineHeight: '1', color: '#fff', whiteSpace: 'nowrap' }}>
                {formatFollowersLabel(foundAccount.followersCount)}
              </p>

              <button
                type="button"
                onClick={() => void handleStartTracking()}
                className="button-inner-glow"
                style={{
                  position: 'absolute',
                  left: '150px',
                  top: '878px',
                  width: '530px',
                  height: '139px',
                  borderRadius: '62px',
                  border: '4px solid rgba(255,255,255,0.3)',
                  background: 'rgba(0,0,0,0.9)',
                  color: '#fff',
                  cursor: tracking ? 'default' : 'pointer',
                  padding: 0,
                }}
                disabled={tracking}
              >
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
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
                    начать отслеживание    100
                  </div>
                  <div style={{ position: 'absolute', left: '402px', top: '57px', width: '25px', height: '25px' }}>
                    <img
                      src={metacoinSmall}
                      alt=""
                      style={{ width: '25px', height: '25px', objectFit: 'contain', display: 'block' }}
                    />
                  </div>
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
