import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FigmaLikeButton } from '../../components/FigmaLikeButton';
import { MainBackdropNew, SecondaryBlackBackdrop } from '../../components/MainBackdropNew';
import { Footer, Header, ThreeBg } from '../../components/ScreenLayout';
import { openLink, showConfirm, showPopupMessage } from '../../app/telegram/telegramHelpers';
import { Analysis, Reel, Scenario } from '../../types/laba';
import {
  analyzeReel,
  formatCount,
  formatFollowersLabel,
  formatTimeAgo,
  generateScenario,
  getExistingAnalysis,
  getReelAvatarSources,
  getReelCoverSources,
  getTelegramUserId,
  getViralityColor,
  showMessage,
  toggleFavorite,
  trackAccount,
} from '../../utils/labaApi';
import { copyToClipboard } from '../../utils/clipboard';
import blurFrameMakeAnalysis from '../../assets/laba-analysis/analysis-disabled-blur-frame.png';
import blurFrameMakeScenario from '../../assets/laba-analysis/blur-frame-make-scenario.png';
import instagramLogo from '../../assets/laba-icons/лого инста.png';
import commentsIcon from '../../assets/laba-icons/иконка комментарии.png';
import likesIcon from '../../assets/laba-icons/иконка лайки.png';
import viewsIcon from '../../assets/laba-icons/иконка просмотры.png';

type ActionVariant = 'dark' | 'light';

