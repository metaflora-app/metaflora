import React from 'react';
import { useNavigate } from 'react-router-dom';
import { showPopupMessage } from '../../app/telegram/telegramHelpers';
import { trackSubscriptionPurchase } from '../../utils/supabase';
import { ThreeBg, Header, Footer } from '../../components/ScreenLayout';
import { HaloLayer } from '../../components/animation/HaloLayer';

import pricingCardMonth from '../../assets/pricing-redesign/карточка подписки 1 месяц.png';
import pricingCardQuarter from '../../assets/pricing-redesign/карточка подписки 3 месяца.png';
import activeMonthButton from '../../assets/pricing-redesign/кнопка активный месяц.png';
import activeQuarterButton from '../../assets/pricing-redesign/кнопка активные 3 месяца.png';
import payButton from '../../assets/pricing-redesign/кнопка оплатить доступ.png';

export const PricingScreen: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = React.useState<'1month' | '3months'>('1month');
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;

  const handlePayment = async () => {
    const months = selectedPlan === '1month' ? 1 : 3;
    const result = await trackSubscriptionPurchase('premium', months);

    if (!result.success) {
      showPopupMessage('неизвестная ошибка. Пожалуйста, обратитесь в поддержку metaflora_support');
      return;
    }

    const planLabel = result.months === 3 ? '3 месяца' : '1 месяц';
    showPopupMessage(
      result.firstPurchase
        ? `подписка на ${planLabel} успешно оплачена. загляните в бота — приготовили подарки`
        : `подписка на ${planLabel} успешно оплачена`
    );
    navigate('/main-dashboard-premium');
  };

  return (
    <div style={{ position: 'relative', width: '100vw', minHeight: '100vh', background: '#020101', overflow: 'hidden' }}>
      <div style={{ position: 'relative', width: '1180px', minHeight: '2550px', transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <ThreeBg />
        <Header onLogoClick={() => navigate('/main-dashboard-premium')} />

        <div className="motion-reveal-up" style={{ position: 'absolute', left: '94px', top: '207px', width: '1020px' }}>
          <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 700, fontSize: '80px', lineHeight: '1', color: 'white' }}>
            выберите вариант подписки
          </p>
        </div>

        <div className="motion-reveal-up motion-delay-1" style={{ position: 'absolute', left: '143px', top: '399px', width: '894px', height: '79px' }}>
          <div
            className="motion-conic-border"
            style={{
              position: 'absolute',
              inset: 0,
              backdropFilter: 'blur(50px)',
              background: '#000',
              border: '4px solid rgba(255,255,255,0.3)',
              borderRadius: '30px',
              boxSizing: 'border-box',
            }}
          >
            <HaloLayer className="motion-halo-soft" style={{ inset: '18% 12%' }} />
          </div>

          <div
            className="motion-surface-content"
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '447px',
              height: '79px',
              transform: selectedPlan === '1month' ? 'translateX(0)' : 'translateX(447px)',
              transition: 'transform 520ms cubic-bezier(0.22, 1, 0.36, 1)',
              pointerEvents: 'none',
            }}
          >
            <div className="motion-conic-border" style={{ position: 'absolute', inset: 0, borderRadius: '30px', overflow: 'hidden' }}>
              <HaloLayer className="motion-halo-tight" style={{ inset: '22% 16%' }} />
              <img
                src={selectedPlan === '1month' ? activeMonthButton : activeQuarterButton}
                alt=""
                style={{ position: 'absolute', inset: 0, width: '447px', height: '79px', objectFit: 'fill' }}
              />
            </div>
          </div>

          <div
            style={{
              position: 'absolute',
              left: '80px',
              top: '13px',
              width: '289px',
              height: '40px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              fontFamily: 'Cygre',
              fontWeight: 700,
              fontSize: '40px',
              lineHeight: '1',
              color: selectedPlan === '1month' ? '#fff' : 'rgba(255,255,255,0.78)',
              textAlign: 'center',
              whiteSpace: 'nowrap',
              transition: 'color 220ms ease, transform 220ms ease',
              transform: selectedPlan === '1month' ? 'translateY(-1px)' : 'translateY(0)',
            }}
          >
            1 месяц (-10%)
          </div>

          <div
            style={{
              position: 'absolute',
              left: '497px',
              top: '12px',
              width: '321px',
              height: '40px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              fontFamily: 'Cygre',
              fontWeight: 700,
              fontSize: '40px',
              lineHeight: '1',
              color: selectedPlan === '3months' ? '#fff' : 'rgba(255,255,255,0.78)',
              textAlign: 'center',
              whiteSpace: 'nowrap',
              transition: 'color 220ms ease, transform 220ms ease',
              transform: selectedPlan === '3months' ? 'translateY(-1px)' : 'translateY(0)',
            }}
          >
            3 месяца (-20%)
          </div>

          <button
            type="button"
            onClick={() => setSelectedPlan('1month')}
            className={`motion-pressable ${selectedPlan === '1month' ? 'motion-slide-fill is-active' : 'motion-slide-fill'}`}
            style={{ position: 'absolute', left: 0, top: 0, width: '447px', height: '79px', border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', borderRadius: '30px' }}
            aria-label="1 месяц (-10%)"
          />

          <button
            type="button"
            onClick={() => setSelectedPlan('3months')}
            className={`motion-pressable ${selectedPlan === '3months' ? 'motion-slide-fill is-active' : 'motion-slide-fill'}`}
            style={{ position: 'absolute', left: '447px', top: 0, width: '447px', height: '79px', border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', borderRadius: '30px' }}
            aria-label="3 месяца (-20%)"
          />
        </div>

        <img
          src={selectedPlan === '1month' ? pricingCardMonth : pricingCardQuarter}
          alt={selectedPlan === '1month' ? 'подписка на 1 месяц' : 'подписка на 3 месяца'}
          className="motion-reveal-up motion-delay-2"
          style={{ position: 'absolute', left: '143px', top: '523px', width: '894px', height: '1178px', objectFit: 'fill' }}
        />

        <button
          type="button"
          onClick={handlePayment}
          className="motion-conic-border motion-pressable motion-reveal-up motion-delay-3"
          style={{ position: 'absolute', left: '143px', top: '1744px', width: '894px', height: '139px', cursor: 'pointer', border: 'none', background: 'transparent', padding: 0, borderRadius: '70px', overflow: 'hidden' }}
        >
          <HaloLayer className="motion-halo-soft" style={{ inset: '24% 12%' }} />
          <img
            src={payButton}
            alt="оплатить доступ"
            className="button-inner-glow motion-surface-content"
            style={{ position: 'absolute', inset: 0, width: '894px', height: '139px', objectFit: 'fill', pointerEvents: 'none' }}
          />
        </button>

        <Footer />
      </div>
    </div>
  );
};
