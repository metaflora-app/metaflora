import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FigmaLikeButton } from '../../components/FigmaLikeButton';
import { MainBackdropNew, SecondaryBlackBackdrop } from '../../components/MainBackdropNew';
import { Footer, Header, ThreeBg } from '../../components/ScreenLayout';
import { openLink, showConfirm } from '../../app/telegram/telegramHelpers';
import { Analysis, LABA_COSTS, Reel, Scenario } from '../../types/laba';
import { analyzeReel, convertInstagramImageUrl, formatCount, formatTimeAgo, generateScenario, getTelegramUserId, showMessage, trackAccount } from '../../utils/labaApi';
import analysisDisabledBlurFramePng from '../../assets/laba-analysis/analysis-disabled-blur-frame.png';
import openReelButtonPng from '../../assets/laba-analysis/open-reel-button.png';
import shortStartAnalysisButtonPng from '../../assets/laba-analysis/short-start-analysis-button.png';
import metacoinSmall from '../../assets/metacoins-redesign/новый метакоин маленький.png';

type ActionVariant = 'dark' | 'light';

const textFont = 'Cygre, sans-serif';
const figmaCardCover = 'https://www.figma.com/api/mcp/asset/7f9e903d-46e2-4ee5-a7da-bed29379226d';
const figmaInstagramIcon = 'https://www.figma.com/api/mcp/asset/200ff601-2b41-4029-92e4-df8b7f6e9be8';
const figmaProfilePhoto = 'https://www.figma.com/api/mcp/asset/7c7e9ccf-5f4d-4211-9ee3-97edfc45576f';
const figmaViewsIcon = 'https://www.figma.com/api/mcp/asset/0ebdf626-69e3-4fbf-8d9e-93bb38c2a658';
const figmaCommentsIcon = 'https://www.figma.com/api/mcp/asset/f1737cfb-06b3-4dfa-ad50-233a8dec72a0';
const figmaLikesIcon = 'https://www.figma.com/api/mcp/asset/b45d8cd2-65a2-4ada-970d-40991751091f';
const PREVIEW_CARD_WIDTH = 824;
const PREVIEW_CARD_HEIGHT = 1054;
const PREVIEW_COVER_SIZE = 754;

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

  const handleOpenReel = async () => {
    if (!reel.reelUrl) {
      showMessage('ссылка на рилс недоступна', 'popup');
      return;
    }

    const shouldOpen = await showConfirm('открыть рилс в Instagram?');
    if (shouldOpen) {
      openLink(reel.reelUrl);
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

        <MainBackdropNew />

        <SecondaryBlackBackdrop>
          <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', overflowX: 'hidden', paddingBottom: '40px' }}>
            <AnalysisPreviewCard
              reel={reel}
              isFavorite={likedCards.has(reel.id)}
              onOpenReel={() => void handleOpenReel()}
              onToggleFavorite={toggleLocalFavorite}
              onTrack={() => void handleTrack()}
            />

            <div style={{ width: '744px', margin: '-24px auto 0' }}>
              <p style={{ margin: 0, fontFamily: textFont, fontWeight: 700, fontSize: '40px', lineHeight: '1', color: '#fff' }}>
                описание
              </p>
              <p
                style={{
                  margin: '12px 0 0',
                  fontFamily: textFont,
                  fontWeight: 400,
                  fontSize: '35px',
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
                style={{
                  position: 'relative',
                  width: '744px',
                  height: '328px',
                  margin: '28px auto 0',
                  overflow: 'hidden',
                }}
              >
                <img
                  src={analysisDisabledBlurFramePng}
                  alt=""
                  style={{ position: 'absolute', left: 0, top: '-37px', width: '744px', height: '402px', objectFit: 'fill', pointerEvents: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => void handleStartAnalysis()}
                  style={{
                    position: 'absolute',
                    left: '107px',
                    top: '59px',
                    width: '530px',
                    height: '139px',
                    cursor: analyzing ? 'default' : 'pointer',
                    padding: 0,
                    border: 'none',
                    background: 'transparent',
                  }}
                  aria-label={analyzing ? 'анализируем' : 'начать анализ'}
                >
                  <img
                    src={shortStartAnalysisButtonPng}
                    alt=""
                    style={{ width: '530px', height: '139px', objectFit: 'contain', display: 'block', pointerEvents: 'none' }}
                  />
                </button>
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
        </SecondaryBlackBackdrop>

        <Footer />
      </div>
    </div>
  );
};

const AnalysisPreviewCard: React.FC<{
  reel: Reel;
  isFavorite: boolean;
  onOpenReel: () => void;
  onToggleFavorite: (reelId: string) => void;
  onTrack: () => void;
}> = ({ reel, isFavorite, onOpenReel, onToggleFavorite, onTrack }) => {
  const displayUsername = reel.accountUsername.length > 15
    ? `${reel.accountUsername.slice(0, 15)}..`
    : reel.accountUsername;
  const coverSrc = convertInstagramImageUrl(reel.coverImageUrl) || reel.coverImageUrl || figmaCardCover;
  const avatarSrc = convertInstagramImageUrl(reel.accountProfilePicUrl) || reel.accountProfilePicUrl || figmaProfilePhoto;

  return (
    <div style={{ position: 'relative', width: `${PREVIEW_CARD_WIDTH}px`, height: `${PREVIEW_CARD_HEIGHT}px`, margin: '0 auto' }}>
      <div
        style={{
          position: 'absolute',
          left: '35px',
          top: '35px',
          width: `${PREVIEW_COVER_SIZE}px`,
          height: `${PREVIEW_COVER_SIZE}px`,
          borderRadius: '62px',
          overflow: 'hidden',
          border: 'none',
          background: 'rgba(255,255,255,0.08)',
        }}
      >
        <img
          src={coverSrc}
          alt=""
          crossOrigin="anonymous"
          onError={(event) => {
            const target = event.currentTarget;
            if (target.src !== figmaCardCover) {
              target.src = figmaCardCover;
            }
          }}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>

      <FigmaLikeButton
        active={isFavorite}
        onClick={() => onToggleFavorite(reel.id)}
        style={{
          position: 'absolute',
          left: '62px',
          top: '53px',
        }}
      />

      {reel.isNew ? (
        <div
          className="blur-wave"
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

      <OpenReelButton onClick={onOpenReel} />

      <div
        className="blur-wave"
        style={{
          position: 'absolute',
          left: '178px',
          top: '654px',
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

      <div style={{ position: 'absolute', left: '66px', top: '807px', width: '190px', height: '190px', borderRadius: '50%', overflow: 'hidden', background: 'rgba(255,255,255,0.12)' }}>
        <img
          src={avatarSrc}
          alt=""
          crossOrigin="anonymous"
          onError={(event) => {
            const target = event.currentTarget;
            if (target.src !== figmaProfilePhoto) {
              target.src = figmaProfilePhoto;
            }
          }}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>

      <div style={{ position: 'absolute', left: '271px', top: '815px', width: '64px', height: '78px', overflow: 'hidden', opacity: 0.6 }}>
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

      <div style={{ position: 'absolute', left: '290px', top: '889px', width: '398px', fontFamily: textFont, fontWeight: 700, fontSize: '52px', lineHeight: '42px', color: '#fff', whiteSpace: 'nowrap' }}>
        @{displayUsername}
      </div>

      <div style={{ position: 'absolute', left: '287px', top: '940px', width: '350px', height: '32px', fontFamily: textFont, fontWeight: 400, fontSize: '32px', lineHeight: '32px', color: '#fff', whiteSpace: 'nowrap' }}>
        {formatCount(reel.accountFollowers)} подписчиков
      </div>

      <ActionButton
        label="следить"
        cost={100}
        variant="dark"
        onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
          event.stopPropagation();
          onTrack();
        }}
      />
    </div>
  );
};

const OpenReelButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      position: 'absolute',
      left: '377px',
      top: '374px',
      width: '72px',
      height: '72px',
      border: 'none',
      background: 'transparent',
      cursor: 'pointer',
      padding: 0,
    }}
    aria-label="открыть рилс"
  >
    <img src={openReelButtonPng} alt="" style={{ width: '72px', height: '72px', objectFit: 'contain', display: 'block', pointerEvents: 'none' }} />
  </button>
);

const ActionButton: React.FC<{
  label: string;
  cost?: number;
  variant: ActionVariant;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
}> = ({ label, cost, variant, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="button-inner-glow"
    style={{
      position: 'absolute',
      left: '356px',
      top: '800px',
      width: '247px',
      height: '79px',
      padding: 0,
      borderRadius: '62px',
      border: '4px solid rgba(255,255,255,0.3)',
      background: variant === 'light' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.9)',
      color: '#fff',
      fontFamily: textFont,
      fontWeight: 700,
      fontSize: '27px',
      cursor: 'pointer',
      boxShadow: variant === 'light' ? 'inset 0 0 40px rgba(255,255,255,0.16)' : 'none',
      backdropFilter: 'blur(50px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    {typeof cost === 'number' ? (
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <div
          style={{
            position: 'absolute',
            left: '24px',
            top: '17px',
            width: '199px',
            height: '29px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: textFont,
            fontWeight: 700,
            fontSize: '27px',
            lineHeight: '1',
            whiteSpace: 'pre',
          }}
        >
          {`${label}    ${cost}`}
        </div>
        <div style={{ position: 'absolute', left: '150px', top: '26px', width: '19px', height: '19px', overflow: 'hidden' }}>
          <img src={metacoinSmall} alt="" style={{ width: '19px', height: '19px', objectFit: 'contain' }} />
        </div>
      </div>
    ) : (
      <span style={{ transform: 'translateY(-4px)' }}>{label}</span>
    )}
  </button>
);

const AnalysisBlock: React.FC<{ title: string; body: string; accent?: string }> = ({ title, body, accent }) => (
  <div>
    <p style={{ margin: 0, fontFamily: textFont, fontWeight: 700, fontSize: '40px', lineHeight: '1', color: '#fff' }}>{title}</p>
    {accent ? (
      <p style={{ margin: '12px 0 0', fontFamily: textFont, fontWeight: 700, fontSize: '35px', lineHeight: '1', color: '#d5fc44' }}>
        {accent}
      </p>
    ) : null}
    <p
      style={{
        margin: '12px 0 0',
        fontFamily: textFont,
        fontWeight: 400,
        fontSize: '35px',
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
