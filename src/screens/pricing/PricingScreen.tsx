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

const TOGGLE_TRACK_WIDTH = 894;
const TOGGLE_SEGMENT_WIDTH = 447;
const SCRAMBLE_CHARS = 'XO01*';
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const useScrambleText = (targetText: string, triggerKey: string) => {
  const [displayText, setDisplayText] = React.useState(targetText);

  React.useEffect(() => {
    let frame = 0;
    let animationFrameId = 0;
    let timeoutId = 0;
    const totalFrames = 24;

    const tick = () => {
      frame += 1;
      const revealCount = Math.floor((frame / totalFrames) * targetText.length);
      const next = targetText
        .split('')
        .map((char, index) => {
          if (char === ' ') {
            return ' ';
          }

          if (index < revealCount) {
            return targetText[index];
          }

          return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
        })
        .join('');

      setDisplayText(frame >= totalFrames ? targetText : next);

      if (frame < totalFrames) {
        timeoutId = window.setTimeout(() => {
          animationFrameId = requestAnimationFrame(tick);
        }, 28);
      }
    };

    setDisplayText(targetText);
    animationFrameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.clearTimeout(timeoutId);
      setDisplayText(targetText);
    };
  }, [targetText, triggerKey]);

  return displayText;
};

export const PricingScreen: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = React.useState<'1month' | '3months'>('1month');
  const [pillOffset, setPillOffset] = React.useState(0);
  const [isDraggingToggle, setIsDraggingToggle] = React.useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = React.useState(false);
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;
  const toggleDragRef = React.useRef<{
    pointerId: number;
    startLocalX: number;
    currentLocalX: number;
    baseOffset: number;
    scaleFactor: number;
  } | null>(null);

  const monthInactiveLabel = useScrambleText('1 месяц (-10%)', selectedPlan);
  const quarterInactiveLabel = useScrambleText('3 месяца (-20%)', selectedPlan);

  React.useEffect(() => {
    if (!isDraggingToggle) {
      setPillOffset(selectedPlan === '1month' ? 0 : TOGGLE_SEGMENT_WIDTH);
    }
  }, [isDraggingToggle, selectedPlan]);

  const handlePayment = async () => {
    if (isProcessingPayment) {
      return;
    }

    setIsProcessingPayment(true);
    const months = selectedPlan === '1month' ? 1 : 3;
    const result = await trackSubscriptionPurchase('premium', months);

    if (!result.success) {
      setIsProcessingPayment(false);
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

  const handleTogglePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const scaleFactor = TOGGLE_TRACK_WIDTH / rect.width;
    const localX = (event.clientX - rect.left) * scaleFactor;
    const baseOffset = selectedPlan === '1month' ? 0 : TOGGLE_SEGMENT_WIDTH;

    event.currentTarget.setPointerCapture(event.pointerId);
    toggleDragRef.current = {
      pointerId: event.pointerId,
      startLocalX: localX,
      currentLocalX: localX,
      baseOffset,
      scaleFactor,
    };
    setIsDraggingToggle(true);
    setPillOffset(baseOffset);
  };

  const handleTogglePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!toggleDragRef.current || toggleDragRef.current.pointerId !== event.pointerId) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const localX = (event.clientX - rect.left) * toggleDragRef.current.scaleFactor;
    toggleDragRef.current.currentLocalX = localX;
    const delta = localX - toggleDragRef.current.startLocalX;
    setPillOffset(clamp(toggleDragRef.current.baseOffset + delta, 0, TOGGLE_SEGMENT_WIDTH));
  };

  const finishToggleDrag = () => {
    if (!toggleDragRef.current) {
      return;
    }

    const dragDistance = Math.abs(toggleDragRef.current.currentLocalX - toggleDragRef.current.startLocalX);
    const nextPlan = dragDistance < 14
      ? (toggleDragRef.current.currentLocalX >= TOGGLE_SEGMENT_WIDTH ? '3months' : '1month')
      : (pillOffset >= TOGGLE_SEGMENT_WIDTH / 2 ? '3months' : '1month');

    toggleDragRef.current = null;
    setIsDraggingToggle(false);
    setSelectedPlan(nextPlan);
    setPillOffset(nextPlan === '1month' ? 0 : TOGGLE_SEGMENT_WIDTH);
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

        <div
          className={`pricing-toggle-shell ${isDraggingToggle ? 'is-dragging' : ''}`}
          onPointerDown={handleTogglePointerDown}
          onPointerMove={handleTogglePointerMove}
          onPointerUp={finishToggleDrag}
          onPointerCancel={finishToggleDrag}
          style={{ position: 'absolute', left: '143px', top: '399px', width: '894px', height: '79px', cursor: isDraggingToggle ? 'grabbing' : 'grab' }}
        >
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
          <div className="pricing-toggle-track-glow" />

          <div
            className="pricing-toggle-pill"
            style={{
              transform: `translateX(${pillOffset}px)`,
            }}
          >
            <img
              src={selectedPlan === '1month' ? activeMonthButton : activeQuarterButton}
              alt={selectedPlan === '1month' ? '1 месяц' : '3 месяца'}
              style={{ position: 'absolute', inset: 0, width: '447px', height: '79px', objectFit: 'fill', pointerEvents: 'none' }}
            />
          </div>

          <div
            className={`pricing-toggle-label ${selectedPlan === '3months' ? 'is-inactive' : 'is-active'}`}
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
              textAlign: 'center',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          >
            {quarterInactiveLabel}
          </div>

          <div
            className={`pricing-toggle-label ${selectedPlan === '1month' ? 'is-inactive' : 'is-active'}`}
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
              textAlign: 'center',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          >
            {monthInactiveLabel}
          </div>
        </div>

        <div className="pricing-card-shell" style={{ position: 'absolute', left: '143px', top: '523px', width: '894px', height: '1178px' }}>
          <div className="pricing-card-blur-zone">
            <div className="pricing-card-halo pricing-card-halo-primary" />
            <div className="pricing-card-halo pricing-card-halo-secondary" />
            <div className="pricing-card-life" />
            <div className="pricing-card-life pricing-card-life-secondary" />
          </div>
          <img
            src={selectedPlan === '1month' ? pricingCardMonth : pricingCardQuarter}
            alt={selectedPlan === '1month' ? 'подписка на 1 месяц' : 'подписка на 3 месяца'}
            style={{ position: 'absolute', inset: 0, width: '894px', height: '1178px', objectFit: 'fill', zIndex: 0 }}
          />
        </div>

        <button
          type="button"
          onClick={() => void handlePayment()}
          className="pricing-pay-shell button-inner-glow"
          disabled={isProcessingPayment}
          style={{
            position: 'absolute',
            left: '143px',
            top: '1744px',
            width: '894px',
            height: '139px',
            cursor: isProcessingPayment ? 'progress' : 'pointer',
            border: 'none',
            background: 'transparent',
            padding: 0,
          }}
        >
          <div className="pricing-pay-halo" />
          <img
            src={payButton}
            alt="оплатить доступ"
            style={{ position: 'absolute', inset: 0, width: '894px', height: '139px', objectFit: 'fill', pointerEvents: 'none', zIndex: 2 }}
          />
        </button>

        <Footer />
      </div>
    </div>
  );
};
