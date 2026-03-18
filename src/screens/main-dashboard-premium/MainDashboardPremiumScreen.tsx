import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrCreateUser } from '../../utils/supabase';

import bgBase from '../../assets/figma-welcome/фон для эксперимента.png';
import bgPattern from '../../assets/figma-welcome/pattern.png';
import logoSmall from '../../assets/figma-welcome/logo-small.png';
import logoFooter from '../../assets/figma-welcome/logo-footer.png';
import supportPlashka from '../../assets/figma-welcome/плашка поддержка.png';
import userPhoto from '../../assets/main-dashboard/фото из тг.png';
import metacoinIcon from '../../assets/main-dashboard/новый метакоин.png';
import academyBg from '../../assets/main-dashboard/фон академия.png';
import labaBg from '../../assets/main-dashboard/фон лаба.png';
import tsekhBg from '../../assets/main-dashboard/фон цех.png';
import poligonBg from '../../assets/main-dashboard/фон полигон.png';
import chatBg from '../../assets/main-dashboard/фон чат.png';
import renewBtn from '../../assets/main-dashboard/кнопка продлить доступ.png';
import buyMetacoinsBtn from '../../assets/main-dashboard/кнопка купить метакоины.png';
import openBtn from '../../assets/main-dashboard/кнопка открыть на подписочке.png';

