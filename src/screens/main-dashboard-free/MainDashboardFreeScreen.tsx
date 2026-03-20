import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ThreeBg, Header, Footer } from '../../components/ScreenLayout';

import nnAvatar from '../../assets/main-dashboard/нн аватарка.png';
import demoBg from '../../assets/main-dashboard/фон демо.png';
import hiddenCard from '../../assets/main-dashboard/карточка что скрывается в полном.png';
import openBtn from '../../assets/main-dashboard/кнопка открыть на подписочке.png';
import payBtn from '../../assets/main-dashboard/кнопка оплатить доступ укороченная.png';

export const MainDashboardFreeScreen: React.FC = () => {
  const navigate = useNavigate();
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;

  return (
    <div style={{ position: 'relative', width: '100vw', minHeight: '100vh', background: '#020101', overflow: 'hidden' }}>
      <div style={{ position: 'relative', width: '1180px', minHeight: '2550px', transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <ThreeBg />
        <Header />

        {/* Имя */}
        <div style={{ position: 'absolute', left: '85px', top: '199px', width: '1020px' }}>
          <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 700, fontSize: '80px', lineHeight: '1', color: 'white' }}>
            неопознанный бобёр
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
        <div style={{ position: 'absolute', left: '141px', top: '536px', width: '894px', height: '249px' }}>
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
            <p style={{ margin: 0, width: '390px', fontFamily: 'Cygre', fontWeight: 400, fontSize: '27px', lineHeight: '1', color: 'white', textAlign: 'center' }}>
              знакомство и безопасная установка OpenClaw, базовые техники промптинга и выбор рабочего стека для ИИ-креатора
            </p>
          </div>
          <img src={openBtn} alt="открыть" onClick={() => navigate('/academy-course-demo')} className="button-inner-glow" style={{
            position: 'absolute', left: '101px', top: '85px', width: '247px', height: '79px', cursor: 'pointer',
          }} />
          <div className="button-inner-glow" style={{
            position: 'absolute', left: '336px', top: '19px', width: '101px', height: '36px',
            backdropFilter: 'blur(50px)', background: 'rgba(255,255,255,0.1)',
            border: '2px solid rgba(255,255,255,0.3)', borderRadius: '62px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontFamily: 'Cygre', fontWeight: 500, fontSize: '20px', color: 'white' }}>демо</span>
          </div>
        </div>

        {/* Карточка "что скрывается в полном" — 894×1196px */}
        <img src={hiddenCard} alt="" style={{
          position: 'absolute', left: '143px', top: '847px',
          width: '894px', height: '1196px', objectFit: 'cover', borderRadius: '30px',
        }} />

        {/* Кнопка "оплатить" — укороченная 530px, по центру карточки */}
        <img src={payBtn} alt="оплатить полный доступ" onClick={() => navigate('/pricing')} className="button-inner-glow" style={{
          position: 'absolute', left: '322px', top: '1375px', width: '530px', height: '139px', cursor: 'pointer',
        }} />

        {/* Текст под кнопкой */}
        <div style={{
          position: 'absolute', left: '322px', top: '1546px', width: '530px', textAlign: 'center',
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