const textFont = 'Cygre, sans-serif';
const figmaCardCover = 'https://www.figma.com/api/mcp/asset/7f9e903d-46e2-4ee5-a7da-bed29379226d';
const openReelChevronOne = 'https://www.figma.com/api/mcp/asset/c438e6ad-9b13-4d96-a92b-f79405621e12';
const openReelChevronTwo = 'https://www.figma.com/api/mcp/asset/ca4f9322-b09a-4358-a069-4bf92288177c';
const openReelChevronThree = 'https://www.figma.com/api/mcp/asset/1355747b-76c8-4fd1-a9a1-c9a669881457';
const followMetacoin = 'https://www.figma.com/api/mcp/asset/a79513b9-0b71-424b-9846-a5db2e047107';
const PREVIEW_CARD_WIDTH = 831;
const PREVIEW_CARD_HEIGHT = 1064;
const PREVIEW_CARD_INSET_X = 43;
const PREVIEW_CARD_INSET_TOP = 38;
const PREVIEW_COVER_SIZE = 742;
const LOCKED_FRAME_WIDTH = 744;
const ANALYSIS_LOCKED_FRAME_HEIGHT = 402;
const SCENARIO_LOCKED_FRAME_HEIGHT = 440;
const ANALYSIS_LOADING_FRAME_HEIGHT = 532;
const SCENARIO_LOADING_FRAME_HEIGHT = 420;

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
  const [likedCards, setLikedCards] = React.useState<Set<string>>(() => new Set(reel?.isFavorite ? [reel.id] : []));

  React.useEffect(() => {
    if (!reel) {
      return;
    }
    setLikedCards(new Set(reel.isFavorite ? [reel.id] : []));
  }, [reel]);

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

  const handleToggleFavorite = async (reelId: string) => {
    const userId = getTelegramUserId();
    if (!userId) return;

    try {
      const nextIsFavorite = await toggleFavorite(reelId, userId);
      setLikedCards((prev) => {
        const next = new Set(prev);
        if (nextIsFavorite) next.add(reelId);
        else next.delete(reelId);
        return next;
      });
      showMessage(nextIsFavorite ? 'рилс добавлен в избранное' : 'рилс удален из избранного', 'popup');
    } catch (error) {
      console.error('Ошибка избранного:', error);
      showMessage('ошибка избранного', 'popup');
    }
  };

  const handleTrack = async () => {
    const userId = getTelegramUserId();
    if (!userId) {
      showMessage('ошибка получения telegram user id', 'popup');
      return;
    }

    showMessage('ИИ-агент начал собирать рилс. Пожалуйста, подождите 30-40 секунд', 'popup');

    try {
      const result = await trackAccount(reel.accountUsername, userId);
      navigate(`/laba-tracked?accountId=${encodeURIComponent(result.accountId)}`, {
        state: {
          trackingStarted: true,
          trackedAccountId: result.accountId,
        },
      });
    } catch (error: any) {
      console.error('Ошибка отслеживания:', error);
      showMessage(error.message || 'ошибка отслеживания', 'popup');
    }
  };

  const handleStartAnalysis = async () => {
    const userId = getTelegramUserId();
    if (!userId) {
      showMessage('ошибка получения telegram user id', 'popup');
      return;
    }

    setAnalyzing(true);
    showMessage('ИИ-агент начал анализ рилс. Пожалуйста, подождите 20-30 секунд', 'popup');
    try {
      const result = await analyzeReel(reel.id, userId);
      setAnalysis(result.analysis);
      setScenario(result.scenario || null);
      showPopupMessage('анализ успешно завершен');
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
    showMessage('ИИ-агент начал создавать сценарий. Пожалуйста, подождите 20-30 секунд', 'popup');
    try {
      const result = await generateScenario(analysis.id, userId);
      setScenario(result);
      showPopupMessage('сценарий успешно создан');
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

    showPopupMessage('новый сценарий скопирован в буфер обмена');
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
          <div className="laba-feed-scroll" style={{ position: 'absolute', inset: 0, overflowY: 'auto', overflowX: 'hidden', paddingBottom: '40px' }}>
            <AnalysisPreviewCard
              reel={reel}
              isFavorite={likedCards.has(reel.id)}
              onOpenReel={() => void handleOpenReel()}
              onToggleFavorite={(reelId) => void handleToggleFavorite(reelId)}
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
              analyzing ? (
                <AnimatedBlurLoadingFrame kind="analysis" style={{ margin: '28px auto 0' }} />
              ) : (
                <LockedActionFrame
                  disabled={false}
                  frameSrc={blurFrameMakeAnalysis}
                  frameHeight={ANALYSIS_LOCKED_FRAME_HEIGHT}
                  ariaLabel="начать анализ"
                  onClick={() => void handleStartAnalysis()}
                  style={{ margin: '28px auto 0' }}
                />
              )
            ) : (
              <div style={{ width: '744px', margin: '28px auto 0', display: 'flex', flexDirection: 'column', gap: '26px', paddingBottom: '10px' }}>
                <AnalysisBlock title="виральность" body={analysis.viralityExplanation} accent={`${analysis.viralityScore} баллов`} />
                <AnalysisBlock title="хук" body={analysis.hookText} />
                <AnalysisBlock title="транскрибация" body={analysis.transcription} />
                <AnalysisBlock title="суть видео" body={analysis.videoSummary} />

                {!scenario ? (
                  generatingScenario ? (
                    <AnimatedBlurLoadingFrame kind="scenario" style={{ margin: '8px auto 0' }} />
                  ) : (
                    <LockedActionFrame
                      disabled={false}
                      frameSrc={blurFrameMakeScenario}
                      frameHeight={SCENARIO_LOCKED_FRAME_HEIGHT}
                      ariaLabel="создать сценарий"
                      onClick={() => void handleGenerateScenario()}
                      style={{ margin: '8px auto 0' }}
                    />
                  )
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
  const coverSources = React.useMemo(() => getReelCoverSources(reel), [reel]);
  const avatarSources = React.useMemo(
    () => getReelAvatarSources(reel),
    [reel]
  );
  const [coverIndex, setCoverIndex] = React.useState(0);
  const [avatarIndex, setAvatarIndex] = React.useState(0);

  React.useEffect(() => {
    setCoverIndex(0);
  }, [coverSources]);

  React.useEffect(() => {
    setAvatarIndex(0);
  }, [avatarSources]);

  const coverSrc = coverSources[coverIndex] || figmaCardCover;
  const avatarSrc = avatarSources[avatarIndex] || null;

  return (
    <div style={{ position: 'relative', width: `${PREVIEW_CARD_WIDTH}px`, height: `${PREVIEW_CARD_HEIGHT}px`, margin: '0 auto' }}>
      <div
        style={{
          position: 'absolute',
          left: `${PREVIEW_CARD_INSET_X}px`,
          top: `${PREVIEW_CARD_INSET_TOP}px`,
          width: `${PREVIEW_COVER_SIZE}px`,
          height: `${PREVIEW_COVER_SIZE}px`,
          borderRadius: '30px',
          overflow: 'hidden',
          background: 'rgba(255,255,255,0.08)',
        }}
      >
        <img
          src={coverSrc}
          alt=""
          onError={(event) => {
            const target = event.currentTarget;
            if (coverIndex < coverSources.length - 1) {
              setCoverIndex((current) => current + 1);
              return;
            }
            if (target.src !== figmaCardCover) {
              target.src = figmaCardCover;
            }
          }}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>

      <button
        type="button"
        onClick={onOpenReel}
        aria-label="открыть рилс"
        className="motion-press-grow"
        style={{
          position: 'absolute',
          left: '377px',
          top: '374px',
          width: '72px',
          height: '72px',
          border: 'none',
          background: 'transparent',
          padding: 0,
          cursor: 'pointer',
        }}
      >
        <OpenReelButton />
      </button>

      <FigmaLikeButton
        active={isFavorite}
        effectVariant="tiktok"
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
            right: '58px',
            top: '62px',
            width: '123px',
            height: '43px',
            borderRadius: '62px',
            border: '2px solid rgba(255,255,255,0.3)',
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(50px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: textFont,
            fontWeight: 700,
            fontSize: '20px',
            color: '#fff',
          }}
        >
          <span style={{ transform: 'translateY(-4px)', display: 'block', lineHeight: 1 }}>новое</span>
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
          <MetricStat icon={viewsIcon} value={formatCount(reel.viewsCount)} iconWidth={58} iconHeight={48} width={106} />
          <MetricStat icon={likesIcon} value={formatCount(reel.likesCount)} iconWidth={58} iconHeight={56} width={96} />
          <MetricStat icon={commentsIcon} value={formatCount(reel.commentsCount)} iconWidth={60} iconHeight={58} width={101} />
        </div>
      </div>

      <div style={{ position: 'absolute', left: '66px', top: '838px', width: '190px', height: '190px', borderRadius: '50%', overflow: 'hidden', background: 'rgba(255,255,255,0.12)' }}>
        {avatarSrc ? (
          <img
            src={avatarSrc}
            alt=""
            onError={() => {
              if (avatarIndex < avatarSources.length - 1) {
                setAvatarIndex((current) => current + 1);
                return;
              }
              setAvatarIndex(avatarSources.length);
            }}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : null}
      </div>

      <div style={{ position: 'absolute', left: '271px', top: '846px', width: '64px', height: '78px', overflow: 'hidden', opacity: 0.6 }}>
        <img
          src={instagramLogo}
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
      </div>

      <div style={{ position: 'absolute', left: '290px', top: '920px', width: '398px', fontFamily: textFont, fontWeight: 700, fontSize: '52px', lineHeight: '42px', color: '#fff', whiteSpace: 'nowrap' }}>
        @{displayUsername}
      </div>

      <div style={{ position: 'absolute', left: '287px', top: '971px', width: '350px', height: '32px', fontFamily: textFont, fontWeight: 400, fontSize: '32px', lineHeight: '32px', color: '#fff', whiteSpace: 'nowrap' }}>
        {formatFollowersLabel(reel.accountFollowers)}
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
}> = ({ label, cost, variant, onClick }) => {
  const [isPressed, setIsPressed] = React.useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`premium-button-shell ${isPressed ? 'is-pressed' : ''}`}
      onPointerDown={() => setIsPressed(true)}
      onPointerUp={() => setIsPressed(false)}
      onPointerLeave={() => setIsPressed(false)}
      onPointerCancel={() => setIsPressed(false)}
      style={{
        position: 'absolute',
        left: '356px',
        top: '831px',
        width: '251px',
        height: '79.63px',
        padding: 0,
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        opacity: variant === 'light' ? 0.92 : 1,
        borderRadius: '62px',
        overflow: 'hidden',
      }}
    >
      <div className="premium-button-inner" />
      <div
        className="premium-button-content"
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          borderRadius: '62px',
          overflow: 'hidden',
        }}
      >
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          minWidth: '199px',
          height: '29px',
          fontFamily: textFont,
          fontWeight: 700,
          fontSize: '27px',
          lineHeight: '1',
          color: '#fff',
          whiteSpace: 'nowrap',
        }}
      >
        <span>{label}</span>
        {typeof cost === 'number' ? (
          <>
            <span style={{ position: 'relative', width: '19px', height: '19px', display: 'inline-block', overflow: 'hidden', transform: 'translateY(0)' }}>
              <img
                src={followMetacoin}
                alt=""
                className="motion-metacoin"
                style={{
                  position: 'absolute',
                  height: '130.34%',
                  left: '-20%',
                  top: '-14.48%',
                  width: '140%',
                  maxWidth: 'none',
                }}
              />
            </span>
            <span>{cost}</span>
          </>
        ) : null}
      </div>
      </div>
    </button>
  );
};

