import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrCreateUser } from '../../utils/supabase';
import { ThreeBg, Header, Footer } from '../../components/ScreenLayout';

import userPhoto from '../../assets/main-dashboard/фото из тг.png';
import metacoinCircle from '../../assets/main-dashboard/кружок метакоины на подписочке.png';
import academyBg from '../../assets/main-dashboard/фон академия.png';
import labaBg from '../../assets/main-dashboard/фон лаба.png';
import tsekhBg from '../../assets/main-dashboard/фон цех.png';
import poligonBg from '../../assets/main-dashboard/фон полигон.png';
import chatBg from '../../assets/main-dashboard/фон чат.png';
import openBtn from '../../assets/main-dashboard/кнопка открыть на подписочке.png';

// Данные карточек сервисов из Figma
const SERVICES = [
  {
    bg: academyBg,
    route: '/about-academy',
    top: 538,
    text: 'система, промптинг, искусство, автоматизация — 4 больших курса и более 40 готовых уроков с гайдами, шаблонами и чек-листами. минимум воды и розовых очков, максимум практики и личного опыта',
  },
  {
    bg: labaBg,
    route: '/about-laba',
    top: 851,
    text: 'в лабе ИИ выполняет всю черновую работу за пару минут: поиск аккаунтов, анализ видео и написание сценария. функции сервиса доступны за внутреннюю валюту — метакоины',
  },
  {
    bg: tsekhBg,
    route: '/about-prompt',
    top: 1166,
    text: 'десятки готовых промптов, позволяющих задать точную роль LLM или воспроизвести генерацию изображения или видео буквально в один клик',
  },
  {
    bg: poligonBg,
    route: '/about-poligon',
    top: 1480,
    text: 'нужен разбор ИИ-новинки или подробный кейс с комментариями — всё это уже есть в МЕТАФЛОРА* полигон. новые статьи публикуются регулярно',
  },
  {
    bg: chatBg,
    route: '',
    top: 1794,
    text: 'комьюнити специалистов, кто только начинает или уже давно работает с ИИ. здесь найдется ответ на любой вопрос (даже на самый глупый)',
  },
];

// Маленькая CSS-кнопка (чёрная, blur, rounded)
const SmallBtn: React.FC<{ label: string; onClick?: () => void }> = ({ label, onClick }) => (
  <div
    onClick={onClick}
    style={{
      width: '160px', height: '52px',
      backdropFilter: 'blur(50px)',
      background: 'rgba(0,0,0,0.9)',
      border: '4px solid rgba(255,255,255,0.3)',
      borderRadius: '62px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer',
    }}
  >
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
  const [subscriptionEndDate, setSubscriptionEndDate] = React.useState('');
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
        <Header onLogoClick={() => navigate('/main-dashboard-premium')} />

        {/* Username */}
        <div style={{ position: 'absolute', left: '85px', top: '199px', width: '1020px' }}>
          <p style={{
            margin: 0, fontFamily: 'Cygre', fontWeight: 700,
            fontSize: '80px', lineHeight: '1', color: 'white',
            opacity: loading ? 0 : 1, transition: 'opacity 0.3s',
          }}>
            {userName}
          </p>
        </div>

        {/* Блок пользователя */}
        <div style={{ position: 'absolute', left: '79px', top: '327px', width: '1020px', height: '200px' }}>
          {/* Аватар */}
          <img src={profilePhotoUrl} alt="фото" style={{
            position: 'absolute', left: 0, top: 0,
            width: '159px', height: '159px', borderRadius: '79.5px', objectFit: 'cover',
            opacity: loading ? 0 : 1, transition: 'opacity 0.3s',
          }} />

          {/* Левая колонка: подписка */}
          <div style={{ position: 'absolute', left: '193px', top: '20px' }}>
            <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 400, fontSize: '40px', color: 'rgba(255,255,255,0.6)', lineHeight: '1' }}>
              комьюнити
            </p>
            <p style={{ margin: '8px 0 0', fontFamily: 'Cygre', fontWeight: 700, fontSize: '40px', color: 'white', lineHeight: '1' }}>
              доступ до {subscriptionEndDate || '...'}
            </p>
          </div>
          <div style={{ position: 'absolute', left: '193px', top: '118px' }}>
            <SmallBtn label="продлить" onClick={() => navigate('/pricing')} />
          </div>

          {/* Кружок метакоинов (из Figma) */}
          <div style={{
            position: 'absolute', left: '460px', top: '0px',
            width: '159px', height: '159px',
            borderRadius: '79.5px',
            border: '4px solid rgba(255,255,255,0.3)',
            overflow: 'hidden',
          }}>
            <img src={metacoinCircle} alt="метакоины" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>

          {/* Правая колонка: метакоины */}
          <div style={{ position: 'absolute', left: '640px', top: '20px' }}>
            <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 700, fontSize: '40px', color: 'white', lineHeight: '1', opacity: loading ? 0 : 1 }}>
              {metacoinsBalance}
            </p>
            <p style={{ margin: '8px 0 0', fontFamily: 'Cygre', fontWeight: 700, fontSize: '40px', color: 'white', lineHeight: '1' }}>
              метакоинов
            </p>
          </div>
          <div style={{ position: 'absolute', left: '640px', top: '118px' }}>
            <SmallBtn label="купить" onClick={() => navigate('/metacoins')} />
          </div>
        </div>

        {/* 5 карточек сервисов */}
        {SERVICES.map((svc, i) => (
          <div key={i} style={{
            position: 'absolute', left: '141px', top: `${svc.top}px`,
            width: '894px', height: '249px',
          }}>
            {/* Фото слева */}
            <img src={svc.bg} alt="" style={{
              position: 'absolute',
              left: 0, top: '5px',
              width: '447px', height: '240px',
              objectFit: 'cover', borderRadius: '26px',
            }} />
            {/* Текст справа */}
            <div style={{
              position: 'absolute',
              left: '447px', top: '5px',
              width: '447px', height: '240px',
              backdropFilter: 'blur(50px)',
              background: 'black',
              border: '4px solid rgba(255,255,255,0.3)',
              borderRadius: '30px',
              overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <p style={{
                margin: 0,
                fontFamily: 'Cygre', fontWeight: 400, fontSize: '27px',
                lineHeight: '1.25', color: 'white', textAlign: 'center',
                padding: '0 16px',
              }}>
                {svc.text}
              </p>
            </div>
            {/* Кнопка "открыть" */}
            <img src={openBtn} alt="открыть"
              onClick={() => svc.route && navigate(svc.route)}
              className="button-inner-glow"
              style={{
                position: 'absolute',
                left: '101px', top: '85px',
                width: '247px', height: '79px',
                cursor: svc.route ? 'pointer' : 'default',
              }}
            />
          </div>
        ))}

        <Footer />
      </div>
    </div>
  );
};
