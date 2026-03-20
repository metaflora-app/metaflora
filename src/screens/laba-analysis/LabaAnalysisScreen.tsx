import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Footer, Header, ThreeBg } from '../../components/ScreenLayout';
import { Analysis, LABA_COSTS, Reel, Scenario } from '../../types/laba';
import { analyzeReel, formatCount, formatTimeAgo, generateScenario, getTelegramUserId, showMessage, trackAccount } from '../../utils/labaApi';
import searchUnderlay from '../../assets/laba-search-account/главная подложка новая.png';
import metacoinSmall from '../../assets/metacoins-redesign/новый метакоин маленький.png';

const textFont = 'Cygre, sans-serif';
const figmaCardCover = 'https://www.figma.com/api/mcp/asset/7f9e903d-46e2-4ee5-a7da-bed29379226d';
const figmaInstagramIcon = 'https://www.figma.com/api/mcp/asset/200ff601-2b41-4029-92e4-df8b7f6e9be8';
const figmaProfilePhoto = 'https://www.figma.com/api/mcp/asset/7c7e9ccf-5f4d-4211-9ee3-97edfc45576f';
const figmaViewsIcon = 'https://www.figma.com/api/mcp/asset/0ebdf626-69e3-4fbf-8d9e-93bb38c2a658';
const figmaCommentsIcon = 'https://www.figma.com/api/mcp/asset/f1737cfb-06b3-4dfa-ad50-233a8dec72a0';
const figmaLikesIcon = 'https://www.figma.com/api/mcp/asset/b45d8cd2-65a2-4ada-970d-40991751091f';
const figmaLikeInactive = 'https://www.figma.com/api/mcp/asset/c914514e-0b54-4b1b-8ce2-5473d0d1671f';
const figmaLikeActive = 'https://www.figma.com/api/mcp/asset/9706fd0a-d277-4e19-abed-e80b0990d5eb';

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

        <img
          src={searchUnderlay}
          alt="главная подложка"
          style={{ position: 'absolute', left: '88px', top: '399px', width: '1004px', height: '1643px', objectFit: 'fill', pointerEvents: 'none' }}
        />

        <div style={{ position: 'absolute', left: '141px', top: '455px', width: '898px', height: '1536px', background: '#000', border: '4px solid rgba(255,255,255,0.3)', borderRadius: '30px', boxSizing: 'border-box', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: '34px 49px 40px', overflowY: 'auto', overflowX: 'hidden', paddingRight: '8px' }}>
            <AnalysisPreviewCard
              reel={reel}
              isFavorite={likedCards.has(reel.id)}
              onToggleFavorite={toggleLocalFavorite}
              onTrack={() => void handleTrack()}
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
                  margin: '36px auto 0',
                  borderRadius: '30px',
                  border: '4px solid rgba(255,255,255,0.3)',
                  background: 'rgba(255,255,255,0.1)',
                  overflow: 'hidden',
                }}
              >
                <button
                  type="button"
                  onClick={() => void handleStartAnalysis()}
                  className="button-inner-glow"
                  style={{
                    position: 'absolute',
                    left: '107px',
                    top: '92px',
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
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', transform: 'translateY(-2px)' }}>
                    {analyzing ? 'анализируем...' : 'начать анализ'}
                    {!analyzing ? <img src={metacoinSmall} alt="" style={{ width: '25px', height: '25px', objectFit: 'contain' }} /> : null}
                    {!analyzing ? LABA_COSTS.ANALYZE_REEL : null}
                  </span>
                </button>
                <p
                  style={{
                    position: 'absolute',
                    left: '135px',
                    top: '245px',
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
              <div style={{ width: '744px', margin: '28px auto 0', display: 'flex', flexDirection: 'column', gap: '26px', paddingBottom: '10px' }}>
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
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                        {generatingScenario ? 'создаем сценарий...' : 'создать сценарий'}
                        {!generatingScenario ? <img src={metacoinSmall} alt="" style={{ width: '25px', height: '25px', objectFit: 'contain' }} /> : null}
                        {!generatingScenario ? LABA_COSTS.GENERATE_SCENARIO : null}
                      </span>
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
        </div>

        <Footer />
      </div>
    </div>
  );
};

const AnalysisPreviewCard: React.FC<{
  reel: Reel;
  isFavorite: boolean;
  onToggleFavorite: (reelId: string) => void;
  onTrack: () => void;
}> = ({ reel, isFavorite, onToggleFavorite, onTrack }) => {
  const displayUsername = reel.accountUsername.length > 15
    ? `${reel.accountUsername.slice(0, 15)}..`
    : reel.accountUsername;

  return (
    <div style={{ position: 'relative', width: '800px', height: '1040px', margin: '0 auto' }}>
      <div style={{ position: 'absolute', left: '28px', top: '0', width: '744px', height: '744px', borderRadius: '62px', overflow: 'hidden' }}>
        <img src={figmaCardCover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>

      <button
        type="button"
        onClick={() => onToggleFavorite(reel.id)}
        style={{
          position: 'absolute',
          left: '62px',
          top: '53px',
          width: '72px',
          height: '72px',
          border: 'none',
          background: 'rgba(4,22,39,0.1)',
          backdropFilter: 'blur(12px)',
          borderRadius: '32px',
          cursor: 'pointer',
          padding: '10px',
        }}
      >
        <div style={{ position: 'relative', width: '20px', height: '20px', margin: 'auto' }}>
          <img
            src={isFavorite ? figmaLikeActive : figmaLikeInactive}
            alt="лайк"
            style={{
              position: 'absolute',
              inset: '-30% -35% -30% -40%',
              width: 'calc(100% + 15px)',
              height: 'calc(100% + 12px)',
              maxWidth: 'none',
            }}
          />
        </div>
      </button>

      {reel.isNew ? (
        <div
          style={{
            position: 'absolute',
            right: '44px',
            top: '40px',
            minWidth: '102px',
            height: '38px',
            padding: '0 18px',
            borderRadius: '62px',
            border: '2px solid rgba(255,255,255,0.3)',
            background: 'rgba(255,255,255,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: textFont,
            fontWeight: 700,
            fontSize: '20px',
            color: '#fff',
          }}
        >
          новое
        </div>
      ) : null}

      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '72px',
          transform: 'translateX(-50%)',
          fontFamily: textFont,
          fontWeight: 400,
          fontSize: '32px',
          lineHeight: '1',
          color: '#fff',
          textAlign: 'center',
        }}
      >
        {formatTimeAgo(reel.publishedAt)}
      </div>

      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '650px',
          transform: 'translateX(-50%)',
          width: '468px',
          height: '102px',
          borderRadius: '62px',
          border: '4px solid rgba(255,255,255,0.3)',
          background: '#000',
          backdropFilter: 'blur(50px)',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
          }}
        >
          <MetricStat icon={figmaViewsIcon} value={formatCount(reel.viewsCount)} iconWidth={58} iconHeight={48} cropLeft="-69.53%" cropTop="-115.69%" cropWidth="426.73%" width={106} />
          <MetricStat icon={figmaLikesIcon} value={formatCount(reel.likesCount)} iconWidth={58} iconHeight={56} cropLeft="-193.75%" cropTop="-115.69%" cropWidth="487.69%" width={96} />
          <MetricStat icon={figmaCommentsIcon} value={formatCount(reel.commentsCount)} iconWidth={60} iconHeight={58} cropLeft="-304.47%" cropTop="-115.69%" cropWidth="487.69%" width={101} />
        </div>
      </div>

      <div style={{ position: 'absolute', left: '28px', top: '803px', width: '190px', height: '190px', borderRadius: '50%', overflow: 'hidden', background: 'rgba(255,255,255,0.12)' }}>
        <img src={figmaProfilePhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>

      <div style={{ position: 'absolute', left: '234px', top: '813px', width: '64px', height: '78px', overflow: 'hidden', opacity: 0.6 }}>
        <img
          src={figmaInstagramIcon}
          alt=""
          style={{
            position: 'absolute',
            height: '339.84%',
            left: '-56.27%',
            top: '-118.33%',
            width: '620.89%',
            maxWidth: 'none',
          }}
        />
      </div>

      <div style={{ position: 'absolute', left: '252px', top: '885px', width: '430px', fontFamily: textFont, fontWeight: 700, fontSize: '52px', lineHeight: '42px', color: '#fff', whiteSpace: 'nowrap' }}>
        @{displayUsername}
      </div>

      <div style={{ position: 'absolute', left: '249px', top: '936px', width: '350px', height: '32px', fontFamily: textFont, fontWeight: 400, fontSize: '32px', lineHeight: '32px', color: '#fff', whiteSpace: 'nowrap' }}>
        {formatCount(reel.accountFollowers)} подписчиков
      </div>

      <button
        type="button"
        onClick={onTrack}
        className="button-inner-glow"
        style={{
          position: 'absolute',
          left: '518px',
          top: '803px',
          width: '247px',
          height: '79px',
          padding: 0,
          borderRadius: '62px',
          border: '4px solid rgba(255,255,255,0.3)',
          background: 'rgba(0,0,0,0.9)',
          color: '#fff',
          fontFamily: textFont,
          fontWeight: 700,
          fontSize: '27px',
          cursor: 'pointer',
          backdropFilter: 'blur(50px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', transform: 'translateY(-3px)' }}>
          следить
          <img src={metacoinSmall} alt="" style={{ width: '19px', height: '19px', objectFit: 'contain' }} />
          100
        </span>
      </button>
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

const MetricStat: React.FC<{
  icon: string;
  value: string;
  iconWidth: number;
  iconHeight: number;
  cropLeft: string;
  cropTop: string;
  cropWidth: string;
  width: number;
}> = ({ icon, value, iconWidth, iconHeight, cropLeft, cropTop, cropWidth, width }) => (
  <div
    style={{
      minWidth: `${width}px`,
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '5px',
      flex: '0 1 auto',
    }}
  >
    <div
      style={{
        position: 'relative',
        width: `${iconWidth}px`,
        height: `${iconHeight}px`,
        overflow: 'hidden',
        flex: '0 0 auto',
      }}
    >
      <img
        src={icon}
        alt=""
        style={{
          position: 'absolute',
          height: '339.22%',
          left: cropLeft,
          top: cropTop,
          width: cropWidth,
          maxWidth: 'none',
        }}
      />
    </div>
    <div
      style={{
        fontFamily: textFont,
        fontWeight: 700,
        fontSize: '35px',
        lineHeight: '1',
        color: '#fff',
        whiteSpace: 'nowrap',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: 'translateY(-3px)',
      }}
    >
      {value}
    </div>
  </div>
);
