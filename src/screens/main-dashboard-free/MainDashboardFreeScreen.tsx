import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ThreeBg, Header, Footer } from '../../components/ScreenLayout';
import { InteractiveTiltCard } from '../../components/InteractiveTiltCard';

import nnAvatar from '../../assets/main-dashboard/нн аватарка.png';
import demoBg from '../../assets/main-dashboard/фон демо.png';
import hiddenCard from '../../assets/main-dashboard/карточка что скрывается в полном.png';
import openBtn from '../../assets/main-dashboard/кнопка открыть на подписочке.png';
import payBtn from '../../assets/main-dashboard/кнопка оплатить доступ укороченная.png';

type GuestAnimal = {
  adjective: string;
  animal: string;
};

const GUEST_ANIMALS: GuestAnimal[] = [
  { adjective: 'неопознанный', animal: 'бобёр' },
  { adjective: 'неопознанная', animal: 'лама' },
  { adjective: 'неопознанная', animal: 'косуля' },
  { adjective: 'неопознанная', animal: 'белка' },
];

export const MainDashboardFreeScreen: React.FC = () => {
  const navigate = useNavigate();
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;
  const [guestAnimal, setGuestAnimal] = React.useState(GUEST_ANIMALS[0]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const storageKey = 'metaflora_guest_animal_index';
    const previousIndex = Number(window.localStorage.getItem(storageKey) || '-1');
    const nextIndex = (previousIndex + 1 + GUEST_ANIMALS.length) % GUEST_ANIMALS.length;
    window.localStorage.setItem(storageKey, String(nextIndex));
    setGuestAnimal(GUEST_ANIMALS[nextIndex]);
  }, []);

  return (
    <div style={{ position: 'relative', width: '100vw', minHeight: '100vh', background: '#020101', overflow: 'hidden' }}>
      <div style={{ position: 'relative', width: '1180px', minHeight: '2550px', transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <ThreeBg />
        <Header />

        {/* Имя */}
        <div style={{ position: 'absolute', left: '85px', top: '199px', width: '1020px' }}>
          <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 700, fontSize: '80px', lineHeight: '1', color: 'white' }}>
            {guestAnimal.adjective} {guestAnimal.animal}
          </p>
        </div>

        {/* Аватар + статусы */}
        <div style={{ position: 'absolute', left: '79px', top: '327px', width: '1020px', height: '200px' }}>
          <img src={nnAvatar} alt="аватар" style={{
            position: 'absolute', left: 0, top: 0, width: '159px', height: '159px',
            borderRadius: '79.5px', objectFit: 'cover',
          }} />
          <div style={{ position: 'absolute', left: '193px', top: '37px' }}>
            <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 400, fontSize: '40px', color: 'rgba(255,255,255,0.6)', lineHeight: '1' }}>
              гость
            </p>
          </div>
          <div style={{ position: 'absolute', left: '193px', top: '80px' }}>
            <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 700, fontSize: '40px', color: 'white', lineHeight: '1' }}>
              свободный доступ
            </p>
          </div>
        </div>

        {/* Карточка демо-курса */}
        <InteractiveTiltCard className="pricing-card-shell" maxRotateX={3} maxRotateY={4} maxScale={1.01} style={{ position: 'absolute', left: '141px', top: '536px', width: '894px', height: '249px' }}>
          <div className="pricing-card-sheen-zone">
            <div className="pricing-card-sheen" />
            <div className="pricing-card-sheen pricing-card-sheen-soft" />
          </div>
          <img src={demoBg} alt="" style={{
            position: 'absolute', left: 0, top: '5px', width: '447px', height: '240px',
            objectFit: 'cover', borderRadius: '26px',
          }} />
          <div style={{
            position: 'absolute', left: '447px', top: '5px', width: '447px', height: '240px',
            backdropFilter: 'blur(50px)', background: 'black',
            border: '4px solid rgba(255,255,255,0.3)', borderRadius: '30px', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <p style={{ margin: 0, width: '420px', fontFamily: 'Cygre', fontWeight: 400, fontSize: '35px', lineHeight: '1', color: 'white', textAlign: 'center', whiteSpace: 'pre-wrap', transform: 'translateY(-6px)' }}>
              {'то, что нужно для\nлегкого старта:\nOpenClaw с нуля,\nбазовый промптинг\nи сборка стэка ИИ-\nкреатора'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/academy-course-demo')}
            className="premium-button-shell button-inner-glow motion-press-grow"
            style={{
              position: 'absolute', left: '101px', top: '85px', width: '247px', height: '79px', cursor: 'pointer',
              border: 'none', background: 'transparent', padding: 0, borderRadius: '62px', overflow: 'hidden',
            }}
          >
            <img src={openBtn} alt="открыть" className="button-inner-glow" style={{
              position: 'absolute', inset: '2px', width: 'calc(100% - 4px)', height: 'calc(100% - 4px)', objectFit: 'contain', pointerEvents: 'none', zIndex: 2,
            }} />
          </button>
        </InteractiveTiltCard>

        {/* Карточка "что скрывается в полном" — 894×1196px */}
        <InteractiveTiltCard className="pricing-card-shell" maxRotateX={3} maxRotateY={4} maxScale={1.01} style={{
          position: 'absolute', left: '143px', top: '847px',
          width: '894px', height: '1196px',
        }}>
          <div className="pricing-card-sheen-zone">
            <div className="pricing-card-sheen" />
            <div className="pricing-card-sheen pricing-card-sheen-soft" />
          </div>
          <img src={hiddenCard} alt="" style={{
            position: 'absolute', inset: 0,
            width: '894px', height: '1196px', objectFit: 'cover', borderRadius: '30px',
          }} />
        </InteractiveTiltCard>

        {/* Кнопка "оплатить" — укороченная 530px, по центру карточки */}
        <button
          type="button"
          onClick={() => navigate('/pricing')}
          className="premium-button-shell button-inner-glow motion-press-grow"
          style={{
            position: 'absolute', left: '322px', top: '1375px', width: '530px', height: '139px', cursor: 'pointer',
            border: 'none', background: 'transparent', padding: 0, borderRadius: '62px', overflow: 'hidden',
          }}
        >
          <img src={payBtn} alt="оплатить полный доступ" className="button-inner-glow" style={{
            position: 'absolute', inset: '2px', width: 'calc(100% - 4px)', height: 'calc(100% - 4px)', objectFit: 'contain', pointerEvents: 'none', zIndex: 2,
          }} />
        </button>

        {/* Текст под кнопкой */}
        <div style={{
          position: 'absolute', left: '322px', top: '1524px', width: '530px', textAlign: 'center',
          fontFamily: 'Cygre', fontWeight: 400, fontSize: '32px', color: 'rgba(255,255,255,0.6)', lineHeight: '1',
        }}>
          вы будете перенаправлены
          <br />
          на страницу с выбором подписки
        </div>

        <Footer />
      </div>
    </div>
  );
};
