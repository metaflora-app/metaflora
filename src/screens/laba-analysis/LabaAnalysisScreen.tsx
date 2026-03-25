import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FigmaLikeButton } from '../../components/FigmaLikeButton';
import { MainBackdropNew, SecondaryBlackBackdrop } from '../../components/MainBackdropNew';
import { Footer, Header, ThreeBg } from '../../components/ScreenLayout';
import { openLink, showConfirm } from '../../app/telegram/telegramHelpers';
import { Analysis, Reel, Scenario } from '../../types/laba';
import { analyzeReel, formatCount, formatTimeAgo, generateScenario, getExistingAnalysis, getInstagramAvatarSrc, getReelCoverSrc, getTelegramUserId, getViralityColor, showMessage, trackAccount } from '../../utils/labaApi';
import { copyToClipboard } from '../../utils/clipboard';
import metacoinSmall from '../../assets/metacoins-redesign/новый метакоин маленький.png';
import blurFrameMakeAnalysis from '../../assets/laba-analysis/blur-frame-make-analysis.png';
import blurFrameMakeScenario from '../../assets/laba-analysis/blur-frame-make-scenario.png';

type ActionVariant = 'dark' | 'light';

const textFont = 'Cygre, sans-serif';
const figmaCardCover = 'https://www.figma.com/api/mcp/asset/7f9e903d-46e2-4ee5-a7da-bed29379226d';
const figmaInstagramIcon = 'https://www.figma.com/api/mcp/asset/200ff601-2b41-4029-92e4-df8b7f6e9be8';
const figmaProfilePhoto = 'https://www.figma.com/api/mcp/asset/7c7e9ccf-5f4d-4211-9ee3-97edfc45576f';
const figmaViewsIcon = 'https://www.figma.com/api/mcp/asset/0ebdf626-69e3-4fbf-8d9e-93bb38c2a658';
const figmaCommentsIcon = 'https://www.figma.com/api/mcp/asset/f1737cfb-06b3-4dfa-ad50-233a8dec72a0';
const figmaLikesIcon = 'https://www.figma.com/api/mcp/asset/b45d8cd2-65a2-4ada-970d-40991751091f';
const figmaOpenReelChevron1 = 'https://www.figma.com/api/mcp/asset/6686ea99-376f-431b-96fb-359d8843df95';
const figmaOpenReelChevron2 = 'https://www.figma.com/api/mcp/asset/40578be4-a6d1-4b7b-851d-2e0e7a925feb';
const figmaOpenReelChevron3 = 'https://www.figma.com/api/mcp/asset/d56cba13-009a-442d-b106-7edce51a1b64';
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
  const [hydratingAnalysis, setHydratingAnalysis] = React.useState(true);
  const [likedCards, setLikedCards] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    if (!reel) navigate('/laba-main');
  }, [navigate, reel]);

  React.useEffect(() => {
    let cancelled = false;

    const hydrateExistingAnalysis = async () => {
      if (!reel) return;

      setHydratingAnalysis(true);
      setAnalysis(null);
      setScenario(null);

      const userId = getTelegramUserId();
      if (!userId) {
        if (!cancelled) setHydratingAnalysis(false);
        return;
      }

      try {
        const result = await getExistingAnalysis(reel.id, userId);
        if (cancelled) return;

        setAnalysis(result.analysis);
        setScenario(result.scenario || null);
      } catch (error) {
        console.error('Ошибка загрузки сохраненного анализа:', error);
      } finally {
        if (!cancelled) setHydratingAnalysis(false);
      }
    };

    void hydrateExistingAnalysis();

    return () => {
      cancelled = true;
    };
  }, [reel]);

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
      setAnalysis(result.analysis);
      setScenario(result.scenario || null);
      window.Telegram?.WebApp?.showPopup?.({ message: 'анализ успешно завершен' });
    } catch (error: any) {
      console.error('Ошибка анализа:', error);
      showMessage(error.message || 'ошибка анализа', 'popup');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerateScenario = async () => {
    if (!analysis?.id || generatingScenario) return;
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

  const handleCopyScenario = async () => {
    if (!scenario?.text) return;

    const copied = await copyToClipboard(scenario.text);
    if (!copied) return;

    window.Telegram?.WebApp?.showPopup?.({ message: 'сценарий скопирован в буфер обмена' });
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
            {hydratingAnalysis ? null : !analysis ? (
              <LockedActionFrame
                frameSrc={blurFrameMakeAnalysis}
                disabled={analyzing}
                ariaLabel={analyzing ? 'анализируем' : 'начать анализ'}
                onClick={() => void handleStartAnalysis()}
                style={{ margin: '28px auto 0' }}
              />
            ) : (
              <div style={{ width: '744px', margin: '28px auto 0', display: 'flex', flexDirection: 'column', gap: '26px', paddingBottom: '10px' }}>
                <AnalysisBlock title="виральность" body={analysis.viralityExplanation} accent={`${analysis.viralityScore} баллов`} />
                <AnalysisBlock title="хук" body={analysis.hookText} />
                <AnalysisBlock title="транскрибация" body={analysis.transcription} />
                <AnalysisBlock title="суть видео" body={analysis.videoSummary} />

                {!scenario ? (
                  <LockedActionFrame
                    frameSrc={blurFrameMakeScenario}
                    disabled={generatingScenario}
                    ariaLabel="создать сценарий"
                    onClick={() => void handleGenerateScenario()}
                    style={{ margin: '12px auto 0' }}
                  />
                ) : (
                  <AnalysisBlock title="новый сценарий" body={scenario.text} bodyClickable onBodyClick={() => void handleCopyScenario()} />
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
  const coverSrc = getReelCoverSrc(reel) || reel.coverImageUrl || figmaCardCover;
  const avatarSrc = getInstagramAvatarSrc(reel.accountUsername, reel.accountProfilePicUrl) || reel.accountProfilePicUrl || figmaProfilePhoto;

  return (
    <div style={{ position: 'relative', width: `${PREVIEW_CARD_WIDTH}px`, height: `${PREVIEW_CARD_HEIGHT}px`, margin: '0 auto' }}>
      <button
        type="button"
        onClick={onOpenReel}
        aria-label="открыть рилс"
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
          padding: 0,
          cursor: 'pointer',
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
      </button>

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

const LockedActionFrame: React.FC<{
  frameSrc: string;
  disabled: boolean;
  ariaLabel: string;
  onClick: () => void;
  style?: React.CSSProperties;
}> = ({ frameSrc, disabled, ariaLabel, onClick, style }) => (
  <div
    style={{
      position: 'relative',
      width: '744px',
      height: '328px',
      overflow: 'hidden',
      ...style,
    }}
  >
    <img
      src={frameSrc}
      alt=""
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '328px',
        objectFit: 'cover',
        pointerEvents: 'none',
      }}
    />
    <button
      type="button"
      onClick={() => {
        if (disabled) return;
        onClick();
      }}
      style={{
        position: 'absolute',
        left: '107px',
        top: '59px',
        width: '530px',
        height: '139px',
        padding: 0,
        border: 'none',
        borderRadius: '62px',
        background: 'transparent',
        cursor: disabled ? 'default' : 'pointer',
      }}
      aria-label={ariaLabel}
      aria-disabled={disabled}
    />
  </div>
);

const AnalysisBlock: React.FC<{ title: string; body: string; accent?: string; bodyClickable?: boolean; onBodyClick?: () => void }> = ({ title, body, accent, bodyClickable = false, onBodyClick }) => (
  <div>
    <p style={{ margin: 0, fontFamily: textFont, fontWeight: 700, fontSize: '40px', lineHeight: '1', color: '#fff' }}>{title}</p>
    {accent ? (
      <p style={{ margin: '12px 0 0', fontFamily: textFont, fontWeight: 700, fontSize: '35px', lineHeight: '1', color: getViralityColor(Number.parseInt(accent, 10) || 0) }}>
        {accent}
      </p>
    ) : null}
    <p
      onClick={onBodyClick}
      style={{
        margin: '12px 0 0',
        fontFamily: textFont,
        fontWeight: 400,
        fontSize: '35px',
        lineHeight: '1.05',
        color: '#fff',
        whiteSpace: 'pre-wrap',
        cursor: bodyClickable ? 'pointer' : 'default',
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