interface ServiceCardProps {
  bgSrc: string;
  title: string;
  description: string;
  top: number;
  onOpen: () => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ bgSrc, title, description, top, onOpen }) => (
  <div style={{ position: 'absolute', left: '141px', top: `${top}px`, width: '894px', height: '249px' }}>
    {/* Фото слева */}
    <div style={{ position: 'absolute', inset: '2% 50% 1% 0' }}>
      <img src={bgSrc} alt={title} style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: '26px',
      }} />
    </div>
    {/* Текст справа */}
    <div className="blur-wave" style={{
      position: 'absolute', inset: '2% 0 0 50%',
      backdropFilter: 'blur(50px)', background: 'black',
      border: '4px solid rgba(255,255,255,0.3)', borderRadius: '30px', overflow: 'clip',
    }}>
      <div style={{
        position: 'absolute', inset: '8% 4%',
        fontFamily: 'Cygre', fontWeight: 400, fontSize: '27px', lineHeight: '1.2',
        color: 'white', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <p style={{ margin: 0 }}>{description}</p>
      </div>
    </div>
    {/* Кнопка открыть */}
    <img src={openBtn} alt="открыть" onClick={onOpen} className="button-inner-glow" style={{
      position: 'absolute', left: '101px', top: '85px', width: '247px', height: '79px', cursor: 'pointer',
    }} />
  </div>
);

export const MainDashboardPremiumScreen: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState<boolean>(true);
  const [metacoinsBalance, setMetacoinsBalance] = React.useState<number>(0);
  const [userName, setUserName] = React.useState<string>('');
  const [subscriptionEndDate, setSubscriptionEndDate] = React.useState<string>('');
  const [profilePhotoUrl, setProfilePhotoUrl] = React.useState<string>(userPhoto);

  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;

  React.useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = await getOrCreateUser();
        if (user) {
          setMetacoinsBalance(user.metacoins_balance);
          if (user.username) setUserName(`@${user.username}`);
          if (user.subscription_end_date) {
            const date = new Date(user.subscription_end_date);
            const formatted = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            setSubscriptionEndDate(formatted);
          }
          if (user.profile_photo_url) setProfilePhotoUrl(user.profile_photo_url);
        }
      } finally {
        setLoading(false);
      }
    };
    loadUserData();

    const handleBalanceUpdate = (event: any) => setMetacoinsBalance(event.detail.newBalance);
    window.addEventListener('balanceUpdated', handleBalanceUpdate);
    return () => window.removeEventListener('balanceUpdated', handleBalanceUpdate);
  }, []);

  return (
    <div style={{
      position: 'relative', width: '100vw', minHeight: '100vh', background: '#020101', overflow: 'hidden',
    }}>
      <div style={{
        position: 'relative', width: '1180px', minHeight: '2550px',
        transform: `scale(${scale})`, transformOrigin: 'top left',
      }}>
        {/* Фон трёхслойный */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bgBase})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bgPattern})`, backgroundSize: 'cover', backgroundRepeat: 'repeat' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(2,1,1,0) 0%, rgba(2,1,1,0.6) 100%)' }} />

        {/* Лого */}
        <div style={{ position: 'absolute', left: '500px', top: '61px', width: '186px', height: '131px' }}>
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
            <img src={logoSmall} alt="МЕТАФЛОРА*" style={{
              position: 'absolute', height: '131.84%', left: '-21.84%', top: '-16.38%', width: '143.34%', maxWidth: 'none',
            }} />
          </div>
        </div>

        {/* Поддержка */}
        <img src={supportPlashka} alt="написать в поддержку" style={{
          position: 'absolute', left: '829px', top: '97px', width: '247px', height: '78px', cursor: 'pointer',
        }} />

        {/* Username */}
        <div style={{ position: 'absolute', left: '85px', top: '199px', width: '1020px' }}>
          <p style={{
            margin: 0, fontFamily: 'Cygre', fontWeight: 700, fontSize: '80px', lineHeight: '1',
            color: 'white', opacity: loading ? 0 : 1,
          }}>
            {userName || ''}
          </p>
        </div>

        {/* Аватар + блок подписки + метакоины */}
        <div style={{ position: 'absolute', left: '79px', top: '327px', width: '1020px', height: '200px' }}>
          {/* Аватар */}
          <img src={profilePhotoUrl} alt="фото" style={{
            position: 'absolute', left: 0, top: 0, width: '159px', height: '159px',
            borderRadius: '79.5px', objectFit: 'cover', opacity: loading ? 0 : 1, transition: 'opacity 0.3s',
          }} />

          {/* Статус подписки */}
          <div style={{ position: 'absolute', left: '193px', top: '28px', fontFamily: 'Cygre', fontWeight: 400, fontSize: '40px', color: 'rgba(255,255,255,0.6)' }}>
            комьюнити
          </div>
          <div style={{ position: 'absolute', left: '193px', top: '72px' }}>
            <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 700, fontSize: '40px', color: 'white', lineHeight: '1' }}>
              доступ до {subscriptionEndDate || '...'}
            </p>
          </div>
          {/* Кнопка продлить */}
          <img src={renewBtn} alt="продлить" onClick={() => navigate('/pricing')} className="button-inner-glow" style={{
            position: 'absolute', left: '193px', top: '118px', width: '247px', height: '79px', cursor: 'pointer',
          }} />

          {/* Метакоин круг */}
          <div style={{
            position: 'absolute', left: '460px', top: '0px', width: '159px', height: '159px',
            borderRadius: '80px', border: '4px solid rgba(255,255,255,0.3)', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <img src={metacoinIcon} alt="метакоины" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>

          {/* Баланс метакоинов */}
          <div style={{
            position: 'absolute', left: '640px', top: '28px',
            fontFamily: 'Cygre', fontWeight: 400, fontSize: '40px', color: 'rgba(255,255,255,0.6)', opacity: loading ? 0 : 1,
          }}>
            {loading ? '' : `${metacoinsBalance} метакоинов`}
          </div>
          {/* Кнопка купить метакоины */}
          <img src={buyMetacoinsBtn} alt="купить" onClick={() => navigate('/metacoins')} className="button-inner-glow" style={{
            position: 'absolute', left: '640px', top: '74px', width: '247px', height: '79px', cursor: 'pointer',
          }} />
        </div>

        {/* 5 карточек сервисов */}
        <ServiceCard
          bgSrc={academyBg} title="академия" top={538}
          description="4 курса по ИИ — система, промптинг, искусство и автоматизация. Игровая система обучения."
          onOpen={() => navigate('/about-academy')}
        />
        <ServiceCard
          bgSrc={labaBg} title="лаба" top={851}
          description="личный ИИ-агент-креатор для виральных видео, доступный 24/7. Анализ и сценарии."
          onOpen={() => navigate('/about-laba')}
        />
        <ServiceCard
          bgSrc={tsekhBg} title="цех" top={1166}
          description="библиотека ИИ-промптов от редакции МЕТАФЛОРЫ* для работы, творчества и автоматизации."
          onOpen={() => navigate('/about-prompt')}
        />
        <ServiceCard
          bgSrc={poligonBg} title="полигон" top={1480}
          description="статьи и материалы о нейросетях, промптинге и применении ИИ в реальных задачах."
          onOpen={() => navigate('/about-poligon')}
        />
        <ServiceCard
          bgSrc={chatBg} title="чат" top={1794}
          description="комьюнити МЕТАФЛОРЫ*: общение, коллаборации и поддержка от участников и команды."
          onOpen={() => {}}
        />

        {/* Футер */}
        <div style={{
          position: 'absolute', left: 'calc(50% - 5px)', top: '2071px',
          transform: 'translateX(-50%)', width: '888px', height: '124px',
        }}>
          <div style={{ position: 'absolute', width: '380px', height: '83px', left: '2px', top: '-16px' }}>
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
              <img src={logoFooter} alt="МЕТАФЛОРА*" style={{
                position: 'absolute', height: '526.54%', left: '-37.89%', top: '-202.47%', width: '170.37%', maxWidth: 'none',
              }} />
            </div>
          </div>
          <div style={{
            position: 'absolute', left: '2px', top: '56px',
            fontFamily: 'Cygre', fontWeight: 400, fontSize: '20px', color: 'rgba(255,255,255,0.6)',
          }}>
            Copyright © Все права защищены.
          </div>
          <img src={supportPlashka} alt="поддержка" style={{
            position: 'absolute', left: '641px', top: '-2px', width: '247px', height: '78px',
          }} />
        </div>
      </div>
    </div>
  );
};
