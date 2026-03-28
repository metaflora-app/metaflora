import React from 'react';
import { useNavigate } from 'react-router-dom';
import { showPopupMessage } from '../../app/telegram/telegramHelpers';
import { trackMetacoinsPurchase } from '../../utils/supabase';
import { InteractiveTiltCard } from '../../components/InteractiveTiltCard';
import { Footer, Header, ThreeBg } from '../../components/ScreenLayout';
import card30000 from '../../assets/metacoins-redesign/карточка покупки 30к метакоинов.png';
import card150000 from '../../assets/metacoins-redesign/карточка покупки 150к метакоинов.png';
import activePack30000 from '../../assets/metacoins-redesign/кнопка активный пак метакоинов на 30к.png';
import activePack150000 from '../../assets/metacoins-redesign/кнопка активный пак метакоинов на 150к.png';
import buyButton from '../../assets/metacoins-redesign/кнопка большая купить метакоины.png';
import metacoinSmall from '../../assets/metacoins-redesign/новый метакоин маленький.png';

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

export const MetacoinsScreen: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPack, setSelectedPack] = React.useState<'30000' | '150000'>('30000');
  const [pillOffset, setPillOffset] = React.useState(0);
  const [isDraggingToggle, setIsDraggingToggle] = React.useState(false);
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;
  const toggleDragRef = React.useRef<{
    pointerId: number;
    startLocalX: number;
    currentLocalX: number;
    baseOffset: number;
    scaleFactor: number;
  } | null>(null);
  const smallPackInactiveLabel = useScrambleText('30 000 (-10%)', selectedPack);
  const largePackInactiveLabel = useScrambleText('150 000 (-20%)', selectedPack);

  React.useEffect(() => {
    if (!isDraggingToggle) {
      setPillOffset(selectedPack === '30000' ? 0 : TOGGLE_SEGMENT_WIDTH);
    }
  }, [isDraggingToggle, selectedPack]);

  const handleBuyClick = async () => {
    const amount = selectedPack === '30000' ? 30000 : 150000;
    const success = await trackMetacoinsPurchase(amount);
    if (success) {
      showPopupMessage(`успешно куплено ${amount} метакоинов`);
      navigate('/main-dashboard-premium');
      return;
    }
    showPopupMessage('неизвестная ошибка. Пожалуйста, обратитесь в поддержку metaflora_support');
  };

  const handleTogglePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const scaleFactor = TOGGLE_TRACK_WIDTH / rect.width;
    const localX = (event.clientX - rect.left) * scaleFactor;
    const baseOffset = selectedPack === '30000' ? 0 : TOGGLE_SEGMENT_WIDTH;

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
    const nextPack = dragDistance < 14
      ? (toggleDragRef.current.currentLocalX >= TOGGLE_SEGMENT_WIDTH ? '150000' : '30000')
      : (pillOffset >= TOGGLE_SEGMENT_WIDTH / 2 ? '150000' : '30000');

    toggleDragRef.current = null;
    setIsDraggingToggle(false);
    setSelectedPack(nextPack);
    setPillOffset(nextPack === '30000' ? 0 : TOGGLE_SEGMENT_WIDTH);
  };

  return (
    <div style={{ position: 'relative', width: '100vw', minHeight: '100vh', background: '#020101', overflow: 'hidden' }}>
      <div style={{ position: 'relative', width: '1180px', minHeight: '2550px', transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <ThreeBg />
        <Header onLogoClick={() => navigate('/main-dashboard-premium')} />

        <div style={{ position: 'absolute', left: '94px', top: '207px', width: '1020px' }}>
          <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 700, fontSize: '80px', lineHeight: '1', color: 'white' }}>выберите количество метакоинов</p>
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
              src={selectedPack === '30000' ? activePack30000 : activePack150000}
              alt={selectedPack === '30000' ? '30 000 (-10%)' : '150 000 (-20%)'}
              style={{ position: 'absolute', inset: 0, width: '447px', height: '79px', objectFit: 'fill', pointerEvents: 'none' }}
            />
          </div>

          <img src={metacoinSmall} alt="" style={{ position: 'absolute', left: '60px', top: '25px', width: '25px', height: '25px', objectFit: 'contain', pointerEvents: 'none', zIndex: 1, opacity: selectedPack === '150000' ? 1 : 0 }} />
          <div className={`pricing-toggle-label ${selectedPack === '150000' ? 'is-inactive' : 'is-active'}`} style={{ position: 'absolute', left: '87px', top: '13px', width: '275px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cygre', fontWeight: 700, fontSize: '40px', lineHeight: '1', textAlign: 'center', whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 1 }}>
            {smallPackInactiveLabel}
          </div>

          <img src={metacoinSmall} alt="" style={{ position: 'absolute', left: '482px', top: '25px', width: '25px', height: '25px', objectFit: 'contain', pointerEvents: 'none', zIndex: 1, opacity: selectedPack === '30000' ? 1 : 0 }} />
          <div className={`pricing-toggle-label ${selectedPack === '30000' ? 'is-inactive' : 'is-active'}`} style={{ position: 'absolute', left: '508px', top: '13px', width: '298px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cygre', fontWeight: 700, fontSize: '40px', lineHeight: '1', textAlign: 'center', whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 1 }}>
            {largePackInactiveLabel}
          </div>

          <button type="button" onClick={() => setSelectedPack('30000')} style={{ position: 'absolute', left: 0, top: 0, width: '447px', height: '79px', border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }} aria-label="30 000 (-10%)" />

          <button type="button" onClick={() => setSelectedPack('150000')} style={{ position: 'absolute', left: '447px', top: 0, width: '447px', height: '79px', border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }} aria-label="150 000 (-20%)" />
        </div>

        <InteractiveTiltCard
          className="pricing-card-shell"
          style={{ position: 'absolute', left: '143px', top: '523px', width: '894px', height: '1178px' }}
        >
          <div className="pricing-card-sheen-zone">
            <div className="pricing-card-sheen" />
            <div className="pricing-card-sheen pricing-card-sheen-soft" />
          </div>
          <img src={selectedPack === '30000' ? card30000 : card150000} alt={selectedPack === '30000' ? 'покупка 30к метакоинов' : 'покупка 150к метакоинов'} style={{ position: 'absolute', inset: 0, width: '894px', height: '1178px', objectFit: 'fill' }} />
        </InteractiveTiltCard>

        <button
          type="button"
          onClick={() => void handleBuyClick()}
          className="pricing-pay-shell button-inner-glow motion-press-grow"
          style={{ position: 'absolute', left: '143px', top: '1744px', width: '894px', height: '139px', border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}
        >
          <div className="pricing-pay-halo" />
          <img src={buyButton} alt="купить метакоины" style={{ position: 'absolute', inset: 0, width: '894px', height: '139px', objectFit: 'fill', pointerEvents: 'none', zIndex: 2 }} />
        </button>

        <Footer />
      </div>
    </div>
  );
};
