import React from 'react';
import { useNavigate } from 'react-router-dom';
import { showPopupMessage } from '../../app/telegram/telegramHelpers';
import { trackSubscriptionPurchase } from '../../utils/supabase';
import { ThreeBg, Header, Footer } from '../../components/ScreenLayout';

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

        <div style={{ position: 'absolute', left: '94px', top: '207px', width: '1020px' }}>
          <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 700, fontSize: '80px', lineHeight: '1', color: 'white' }}>
            выберите вариант подписки
          </p>
        </div>

        <div style={{ position: 'absolute', left: '143px', top: '399px', width: '894px', height: '79px' }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backdropFilter: 'blur(50px)',
              background: '#000',
              border: '4px solid rgba(255,255,255,0.3)',
              borderRadius: '30px',
              boxSizing: 'border-box',
            }}
          />

          {selectedPlan === '1month' ? (
            <>
              <img
                src={activeMonthButton}
                alt="1 месяц"
                style={{ position: 'absolute', left: 0, top: 0, width: '447px', height: '79px', objectFit: 'fill', pointerEvents: 'none' }}
              />
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
                  color: '#fff',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                }}
              >
                3 месяца (-20%)
              </div>
            </>
          ) : (
            <>
              <img
                src={activeQuarterButton}
                alt="3 месяца"
                style={{ position: 'absolute', left: '447px', top: 0, width: '447px', height: '79px', objectFit: 'fill', pointerEvents: 'none' }}
              />
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
                  color: '#fff',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                }}
              >
                1 месяц (-10%)
              </div>
            </>
          )}

          <button
            type="button"
            onClick={() => setSelectedPlan('1month')}
            style={{ position: 'absolute', left: 0, top: 0, width: '447px', height: '79px', border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}
            aria-label="1 месяц (-10%)"
          />

          <button
            type="button"
            onClick={() => setSelectedPlan('3months')}
            style={{ position: 'absolute', left: '447px', top: 0, width: '447px', height: '79px', border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}
            aria-label="3 месяца (-20%)"
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
