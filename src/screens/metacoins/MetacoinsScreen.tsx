import React from 'react';
import { useNavigate } from 'react-router-dom';
import { trackMetacoinsPurchase } from '../../utils/supabase';
import { Footer, Header, ThreeBg } from '../../components/ScreenLayout';

import card30000 from '../../assets/metacoins-redesign/карточка покупки 30к метакоинов.png';
import card150000 from '../../assets/metacoins-redesign/карточка покупки 150к метакоинов.png';
import activePack30000 from '../../assets/metacoins-redesign/кнопка активный пак метакоинов на 30к.png';
import activePack150000 from '../../assets/metacoins-redesign/кнопка активный пак метакоинов на 150к.png';
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
      if (window.Telegram?.WebApp?.showPopup) {
        window.Telegram.WebApp.showPopup({
          message: `успешно куплено ${amount} метакоинов`,
        });
        setTimeout(() => {
          navigate('/main-dashboard-premium');
        }, 100);
      } else {
        alert(`успешно куплено ${amount} метакоинов`);
        navigate('/main-dashboard-premium');
      }
      return;
    }

    if (window.Telegram?.WebApp?.showPopup) {
      window.Telegram.WebApp.showPopup({
        message: 'ошибка при покупке метакоинов',
      });
    } else {
      alert('ошибка при покупке метакоинов');
    }
  };


  return (
    <div style={{ position: 'relative', width: '100vw', minHeight: '100vh', background: '#020101', overflow: 'hidden' }}>
      <div style={{ position: 'relative', width: '1180px', minHeight: '2550px', transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <ThreeBg />
        <Header onLogoClick={() => navigate('/main-dashboard-premium')} />

        <div style={{ position: 'absolute', left: '94px', top: '207px', width: '1020px' }}>
          <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 700, fontSize: '80px', lineHeight: '1', color: 'white' }}>
            выберите количество метакоинов
          </p>
        </div>

        <div style={{ position: 'absolute', left: '143px', top: '399px', width: '894px', height: '79.25px', border: '4px solid rgba(255,255,255,0.3)', borderRadius: '30px', background: 'rgba(0,0,0,0.95)', overflow: 'hidden', boxSizing: 'border-box' }}>
          <button
            type="button"
            onClick={() => setSelectedPack('30000')}
            style={{ position: 'absolute', left: 0, top: 0, width: '447px', height: '79px', border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}
          >
            {selectedPack === '30000' ? (
              <img src={activePack30000} alt="30 000 (-10%)" style={{ width: '447px', height: '79px', objectFit: 'fill' }} />
            ) : null}
          </button>

          <button
            type="button"
            onClick={() => setSelectedPack('150000')}
            style={{ position: 'absolute', left: '447px', top: 0, width: '447px', height: '79px', border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}
          >
            {selectedPack === '150000' ? (
              <img src={activePack150000} alt="150 000 (-20%)" style={{ width: '447px', height: '79px', objectFit: 'fill' }} />
            ) : null}
          </button>

          {selectedPack === '30000' ? (
            <>
              <img src={metacoinSmall} alt="" style={{ position: 'absolute', left: '478px', top: '21px', width: '25px', height: '25px', objectFit: 'contain', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', left: '529px', top: '18px', width: '296px', display: 'flex', justifyContent: 'center', fontFamily: 'Cygre', fontWeight: 700, fontSize: '40px', lineHeight: '1', color: 'white', pointerEvents: 'none', whiteSpace: 'nowrap' }}>
                150 000 (-20%)
              </div>
            </>
          ) : (
            <>
              <img src={metacoinSmall} alt="" style={{ position: 'absolute', left: '56px', top: '21px', width: '25px', height: '25px', objectFit: 'contain', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', left: '100px', top: '18px', width: '296px', display: 'flex', justifyContent: 'center', fontFamily: 'Cygre', fontWeight: 700, fontSize: '40px', lineHeight: '1', color: 'white', pointerEvents: 'none', whiteSpace: 'nowrap' }}>
                30 000 (-10%)
              </div>
            </>
          )}
        </div>

        <img
          src={selectedPack === '30000' ? card30000 : card150000}
          alt={selectedPack === '30000' ? 'покупка 30к метакоинов' : 'покупка 150к метакоинов'}
          style={{ position: 'absolute', left: '143px', top: '523px', width: '894px', height: '1178px', objectFit: 'fill' }}
        />

        <img
          src={buyButton}
          alt="купить метакоины"
          onClick={handleBuyClick}
          className="button-inner-glow"
          style={{ position: 'absolute', left: '143px', top: '1744px', width: '894px', height: '139px', objectFit: 'fill', cursor: 'pointer' }}
        />

        <Footer />
      </div>
    </div>
  );
};
