import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrCreateUser } from '../../utils/supabase';
import { ThreeBg, Header, Footer } from '../../components/ScreenLayout';

import userPhoto from '../../assets/main-dashboard/фото из тг.png';
import metacoinCircle from '../../assets/main-dashboard/кружок метакоины на подписочке.png';

// Фоны сервисов — из ассетов после редизайна
import academyBg from '../../assets/main-dashboard/фон академия.png';
import labaBg from '../../assets/main-dashboard/фон лаба.png';
import tsekhBg from '../../assets/main-dashboard/фон цех.png';
import poligonBg from '../../assets/main-dashboard/фон полигон.png';
import chatBg from '../../assets/main-dashboard/фон чат.png';

// ─── Карточка сервиса точно по Figma ─────────────────────────────────────
// Структура: фото-левая (inset 0/49.78%/0/0), текст-правая (inset 0/0/0/50.22%),
//            кнопка "открыть" (inset 34.14%/61.08%/34.04%/11.3%)
interface CardProps {
  bgSrc: string;
  text: string;
  top: number;
  height?: number;
  onOpen?: () => void;
  photoInset?: string;
  textInset?: string;
}

const ServiceCard: React.FC<CardProps> = ({
  bgSrc, text, top, height = 249, onOpen,
  photoInset = '0 49.78% 0 0',
  textInset = '0 0 0 50.22%',
}) => (
  <div style={{
    position: 'absolute',
    left: '141px', top: `${top}px`,
    width: '894px', height: `${height}px`,
  }}>
    {/* Фото слева */}
    <div style={{ position: 'absolute', inset: photoInset, borderRadius: '26px', overflow: 'hidden' }}>
      <img src={bgSrc} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: '26px' }} />
    </div>

    {/* Текст справа */}
    <div style={{
      position: 'absolute', inset: textInset,
      backdropFilter: 'blur(50px)', background: 'black',
      border: '4px solid rgba(255,255,255,0.3)', borderRadius: '30px', overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <p style={{
        margin: 0, padding: '0 20px',
        fontFamily: 'Cygre', fontWeight: 400, fontSize: '27px',
        lineHeight: '1.3', color: 'white', textAlign: 'center',
      }}>
        {text}
      </p>
    </div>

    {/* Кнопка "открыть" inset: 34.14%/61.08%/34.04%/11.3% */}
    <div
      onClick={onOpen}
      style={{
        position: 'absolute',
        top: '34.14%', right: '61.08%', bottom: '34.04%', left: '11.3%',
        backdropFilter: 'blur(50px)', background: 'rgba(0,0,0,0.9)',
        border: '4px solid rgba(255,255,255,0.3)', borderRadius: '62px',
        overflow: 'hidden', cursor: onOpen ? 'pointer' : 'default',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <span style={{ fontFamily: 'Cygre', fontWeight: 700, fontSize: '27px', color: 'white' }}>
        открыть
      </span>
    </div>
  </div>
);

// ─── Кнопка "продлить"/"купить" (w=168, h=54, точно по Figma) ─────────────
interface SmBtnProps { label: string; x: number; y: number; onClick?: () => void; }
const SmBtn: React.FC<SmBtnProps> = ({ label, x, y, onClick }) => (
  <div onClick={onClick} style={{
    position: 'absolute', left: `${x}px`, top: `${y}px`,
    width: '168px', height: '54px',
    backdropFilter: 'blur(50px)', background: 'rgba(0,0,0,0.9)',
    border: '4px solid rgba(255,255,255,0.3)', borderRadius: '62px',
    overflow: 'hidden', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>
    <span style={{ fontFamily: 'Cygre', fontWeight: 700, fontSize: '27px', color: 'white' }}>
      {label}
    </span>
  </div>
);

export const MainDashboardPremiumScreen: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [metacoinsBalance, setMetacoinsBalance] = React.useState(0);
  const [userName, setUserName] = React.useState('');
  const [subscriptionEndDate, setSubscriptionEndDate] = React.useState('31.12');
  const [profilePhotoUrl, setProfilePhotoUrl] = React.useState(userPhoto);

  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;

  React.useEffect(() => {
    const load = async () => {
      try {
        const user = await getOrCreateUser();
        if (user) {
          setMetacoinsBalance(user.metacoins_balance);
          if (user.username) setUserName(`@${user.username}`);
          if (user.subscription_end_date) {
            const d = new Date(user.subscription_end_date);
            setSubscriptionEndDate(
              `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}`
            );
          }
          if (user.profile_photo_url) setProfilePhotoUrl(user.profile_photo_url);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
    const onBalance = (e: any) => setMetacoinsBalance(e.detail.newBalance);
    window.addEventListener('balanceUpdated', onBalance);
    return () => window.removeEventListener('balanceUpdated', onBalance);
  }, []);

  return (
    <div style={{ position: 'relative', width: '100vw', minHeight: '100vh', background: '#020101', overflow: 'hidden' }}>
      <div style={{
        position: 'relative', width: '1180px', minHeight: '2550px',
        transform: `scale(${scale})`, transformOrigin: 'top left',
      }}>
        <ThreeBg />

        {/* Лого: x=500, y=61, w=186, h=131 */}
        <Header onLogoClick={() => navigate('/main-dashboard-premium')} />

        {/* Username: x=85, y=207, w=1020, h=80 — Cygre Bold 80px */}
        <div style={{
          position: 'absolute', left: '85px', top: '207px', width: '1020px', height: '80px',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
        }}>
          <p style={{
            margin: 0, fontFamily: 'Cygre', fontWeight: 700, fontSize: '80px',
            lineHeight: '1', color: 'white',
            opacity: loading ? 0 : 1, transition: 'opacity 0.3s',
          }}>
            {userName}
          </p>
        </div>

        {/* Аватар: x=79, y=325, w=159, h=159 */}
        <img src={profilePhotoUrl} alt="фото" style={{
          position: 'absolute', left: '79px', top: '325px',
          width: '159px', height: '159px',
          borderRadius: '79.5px', objectFit: 'cover',
          opacity: loading ? 0 : 1, transition: 'opacity 0.3s',
        }} />

        {/* Комьюнити: x=258, y=338, w=357, h=40 — Cygre Regular 40px opacity 0.6 */}
        <div style={{
          position: 'absolute', left: '258px', top: '338px', width: '357px', height: '40px',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
        }}>
          <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 400, fontSize: '40px', lineHeight: '1', color: 'rgba(255,255,255,0.6)' }}>
            комьюнити
          </p>
        </div>

        {/* Доступ до: x=258, y=377, w=303, h=40 — Cygre Bold 40px */}
        <div style={{
          position: 'absolute', left: '258px', top: '377px', width: '303px', height: '40px',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
        }}>
          <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 700, fontSize: '40px', lineHeight: '1', color: 'white' }}>
            доступ до {subscriptionEndDate}
          </p>
        </div>

        {/* Кнопка продлить: x=259, y=430, w=168, h=54 */}
        <SmBtn label="продлить" x={259} y={430} onClick={() => navigate('/pricing')} />

        {/* Кружок метакоинов: x=610, y=327, w=159, h=159 */}
        <div style={{
          position: 'absolute', left: '610px', top: '327px', width: '159px', height: '159px',
          borderRadius: '79.5px', border: '4px solid rgba(255,255,255,0.3)', overflow: 'hidden',
        }}>
          <img src={metacoinCircle} alt="метакоины" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>

        {/* Баланс (число): x=790, y=339, w=145, h=40 — Cygre Bold 40px */}
        <div style={{
          position: 'absolute', left: '790px', top: '339px', width: '145px', height: '40px',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          opacity: loading ? 0 : 1,
        }}>
          <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 700, fontSize: '40px', lineHeight: '1', color: 'white', whiteSpace: 'nowrap' }}>
            {metacoinsBalance}
          </p>
        </div>

        {/* "метакоинов": x=790, y=377, w=256, h=40 — Cygre Bold 40px */}
        <div style={{
          position: 'absolute', left: '790px', top: '377px', width: '256px', height: '40px',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
        }}>
          <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 700, fontSize: '40px', lineHeight: '1', color: 'white' }}>
            метакоинов
          </p>
        </div>

        {/* Кнопка купить: x=789, y=430, w=168, h=54 */}
        <SmBtn label="купить" x={789} y={430} onClick={() => navigate('/metacoins')} />

        {/* ── 5 карточек сервисов (Y-позиции точно по Figma) ── */}
        <ServiceCard
          bgSrc={academyBg} top={538} height={249}
          photoInset="0 49.78% 0 0" textInset="0 0 0 50.22%"
          text="система, промптинг, искусство, автоматизация — 4 больших курса и более 40 готовых уроков с гайдами, шаблонами и чек-листами. минимум воды и розовых очков, максимум практики и личного опыта"
          onOpen={() => navigate('/about-academy')}
        />
        <ServiceCard
          bgSrc={labaBg} top={816} height={250}
          photoInset="0.4% 49.78% 0 0" textInset="0.4% 0 0 50.22%"
          text="в лабе ИИ выполняет всю черновую работу за пару минут: поиск аккаунтов, анализ видео и написание сценария. функции сервиса доступны за внутреннюю валюту — метакоины"
          onOpen={() => navigate('/about-laba')}
        />
        <ServiceCard
          bgSrc={tsekhBg} top={1097} height={249}
          photoInset="0 49.66% 0 0.11%" textInset="0 0 0 50.32%"
          text="десятки готовых промптов, позволяющих задать точную роль LLM или воспроизвести генерацию изображения или видео буквально в один клик"
          onOpen={() => navigate('/about-prompt')}
        />
        <ServiceCard
          bgSrc={poligonBg} top={1378} height={249}
          photoInset="0 50% 0 0" textInset="0 0 0 49.97%"
          text="нужен разбор ИИ-новинки или подробный кейс с комментариями — всё это уже есть в МЕТАФЛОРА* полигон. новые статьи публикуются регулярно"
          onOpen={() => navigate('/about-poligon')}
        />
        <ServiceCard
          bgSrc={chatBg} top={1659} height={249}
          photoInset="0 50.45% 0 0" textInset="0 0 0 49.56%"
          text="комьюнити специалистов, кто только начинает или уже давно работает с ИИ. здесь найдется ответ на любой вопрос (даже на самый глупый)"
        />

        {/* Футер: x=141, y=2071, w=888, h=124 */}
        <Footer />
      </div>
    </div>
  );
};
