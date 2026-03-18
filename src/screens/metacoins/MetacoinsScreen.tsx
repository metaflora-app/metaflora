import React from 'react';
import { useNavigate } from 'react-router-dom';
import { trackMetacoinsPurchase } from '../../utils/supabase';
import { Footer, Header, ThreeBg } from '../../components/ScreenLayout';
import card30000 from '../../assets/metacoins-redesign/карточка покупки 30к метакоинов.png';
import card150000 from '../../assets/metacoins-redesign/карточка покупки 150к метакоинов.png';
import activePack30000 from '../../assets/metacoins-redesign/кнопка активный пак метакоинов на 30к.png';
import activePack150000 from '../../assets/metacoins-redesign/кнопка активный пак метакоинов на 150к.png';
import choiceWindow from '../../assets/metacoins-redesign/окошко выбор пака метакоинов.png';
import buyButton from '../../assets/metacoins-redesign/кнопка большая купить метакоины.png';
import metacoinSmall from '../../assets/metacoins-redesign/новый метакоин маленький.png';

export const MetacoinsScreen: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPack, setSelectedPack] = React.useState<'30000' | '150000'>('30000');
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;

  const handleBuyClick = async () => {
    const amount = selectedPack === '30000' ? 30000 : 150000;
    const success = await trackMetacoinsPurchase(amount);
    if (success) {
      window.Telegram?.WebApp?.showPopup?.({ message: `успешно куплено ${amount} метакоинов` });
      navigate('/main-dashboard-premium');
      return;
    }
    window.Telegram?.WebApp?.showPopup?.({ message: 'ошибка при покупке метакоинов' });
  };

  const renderInactiveOption = (type: '30000' | '150000') => {
    if (type === '30000') {
      return (
        <>
          <img src={metacoinSmall} alt="" style={{ position: 'absolute', left: '58px', top: '21px', width: '25px', height: '25px', objectFit: 'contain', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', left: '220.5px', top: '29px', transform: 'translate(-50%, -50%)', fontFamily: 'Cygre', fontWeight: 700, fontSize: '40px', lineHeight: '1', color: 'white', textAlign: 'center', whiteSpace: 'nowrap', pointerEvents: 'none' }}>
            30 000 (-10%)
          </div>
        </>
      );
    }

    return (
      <>
        <img src={metacoinSmall} alt="" style={{ position: 'absolute', left: '478px', top: '21px', width: '25px', height: '25px', objectFit: 'contain', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', left: '653px', top: '28px', transform: 'translate(-50%, -50%)', fontFamily: 'Cygre', fontWeight: 700, fontSize: '40px', lineHeight: '1', color: 'white', textAlign: 'center', whiteSpace: 'nowrap', pointerEvents: 'none' }}>
          150 000 (-20%)
        </div>
      </>
    );
  };

  return (
    <div style={{ position: 'relative', width: '100vw', minHeight: '100vh', background: '#020101', overflow: 'hidden' }}>
      <div style={{ position: 'relative', width: '1180px', minHeight: '2550px', transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <ThreeBg />
        <Header onLogoClick={() => navigate('/main-dashboard-premium')} />

        <div style={{ position: 'absolute', left: '94px', top: '207px', width: '1020px' }}>
          <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 700, fontSize: '80px', lineHeight: '1', color: 'white' }}>выберите количество метакоинов</p>
        </div>

        <div style={{ position: 'absolute', left: '143px', top: '399px', width: '894px', height: '79px' }}>
          <img src={choiceWindow} alt="выбор пака метакоинов" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill', pointerEvents: 'none' }} />

          {selectedPack === '30000' ? renderInactiveOption('150000') : renderInactiveOption('30000')}

          <button type="button" onClick={() => setSelectedPack('30000')} style={{ position: 'absolute', left: 0, top: 0, width: '447px', height: '79px', border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}>
            {selectedPack === '30000' ? <img src={activePack30000} alt="30 000 (-10%)" style={{ width: '447px', height: '79px', objectFit: 'fill' }} /> : null}
          </button>

          <button type="button" onClick={() => setSelectedPack('150000')} style={{ position: 'absolute', left: '447px', top: 0, width: '447px', height: '79px', border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}>
            {selectedPack === '150000' ? <img src={activePack150000} alt="150 000 (-20%)" style={{ width: '447px', height: '79px', objectFit: 'fill' }} /> : null}
          </button>
        </div>

        <img src={selectedPack === '30000' ? card30000 : card150000} alt={selectedPack === '30000' ? 'покупка 30к метакоинов' : 'покупка 150к метакоинов'} style={{ position: 'absolute', left: '143px', top: '523px', width: '894px', height: '1178px', objectFit: 'fill' }} />

        <img src={buyButton} alt="купить метакоины" onClick={handleBuyClick} className="button-inner-glow" style={{ position: 'absolute', left: '143px', top: '1744px', width: '894px', height: '139px', objectFit: 'fill', cursor: 'pointer' }} />

        <Footer />
      </div>
    </div>
  );
};
