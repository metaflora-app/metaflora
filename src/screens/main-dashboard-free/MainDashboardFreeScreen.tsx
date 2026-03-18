import React from 'react';
import { useNavigate } from 'react-router-dom';

import bgBase from '../../assets/figma-welcome/фон для эксперимента.png';
import bgPattern from '../../assets/figma-welcome/pattern.png';
import logoSmall from '../../assets/figma-welcome/logo-small.png';
import logoFooter from '../../assets/figma-welcome/logo-footer.png';
import supportPlashka from '../../assets/figma-welcome/плашка поддержка.png';
import nnAvatar from '../../assets/main-dashboard/нн аватарка.png';
import demoBg from '../../assets/main-dashboard/фон демо.png';
import hiddenCard from '../../assets/main-dashboard/карточка что скрывается в полном.png';
import openBtn from '../../assets/main-dashboard/кнопка открыть на подписочке.png';
import payBtn from '../../assets/main-dashboard/кнопка оплатить доступ укороченная.png';

export const MainDashboardFreeScreen: React.FC = () => {
  const navigate = useNavigate();
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;

  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      minHeight: '100vh',
      background: '#020101',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'relative',
        width: '1180px',
        minHeight: '2550px',
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
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

        {/* Имя */}
        <div style={{ position: 'absolute', left: '85px', top: '199px', width: '1020px' }}>
          <p style={{
            margin: 0,
            fontFamily: 'Cygre',
            fontWeight: 700,
            fontSize: '80px',
            lineHeight: '1',
            color: 'white',
          }}>
            неопознанный бобёр
          </p>
        </div>

        {/* Аватар + статусы */}
        <div style={{ position: 'absolute', left: '79px', top: '327px', width: '1020px', height: '200px' }}>
          <img src={nnAvatar} alt="аватар" style={{
            position: 'absolute', left: 0, top: 0, width: '159px', height: '159px', borderRadius: '79.5px', objectFit: 'cover',
          }} />
          <div style={{
            position: 'absolute', left: '193px', top: '37px',
            fontFamily: 'Cygre', fontWeight: 400, fontSize: '40px', color: 'rgba(255,255,255,0.6)',
          }}>
            гость
          </div>
          <div style={{
            position: 'absolute', left: '193px', top: '80px',
            fontFamily: 'Cygre', fontWeight: 700, fontSize: '40px', color: 'white',
          }}>
            свободный доступ
          </div>
        </div>

        {/* Карточка демо-курса */}
        <div style={{ position: 'absolute', left: '141px', top: '536px', width: '894px', height: '249px' }}>
          {/* Левая половина — фото */}
          <div style={{ position: 'absolute', inset: '2% 50% 1% 0' }}>
            <img src={demoBg} alt="" style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: '26px',
            }} />
          </div>
          {/* Правая половина — текст */}
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
              <p style={{ margin: 0 }}>
                демо-курс «OpenClaw» — 4 урока для старта: система, промптинг, искусство и автоматизация
              </p>
            </div>
          </div>
          {/* Кнопка открыть */}
          <img src={openBtn} alt="открыть" onClick={() => navigate('/academy-course-demo')}
            className="button-inner-glow" style={{
              position: 'absolute', left: '101px', top: '85px', width: '247px', height: '79px', cursor: 'pointer',
            }} />
          {/* Плашка "демо" */}
          <div className="button-inner-glow" style={{
            position: 'absolute', left: '336px', top: '19px', width: '101px', height: '36px',
            backdropFilter: 'blur(50px)', background: 'rgba(255,255,255,0.1)',
            border: '2px solid rgba(255,255,255,0.3)', borderRadius: '62px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontFamily: 'Cygre', fontWeight: 500, fontSize: '20px', color: 'white' }}>демо</span>
          </div>
        </div>

        {/* Карточка "что скрывается в полном" */}
        <img src={hiddenCard} alt="" style={{
          position: 'absolute', left: '143px', top: '847px', width: '894px', height: '1196px',
          objectFit: 'cover', borderRadius: '30px',
        }} />

        {/* Кнопка "оплатить полный доступ" — укороченная */}
        <img src={payBtn} alt="оплатить полный доступ" onClick={() => navigate('/pricing')}
          className="button-inner-glow" style={{
            position: 'absolute', left: '322px', top: '1375px', width: '530px', height: '139px', cursor: 'pointer',
          }} />

        {/* Текст под кнопкой */}
        <div style={{
          position: 'absolute', left: '143px', top: '1533px', width: '894px', textAlign: 'center',
          fontFamily: 'Cygre', fontWeight: 400, fontSize: '27px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.3',
        }}>
          вы будете перенаправлены на страницу с выбором подписки
        </div>

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