const OpenReelButton: React.FC = () => (
  <div style={{ position: 'relative', width: '72px', height: '72px', pointerEvents: 'none' }}>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: '32px',
        background: 'rgba(4,22,39,0.1)',
        backdropFilter: 'blur(12px)',
      }}
    />
    <ChevronIcon src={openReelChevronOne} left="14px" />
    <ChevronIcon src={openReelChevronTwo} left="22px" />
    <ChevronIcon src={openReelChevronThree} left="32px" />
  </div>
);

const ChevronIcon: React.FC<{ src: string; left: string }> = ({ src, left }) => (
  <div
    style={{
      position: 'absolute',
      left,
      top: '20px',
      width: '32px',
      height: '32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <div style={{ position: 'relative', width: '32px', height: '32px' }}>
      <img
        src={src}
        alt=""
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: 'block',
        }}
      />
    </div>
  </div>
);

const LockedActionFrame: React.FC<{
  disabled: boolean;
  frameSrc: string;
  frameHeight: number;
  ariaLabel: string;
  onClick: () => void;
  style?: React.CSSProperties;
}> = ({ disabled, frameSrc, frameHeight, ariaLabel, onClick, style }) => (
  <div
    style={{
      position: 'relative',
      width: `${LOCKED_FRAME_WIDTH}px`,
      height: `${frameHeight}px`,
      overflow: 'hidden',
      ...style,
    }}
  >
    <img src={frameSrc} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill', display: 'block', pointerEvents: 'none' }} />
    <button
      type="button"
      onClick={() => {
        if (disabled) return;
        onClick();
      }}
      className="motion-press-grow"
      style={{
        position: 'absolute',
        left: '14.3817%',
        top: '17.6829%',
        width: '71.2366%',
        height: '42.378%',
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

const AnimatedBlurLoadingFrame: React.FC<{
  kind: 'analysis' | 'scenario';
  style?: React.CSSProperties;
}> = ({ kind, style }) => {
  const frameHeight = kind === 'analysis' ? ANALYSIS_LOADING_FRAME_HEIGHT : SCENARIO_LOADING_FRAME_HEIGHT;
  const largeBlockHeight = kind === 'analysis' ? 292 : 228;
  const bars = kind === 'analysis'
    ? ['84%', '68%', '56%']
    : ['88%', '61%'];

  return (
    <div
      className="blur-shimmer-frame"
      style={{
        width: `${LOCKED_FRAME_WIDTH}px`,
        height: `${frameHeight}px`,
        padding: '34px 34px 30px',
        display: 'flex',
        flexDirection: 'column',
        gap: '22px',
        ...style,
      }}
    >
      {bars.map((width, index) => (
        <div
          key={width}
          className="blur-shimmer-bar"
          style={{
            width,
            height: index === 0 ? '36px' : '28px',
            opacity: 0.92 - index * 0.12,
          }}
        />
      ))}
      <div
        className="blur-shimmer-bar"
        style={{
          width: '100%',
          height: `${largeBlockHeight}px`,
          marginTop: '6px',
          borderRadius: '26px',
        }}
      />
    </div>
  );
};

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
  width: number;
}> = ({ icon, value, iconWidth, iconHeight, width }) => (
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
          width: '100%',
          height: '100%',
          objectFit: 'contain',
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
