import React from 'react';
import { useNavigate } from 'react-router-dom';
import { searchAccount, trackAccount, getTelegramUserId, convertInstagramImageUrl } from '../../utils/labaApi';
import type { InstagramAccount } from '../../types/laba';
import { Footer, Header, ThreeBg } from '../../components/ScreenLayout';
import metacoinSmall from '../../assets/metacoins-redesign/новый метакоин маленький.png';
import searchUnderlay from '../../assets/laba-search-account/главная подложка новая.png';

const textFont = 'Cygre, sans-serif';
const searchIcon = 'https://www.figma.com/api/mcp/asset/2b95cc27-5ad3-49a5-8c6c-2782419c868b';
const instagramLogo = 'https://www.figma.com/api/mcp/asset/01c1f7bc-b497-447d-926a-d8ba816a7ad2';

const searchFieldStyle: React.CSSProperties = {
  position: 'absolute',
  left: '37px',
  width: '755px',
  height: '79px',
  borderRadius: '62px',
  border: '4px solid rgba(255,255,255,0.3)',
  background: '#000',
  backdropFilter: 'blur(50px)',
};

export const LabaSearchAccountScreen: React.FC = () => {
  const navigate = useNavigate();
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;
  const [linkInput, setLinkInput] = React.useState('');
  const [nicknameInput, setNicknameInput] = React.useState('');
  const [foundAccount, setFoundAccount] = React.useState<InstagramAccount | null>(null);
  const [searching, setSearching] = React.useState(false);
  const [tracking, setTracking] = React.useState(false);

  const avatarUrl = React.useMemo(() => {
    if (!foundAccount?.profilePhotoUrl) return null;
    return convertInstagramImageUrl(foundAccount.profilePhotoUrl);
  }, [foundAccount?.profilePhotoUrl]);

  const handleSearch = async () => {
    const query = linkInput.trim() || nicknameInput.trim();
    if (!query) {
      window.Telegram?.WebApp?.showPopup?.({ message: 'введите ссылку или ник аккаунта' });
      return;
    }

    try {
      setSearching(true);
      const account = await searchAccount(query);
      setFoundAccount(account);
      window.Telegram?.WebApp?.showPopup?.({ message: 'аккаунт успешно найден' });
    } catch (error: any) {
      console.error('Search account error:', error);
      setFoundAccount(null);
      window.Telegram?.WebApp?.showPopup?.({ message: error.message || 'ничего не найдено' });
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
      await trackAccount(foundAccount.username, userId);
      navigate('/laba-tracked', { state: { newAccountAdded: true } });
    } catch (error: any) {
      console.error('Track account error:', error);
      window.Telegram?.WebApp?.showPopup?.({ message: error.message || 'ошибка отслеживания' });
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
            left: '31px',
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
            left: '141px',
            top: '453px',
            width: '898px',
            height: '1536px',
            borderRadius: '30px',
            border: '4px solid rgba(255,255,255,0.3)',
            background: 'rgba(0,0,0,0.92)',
            backdropFilter: 'blur(50px)',
          }}
        >
          <p style={{ position: 'absolute', left: '41px', top: '63px', margin: 0, fontFamily: textFont, fontWeight: 700, fontSize: '40px', lineHeight: '1', color: '#fff' }}>
            добавить ссылку
          </p>

          <div style={{ ...searchFieldStyle, top: '136px' }}>
            <div style={{ position: 'absolute', left: '24px', top: '50%', width: '38px', height: '38px', transform: 'translateY(-50%)' }}>
              <img src={searchIcon} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <input
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
              placeholder="вставьте ссылку напрямую"
              style={{
                position: 'absolute',
                left: '72px',
                top: '50%',
                transform: 'translateY(-61%)',
                width: '635px',
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontFamily: textFont,
                fontWeight: 400,
                fontSize: '27px',
                lineHeight: '1',
                color: '#fff',
              }}
            />
          </div>

          <p style={{ position: 'absolute', left: '41px', top: '241px', margin: 0, fontFamily: textFont, fontWeight: 700, fontSize: '40px', lineHeight: '1', color: '#fff' }}>
            найти по нику
          </p>

          <div style={{ ...searchFieldStyle, top: '308px' }}>
            <div style={{ position: 'absolute', left: '24px', top: '50%', width: '38px', height: '38px', transform: 'translateY(-50%)' }}>
              <img src={searchIcon} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <input
              value={nicknameInput}
              onChange={(e) => setNicknameInput(e.target.value)}
              placeholder="напишите юзернейм аккаунта через @"
              style={{
                position: 'absolute',
                left: '72px',
                top: '50%',
                transform: 'translateY(-61%)',
                width: '635px',
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontFamily: textFont,
                fontWeight: 400,
                fontSize: '27px',
                lineHeight: '1',
                color: '#fff',
              }}
            />
          </div>

          <button
            type="button"
            onClick={() => void handleSearch()}
            className="button-inner-glow"
            style={{
              position: 'absolute',
              left: '326px',
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
            }}
          >
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '150px',
                height: '29px',
                lineHeight: '1',
                textAlign: 'center',
              }}
            >
              {searching ? 'ищем...' : 'найти'}
            </span>
          </button>

          <p style={{ position: 'absolute', left: '41px', top: '547px', margin: 0, fontFamily: textFont, fontWeight: 700, fontSize: '40px', lineHeight: '1', color: '#fff' }}>
            результат
          </p>

          {searching ? (
            <div style={{ position: 'absolute', left: '41px', top: '620px', fontFamily: textFont, fontWeight: 400, fontSize: '32px', lineHeight: '1', color: 'rgba(255,255,255,0.7)' }}>
              ищем аккаунт...
            </div>
          ) : foundAccount ? (
            <>
              <div style={{ position: 'absolute', left: '41px', top: '620px', width: '190px', height: '190px', borderRadius: '50%', overflow: 'hidden', background: 'rgba(255,255,255,0.1)' }}>
                {avatarUrl ? <img src={avatarUrl} alt={foundAccount.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
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
                {foundAccount.followersCount.toLocaleString('ru-RU')} подписчиков
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
              >
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                  <div
                    style={{
                      position: 'absolute',
                      left: '29px',
                      top: '49px',
                      width: '473px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: textFont,
                      fontWeight: 700,
                      fontSize: '32px',
                      lineHeight: '1',
                      whiteSpace: 'pre',
                    }}
                  >
                    {tracking ? 'отслеживаем...' : 'начать отслеживание    100'}
                  </div>
                  {!tracking ? (
                    <div style={{ position: 'absolute', left: '398px', top: '53px', width: '25px', height: '25px', overflow: 'hidden' }}>
                      <img
                        src={metacoinSmall}
                        alt=""
                        style={{ position: 'absolute', height: '130.34%', left: '-20%', top: '-14.48%', width: '140%', maxWidth: 'none' }}
                      />
                    </div>
                  ) : null}
                </div>
              </button>

              <p
                style={{
                  position: 'absolute',
                  left: '202px',
                  top: '1021px',
                  margin: 0,
                  width: '495px',
                  fontFamily: textFont,
                  fontWeight: 400,
                  fontSize: '32px',
                  lineHeight: '1',
                  color: 'rgba(255,255,255,0.6)',
                  textAlign: 'center',
                }}
              >
                вы можете пополнить баланс в личном кабинете
              </p>
            </>
          ) : null}
        </div>

        <Footer />
      </div>
    </div>
  );
};
