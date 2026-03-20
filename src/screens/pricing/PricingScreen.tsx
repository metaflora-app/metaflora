import React from 'react';
import { useNavigate } from 'react-router-dom';
import { trackSubscriptionPurchase } from '../../utils/supabase';
import { ThreeBg, Header, Footer } from '../../components/ScreenLayout';

import pricingCardMonth from '../../assets/pricing-redesign/карточка подписки 1 месяц.png';
import pricingCardQuarter from '../../assets/pricing-redesign/карточка подписки 3 месяца.png';
import activeMonthButton from '../../assets/pricing-redesign/кнопка активный месяц.png';
import activeQuarterButton from '../../assets/pricing-redesign/кнопка активные 3 месяца.png';
import choiceWindow from '../../assets/pricing-redesign/окошко выбор месяца.png';
import payButton from '../../assets/pricing-redesign/кнопка оплатить доступ.png';

export const PricingScreen: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = React.useState<'1month' | '3months'>('1month');
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;

  const handlePayment = async () => {
    const months = selectedPlan === '1month' ? 1 : 3;
    const success = await trackSubscriptionPurchase('premium', months);

    if (!success) {
      if (window.Telegram?.WebApp?.showPopup) {
        window.Telegram.WebApp.showPopup({
          message: 'Подписка оформлена, но возникла ошибка синхронизации. Обратитесь в поддержку.',
        });
      } else {
        alert('Подписка оформлена, но возникла ошибка синхронизации. Обратитесь в поддержку.');
      }
      return;
    }

    navigate('/main-dashboard-premium');
  };

  return (
    <div style={{ position: 'relative', width: '100vw', minHeight: '100vh', background: '#020101', overflow: 'hidden' }}>
      <div style={{ position: 'relative', width: '1180px', minHeight: '2550px', transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <ThreeBg />
        <Header onLogoClick={() => navigate('/main-dashboard-premium')} />

        <div style={{ position: 'absolute', left: '94px', top: '207px', width: '1020px' }}>
          <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 700, fontSize: '80px', lineHeight: '1', color: 'white' }}>
            выберите вариант подписки
          </p>
        </div>

        <div style={{ position: 'absolute', left: '143px', top: '399px', width: '894px', height: '79px' }}>
          <img
            src={choiceWindow}
            alt="выбор периода подписки"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill', pointerEvents: 'none' }}
          />

          <PlanToggleButton
            label="1 месяц (-10%)"
            active={selectedPlan === '1month'}
            activeSrc={activeMonthButton}
            left={0}
            onClick={() => setSelectedPlan('1month')}
          />

          <PlanToggleButton
            label="3 месяца (-20%)"
            active={selectedPlan === '3months'}
            activeSrc={activeQuarterButton}
            left={447}
            onClick={() => setSelectedPlan('3months')}
          />
        </div>

        <img
          src={selectedPlan === '1month' ? pricingCardMonth : pricingCardQuarter}
          alt={selectedPlan === '1month' ? 'подписка на 1 месяц' : 'подписка на 3 месяца'}
          style={{ position: 'absolute', left: '143px', top: '523px', width: '894px', height: '1178px', objectFit: 'fill' }}
        />

        <img
          src={payButton}
          alt="оплатить доступ"
          onClick={handlePayment}
          className="button-inner-glow"
          style={{ position: 'absolute', left: '143px', top: '1744px', width: '894px', height: '139px', cursor: 'pointer' }}
        />

        <Footer />
      </div>
    </div>
  );
};

const PlanToggleButton: React.FC<{
  label: string;
  active: boolean;
  activeSrc: string;
  left: number;
  onClick: () => void;
}> = ({ label, active, activeSrc, left, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      position: 'absolute',
      left: `${left}px`,
      top: 0,
      width: '447px',
      height: '79px',
      border: 'none',
      background: 'transparent',
      padding: 0,
      cursor: 'pointer',
      overflow: 'hidden',
    }}
  >
    {active ? (
      <img
        src={activeSrc}
        alt=""
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill', pointerEvents: 'none' }}
      />
    ) : null}
    <span
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: '100%',
        padding: '0 24px',
        boxSizing: 'border-box',
        fontFamily: 'Cygre',
        fontWeight: 700,
        fontSize: '40px',
        lineHeight: '1',
        color: '#fff',
        textAlign: 'center',
        whiteSpace: 'nowrap',
        zIndex: 1,
      }}
    >
      {label}
    </span>
  </button>
);
