import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MainBackdropNew, SecondaryBlackBackdrop } from '../../components/MainBackdropNew';
import { generateScenario, getTelegramUserId } from '../../utils/labaApi';
import type { Analysis, Reel, Scenario } from '../../types/laba';
import { Footer, Header, ThreeBg } from '../../components/ScreenLayout';
import disabledFrame from '../../assets/laba-redesign/analysis-disabled-frame.png';
import createScenarioButton from '../../assets/laba-analysis/поменьше кнопка создать сценарий.png';
import metacoinSmall from '../../assets/metacoins-redesign/новый метакоин маленький.png';

export const LabaAnalysisFullScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { reel, analysis: initialAnalysis } = (location.state || {}) as { reel?: Reel; analysis?: Analysis };
  const [analysis] = React.useState<Analysis | null>(initialAnalysis || null);
  const [scenario, setScenario] = React.useState<Scenario | null>(null);
  const [generatingScenario, setGeneratingScenario] = React.useState(false);
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;

  React.useEffect(() => {
    if (!reel || !analysis) {
      navigate('/laba-main');
    }
  }, [analysis, navigate, reel]);

  if (!reel || !analysis) {
    return null;
  }

  const handleGenerateScenario = async () => {
    const userId = getTelegramUserId();
    if (!userId || !analysis.id) return;

    try {
      setGeneratingScenario(true);
      const result = await generateScenario(analysis.id, userId);
      setScenario(result);
      if (window.Telegram?.WebApp?.showPopup) {
        window.Telegram.WebApp.showPopup({ message: 'сценарий успешно создан' });
      }
    } catch (error: any) {
      console.error('Scenario generation error:', error);
      if (window.Telegram?.WebApp?.showPopup) {
        window.Telegram.WebApp.showPopup({ message: error.message || 'ошибка генерации сценария' });
      }
    } finally {
      setGeneratingScenario(false);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100vw', minHeight: '100vh', background: '#020101', overflow: 'hidden' }}>
      <div style={{ position: 'relative', width: '1180px', minHeight: '2550px', transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <ThreeBg />
        <Header onLogoClick={() => navigate('/main-dashboard-premium')} />

        <div style={{ position: 'absolute', left: '85px', top: '193px', width: '1020px' }}>
          <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 700, fontSize: '80px', lineHeight: '1', color: 'white' }}>
            ИИ-анализ контента
          </p>
        </div>

        <div style={{ position: 'absolute', left: '85px', top: '273px', width: '860px' }}>
          <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 400, fontSize: '40px', lineHeight: '1', color: 'white' }}>
            ИИ-агент проанализирует ролик и создаст новый сценарий на его основе
          </p>
        </div>

        <MainBackdropNew />

        <SecondaryBlackBackdrop style={{ minHeight: '1573px', height: 'auto', padding: '42px 53px 80px' }}>
          {[
            ['виральность', analysis.viralityExplanation || `${analysis.viralityScore || 0} баллов`],
            ['хук', analysis.hookText || '...'],
            ['транскрибация', analysis.transcription || '...'],
            ['суть видео', analysis.videoSummary || '...'],
          ].map(([title, text], idx) => (
            <div key={title} style={{ marginBottom: idx === 3 ? '32px' : '26px' }}>
              <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 700, fontSize: '40px', lineHeight: '1', color: 'white' }}>{title}</p>
              <p style={{ margin: '10px 0 0', fontFamily: 'Cygre', fontWeight: 400, fontSize: '32px', lineHeight: '1.05', color: 'white' }}>{text}</p>
            </div>
          ))}

          <div style={{ position: 'relative', width: '744px', height: '328px', margin: '18px auto 34px' }}>
            <img src={disabledFrame} alt="блюр фрейм недоступен анализ" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill', pointerEvents: 'none' }} />
            <img
              src={createScenarioButton}
              alt="создать сценарий"
              className="button-inner-glow"
              onClick={handleGenerateScenario}
              style={{ position: 'absolute', left: '107px', top: '96px', width: '530px', height: '139px', objectFit: 'contain', cursor: generatingScenario ? 'default' : 'pointer', opacity: generatingScenario ? 0.7 : 1 }}
            />
            <img src={metacoinSmall} alt="" style={{ position: 'absolute', left: '483px', top: '149px', width: '25px', height: '25px', objectFit: 'contain', pointerEvents: 'none' }} />
          </div>

          <div>
            <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 700, fontSize: '40px', lineHeight: '1', color: 'white' }}>новый сценарий</p>
            <p style={{ margin: '10px 0 0', fontFamily: 'Cygre', fontWeight: 400, fontSize: '32px', lineHeight: '1.05', color: 'white', whiteSpace: 'pre-wrap' }}>
              {generatingScenario ? 'создаем сценарий...' : scenario?.text || 'сценарий появится после генерации'}
            </p>
          </div>
        </SecondaryBlackBackdrop>

        <Footer />
      </div>
    </div>
  );
};
