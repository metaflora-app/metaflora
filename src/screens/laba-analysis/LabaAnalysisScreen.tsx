import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Footer, Header, ThreeBg } from '../../components/ScreenLayout';
import { LabaFeedCard } from '../../components/laba/LabaFeedCard';
import { Analysis, LABA_COSTS, Reel, Scenario } from '../../types/laba';
import { analyzeReel, generateScenario, getTelegramUserId, showMessage, trackAccount } from '../../utils/labaApi';
import mainBackdrop from '../../assets/shared-redesign/главная подложка новая.png';
import metacoinSmall from '../../assets/metacoins-redesign/новый метакоин маленький.png';

const textFont = 'Cygre, sans-serif';
const figmaPeopleBackdrop = 'https://www.figma.com/api/mcp/asset/36cb544f-3aec-4c88-a466-642384e86fa2';
const figmaLargeLogoBackdrop = 'https://www.figma.com/api/mcp/asset/cc134e7c-9ac6-40af-a577-fca3aa01782c';

export const LabaAnalysisScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;
  const reel = (location.state as { reel?: Reel } | null)?.reel;

  const [analysis, setAnalysis] = React.useState<Analysis | null>(null);
  const [scenario, setScenario] = React.useState<Scenario | null>(null);
  const [analyzing, setAnalyzing] = React.useState(false);
  const [generatingScenario, setGeneratingScenario] = React.useState(false);
  const [likedCards, setLikedCards] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    if (!reel) navigate('/laba-main');
  }, [navigate, reel]);

  if (!reel) return null;

  const toggleLocalFavorite = (reelId: string) => {
    setLikedCards((prev) => {
      const next = new Set(prev);
      if (next.has(reelId)) next.delete(reelId);
      else next.add(reelId);
      return next;
    });
  };

  const handleTrack = async () => {
    const userId = getTelegramUserId();
    if (!userId) {
      showMessage('ошибка получения telegram user id', 'popup');
      return;
    }

    const webApp = (window as any).Telegram?.WebApp;
    if (webApp?.showPopup) {
      webApp.showPopup(
        {
          message:
            'аккаунт будет добавлен в отслеживаемые вместе с последними опубликованными reels\n\nстоимость за каждое последующее видео после отслеживания — 15 метакоинов',
        },
        async () => {
          try {
            await trackAccount(reel.accountUsername, userId);
            navigate('/laba-tracked');
          } catch (error: any) {
            console.error('Ошибка отслеживания:', error);
            showMessage(error.message || 'ошибка отслеживания', 'popup');
          }
        },
      );
    }
  };

  const handleStartAnalysis = async () => {
    const userId = getTelegramUserId();
    if (!userId) {
      showMessage('ошибка получения telegram user id', 'popup');
      return;
    }

    setAnalyzing(true);
    try {
      const result = await analyzeReel(reel.id, userId);
      setAnalysis(result);
      window.Telegram?.WebApp?.showPopup?.({ message: 'анализ успешно завершен' });
    } catch (error: any) {
      console.error('Ошибка анализа:', error);
      showMessage(error.message || 'ошибка анализа', 'popup');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerateScenario = async () => {
    if (!analysis?.id) return;
    const userId = getTelegramUserId();
    if (!userId) {
      showMessage('ошибка получения telegram user id', 'popup');
      return;
    }

    setGeneratingScenario(true);
    try {
      const result = await generateScenario(analysis.id, userId);
      setScenario(result);
      window.Telegram?.WebApp?.showPopup?.({ message: 'сценарий успешно создан' });
    } catch (error: any) {
      console.error('Ошибка генерации сценария:', error);
      showMessage(error.message || 'ошибка генерации сценария', 'popup');
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
          <p style={{ margin: 0, fontFamily: textFont, fontWeight: 700, fontSize: '80px', lineHeight: '1', color: '#fff' }}>
            ИИ-анализ контента
          </p>
        </div>

        <div style={{ position: 'absolute', left: '85px', top: '273px', width: '882px' }}>
          <p style={{ margin: 0, fontFamily: textFont, fontWeight: 400, fontSize: '40px', lineHeight: '1', color: '#fff' }}>
            ИИ-агент проанализирует ролик и создаст новый сценарий на его основе
          </p>
        </div>

        <div style={{ position: 'absolute', left: '141px', top: '449px', width: '896px', height: '1584px', pointerEvents: 'none' }}>
          <img src={figmaPeopleBackdrop} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>

        <div style={{ position: 'absolute', left: '-29px', top: '372px', width: '1285px', height: '1720px', pointerEvents: 'none' }}>
          <img src={figmaLargeLogoBackdrop} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>

        <img
          src={mainBackdrop}
          alt="главная подложка"
          style={{ position: 'absolute', left: '88px', top: '395px', width: '1004px', height: '1646px', objectFit: 'fill', pointerEvents: 'none' }}
        />

        <div style={{ position: 'absolute', left: '143px', top: '430px', width: '894px', minHeight: '1569px' }}>
          <LabaFeedCard
            reel={reel}
            isFavorite={likedCards.has(reel.id)}
            onToggleFavorite={toggleLocalFavorite}
            onAction={() => void handleTrack()}
            actionLabel="следить"
            actionCost={100}
          />

          <div style={{ width: '744px', margin: '28px auto 0' }}>
            <p style={{ margin: 0, fontFamily: textFont, fontWeight: 700, fontSize: '40px', lineHeight: '1', color: '#fff' }}>
              описание
            </p>
            <p
              style={{
                margin: '14px 0 0',
                fontFamily: textFont,
                fontWeight: 400,
                fontSize: '32px',
                lineHeight: '1.05',
                color: '#fff',
                whiteSpace: 'pre-wrap',
              }}
            >
              {reel.caption || 'без описания'}
            </p>
          </div>

          {!analysis ? (
            <div
              className="blur-wave"
              style={{
                position: 'relative',
                width: '744px',
                height: '328px',
                margin: '128px auto 0',
                borderRadius: '30px',
                border: '4px solid rgba(255,255,255,0.3)',
                background: 'rgba(255,255,255,0.08)',
                overflow: 'hidden',
              }}
            >
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.55 }}>
                <img src={figmaLargeLogoBackdrop} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <button
                type="button"
                onClick={() => void handleStartAnalysis()}
                className="button-inner-glow"
                style={{
                  position: 'absolute',
                  left: '107px',
                  top: '72px',
                  width: '530px',
                  height: '139px',
                  borderRadius: '62px',
                  border: '4px solid rgba(255,255,255,0.3)',
                  background: 'rgba(0,0,0,0.9)',
                  color: '#fff',
                  fontFamily: textFont,
                  fontWeight: 700,
                  fontSize: '32px',
                  cursor: analyzing ? 'default' : 'pointer',
                  padding: 0,
                }}
              >
                {analyzing ? (
                  <span style={{ transform: 'translateY(-2px)' }}>анализируем...</span>
                ) : (
                  <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                    <div
                      style={{
                        position: 'absolute',
                        left: '29px',
                        top: '49px',
                        width: '473px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: textFont,
                        fontWeight: 700,
                        fontSize: '32px',
                        lineHeight: '1',
                        whiteSpace: 'pre',
                      }}
                    >
                      {`начать анализ    ${LABA_COSTS.ANALYZE_REEL}`}
                    </div>
                    <div style={{ position: 'absolute', left: '398px', top: '53px', width: '25px', height: '25px', overflow: 'hidden' }}>
                      <img
                        src={metacoinSmall}
                        alt=""
                        style={{ position: 'absolute', height: '130.34%', left: '-20%', top: '-14.48%', width: '140%', maxWidth: 'none' }}
                      />
                    </div>
                  </div>
                )}
              </button>
              <p
                style={{
                  position: 'absolute',
                  left: '135px',
                  top: '238px',
                  width: '473px',
                  margin: 0,
                  fontFamily: textFont,
                  fontWeight: 400,
                  fontSize: '32px',
                  lineHeight: '1',
                  color: 'rgba(255,255,255,0.6)',
                  textAlign: 'center',
                }}
              >
                вы можете пополнить баланс в личном кабинете
              </p>
            </div>
          ) : (
            <div style={{ width: '744px', margin: '28px auto 0', display: 'flex', flexDirection: 'column', gap: '26px' }}>
              <AnalysisBlock title="виральность" body={analysis.viralityExplanation} accent={`${analysis.viralityScore} баллов`} />
              <AnalysisBlock title="хук" body={analysis.hookText} />
              <AnalysisBlock title="транскрибация" body={analysis.transcription} />
              <AnalysisBlock title="суть видео" body={analysis.videoSummary} />

              {!scenario ? (
                <div style={{ textAlign: 'center', paddingTop: '4px' }}>
                  <button
                    type="button"
                    onClick={() => void handleGenerateScenario()}
                    className="button-inner-glow"
                    style={{
                      width: '530px',
                      height: '139px',
                      borderRadius: '62px',
                      border: '4px solid rgba(255,255,255,0.3)',
                      background: 'rgba(0,0,0,0.9)',
                      color: '#fff',
                      fontFamily: textFont,
                      fontWeight: 700,
                      fontSize: '32px',
                      cursor: generatingScenario ? 'default' : 'pointer',
                    }}
                  >
                    {generatingScenario ? 'создаем сценарий...' : `создать сценарий ${LABA_COSTS.GENERATE_SCENARIO}`}
                  </button>
                  <p style={{ margin: '20px 0 0', fontFamily: textFont, fontWeight: 400, fontSize: '32px', lineHeight: '1', color: 'rgba(255,255,255,0.6)' }}>
                    вы можете пополнить баланс в личном кабинете
                  </p>
                </div>
              ) : (
                <AnalysisBlock title="новый сценарий" body={scenario.text} />
              )}
            </div>
          )}
        </div>

        <Footer />
      </div>
    </div>
  );
};

const AnalysisBlock: React.FC<{ title: string; body: string; accent?: string }> = ({ title, body, accent }) => (
  <div>
    <p style={{ margin: 0, fontFamily: textFont, fontWeight: 700, fontSize: '40px', lineHeight: '1', color: '#fff' }}>{title}</p>
    {accent ? (
      <p style={{ margin: '12px 0 0', fontFamily: textFont, fontWeight: 700, fontSize: '40px', lineHeight: '1', color: '#d5fc44' }}>
        {accent}
      </p>
    ) : null}
    <p
      style={{
        margin: '12px 0 0',
        fontFamily: textFont,
        fontWeight: 400,
        fontSize: '32px',
        lineHeight: '1.05',
        color: '#fff',
        whiteSpace: 'pre-wrap',
      }}
    >
      {body}
    </p>
  </div>
);
