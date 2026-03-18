import React from 'react';
import { useNavigate } from 'react-router-dom';
import { searchAccount, trackAccount, getTelegramUserId, convertInstagramImageUrl } from '../../utils/labaApi';
import type { InstagramAccount } from '../../types/laba';
import { Footer, Header, ThreeBg } from '../../components/ScreenLayout';
import mainBackdrop from '../../assets/shared-redesign/главная подложка новая.png';
import searchBorder from '../../assets/laba-redesign/search-border-short.png';
import searchIcon from '../../assets/laba-redesign/search-icon.png';
import metacoinSmall from '../../assets/metacoins-redesign/новый метакоин маленький.png';

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
    const query = linkInput || nicknameInput;
    if (!query.trim()) {
      window.Telegram?.WebApp?.showPopup?.({ message: 'введите ссылку или ник аккаунта' });
      return;
    }

    try {
      setSearching(true);
      const account = await searchAccount(query.trim());
      setFoundAccount(account);
      window.Telegram?.WebApp?.showPopup?.({ message: 'аккаунт успешно найден' });
    } catch (error: any) {
      console.error('Search account error:', error);
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
          <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 700, fontSize: '80px', lineHeight: '1', color: 'white' }}>поиск аккаунта</p>
        </div>

        <div style={{ position: 'absolute', left: '85px', top: '273px', width: '820px' }}>
          <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 400, fontSize: '40px', lineHeight: '1', color: 'white' }}>найдите аккаунт для отслеживания: вставьте ссылку или введите юзернейм</p>
        </div>

        <img src={mainBackdrop} alt="главная подложка" style={{ position: 'absolute', left: '88px', top: '399px', width: '1004px', height: '1643px', objectFit: 'fill', pointerEvents: 'none' }} />

        <div style={{ position: 'absolute', left: '141px', top: '455px', width: '898px', height: '1536px', background: '#000', border: '4px solid rgba(255,255,255,0.3)', borderRadius: '30px', boxSizing: 'border-box', padding: '46px 49px' }}>
          <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 700, fontSize: '40px', lineHeight: '1', color: 'white' }}>добавить ссылку</p>
          <div style={{ position: 'relative', width: '800px', height: '79px', marginTop: '28px' }}>
            <img src={searchBorder} alt="обводка поиск" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill', pointerEvents: 'none' }} />
            <img src={searchIcon} alt="поиск" style={{ position: 'absolute', left: '18px', top: '20px', width: '38px', height: '38px', objectFit: 'contain' }} />
            <input value={linkInput} onChange={(e) => setLinkInput(e.target.value)} placeholder="вставьте ссылку напрямую" style={{ position: 'absolute', left: '72px', top: '22px', width: '700px', background: 'transparent', border: 'none', outline: 'none', fontFamily: 'Cygre', fontWeight: 400, fontSize: '27px', color: 'rgba(255,255,255,0.8)' }} />
          </div>

          <p style={{ margin: '46px 0 0', fontFamily: 'Cygre', fontWeight: 700, fontSize: '40px', lineHeight: '1', color: 'white' }}>найти по нику</p>
          <div style={{ position: 'relative', width: '800px', height: '79px', marginTop: '28px' }}>
            <img src={searchBorder} alt="обводка поиск" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill', pointerEvents: 'none' }} />
            <img src={searchIcon} alt="поиск" style={{ position: 'absolute', left: '18px', top: '20px', width: '38px', height: '38px', objectFit: 'contain' }} />
            <input value={nicknameInput} onChange={(e) => setNicknameInput(e.target.value)} placeholder="напишите юзернейм аккаунта через @" style={{ position: 'absolute', left: '72px', top: '22px', width: '700px', background: 'transparent', border: 'none', outline: 'none', fontFamily: 'Cygre', fontWeight: 400, fontSize: '27px', color: 'rgba(255,255,255,0.8)' }} />
          </div>

          <button type="button" onClick={handleSearch} className="button-inner-glow" style={{ marginTop: '52px', marginLeft: '277px', width: '247px', height: '80px', border: '4px solid rgba(255,255,255,0.3)', borderRadius: '62px', background: 'rgba(0,0,0,0.9)', color: 'white', fontFamily: 'Cygre', fontWeight: 700, fontSize: '27px', cursor: 'pointer' }}>
            найти
          </button>

          <p style={{ margin: '58px 0 0', fontFamily: 'Cygre', fontWeight: 700, fontSize: '40px', lineHeight: '1', color: 'white' }}>результат</p>

          {searching ? (
            <div style={{ marginTop: '40px', fontFamily: 'Cygre', fontSize: '32px', color: 'rgba(255,255,255,0.7)' }}>ищем аккаунт...</div>
          ) : foundAccount ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '28px', marginTop: '44px' }}>
                <div style={{ width: '190px', height: '190px', borderRadius: '50%', overflow: 'hidden', background: 'rgba(255,255,255,0.1)' }}>
                  {avatarUrl ? <img src={avatarUrl} alt={foundAccount.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                </div>
                <div>
                  <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 700, fontSize: '40px', lineHeight: '1', color: 'white' }}>@{foundAccount.username}</p>
                  <p style={{ margin: '14px 0 0', fontFamily: 'Cygre', fontWeight: 400, fontSize: '32px', lineHeight: '1', color: 'white' }}>{foundAccount.followersCount.toLocaleString('ru-RU')} подписчиков</p>
                </div>
              </div>

              <button type="button" onClick={handleStartTracking} className="button-inner-glow" style={{ marginTop: '68px', marginLeft: '134px', width: '530px', height: '139px', border: '4px solid rgba(255,255,255,0.3)', borderRadius: '62px', background: 'rgba(0,0,0,0.9)', color: 'white', fontFamily: 'Cygre', fontWeight: 700, fontSize: '32px', cursor: tracking ? 'default' : 'pointer' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  начать отслеживание
                  <img src={metacoinSmall} alt="" style={{ width: '25px', height: '25px', objectFit: 'contain' }} />
                  100
                </span>
              </button>

              <p style={{ margin: '26px 0 0', fontFamily: 'Cygre', fontWeight: 400, fontSize: '32px', lineHeight: '1', color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>
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
