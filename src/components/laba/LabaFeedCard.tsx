import React from 'react';
import { FigmaLikeButton } from '../FigmaLikeButton';
import { LabaAccountHeaderRow } from './LabaAccountHeaderRow';
import type { Reel } from '../../types/laba';
import {
  formatCount,
  formatTimeAgo,
  getReelAvatarSources,
  getReelCoverSources,
} from '../../utils/labaApi';
import commentsIcon from '../../assets/laba-icons/иконка комментарии.png';
import likesIcon from '../../assets/laba-icons/иконка лайки.png';
import viewsIcon from '../../assets/laba-icons/иконка просмотры.png';
import shortTrackedActiveButton from '../../assets/laba-main-buttons/кнопка следить очень короткая актив.png';
import metacoinSmall from '../../assets/metacoins-redesign/новый метакоин маленький.png';
import openReelChevronOne from '../../assets/laba-analysis/open-reel-chevron-1.png';
import openReelChevronTwo from '../../assets/laba-analysis/open-reel-chevron-2.png';
import openReelChevronThree from '../../assets/laba-analysis/open-reel-chevron-3.png';

type ActionVariant = 'dark' | 'light';

interface LabaFeedCardProps {
  reel: Reel;
  isFavorite: boolean;
  onToggleFavorite: (reelId: string) => void;
  onAction?: () => void;
  onOpenAnalysis?: () => void;
  onOpenReel?: () => void;
  actionLabel: string;
  actionCost?: number;
  actionVariant?: ActionVariant;
  actionButtonImageSrc?: string;
  openAnalysisButtonSrc?: string;
  activityPillTop?: number;
  likeEffectVariant?: 'default' | 'tiktok';
  actionMotionVariant?: 'default' | 'premium';
}

const CARD_WIDTH = 831;
const CARD_HEIGHT = 1064;
const CARD_INSET_X = 31;
const CARD_INSET_TOP = 31;
const COVER_SIZE = 769;

const textFont = 'Cygre, sans-serif';
export const LabaFeedCard: React.FC<LabaFeedCardProps> = ({
  reel,
  isFavorite,
  onToggleFavorite,
  onAction,
  onOpenAnalysis,
  onOpenReel,
  actionLabel,
  actionCost,
  actionVariant = 'dark',
  actionButtonImageSrc,
  openAnalysisButtonSrc,
  activityPillTop = 654,
  likeEffectVariant = 'default',
  actionMotionVariant = 'default',
}) => {
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
  const [isAnalysisPressed, setIsAnalysisPressed] = React.useState(false);
  const coverSrc = coverSources[coverIndex] || null;
  const avatarSrc = avatarSources[avatarIndex] || null;

  React.useEffect(() => {
    setCoverIndex(0);
  }, [coverSources]);

  React.useEffect(() => {
    setAvatarIndex(0);
  }, [avatarSources]);

  const resolvedActionButtonImageSrc =
    actionButtonImageSrc ?? (typeof actionCost === 'number' ? undefined : shortTrackedActiveButton);

  return (
    <div
      onClick={onOpenAnalysis}
      style={{
        position: 'relative',
        width: `${CARD_WIDTH}px`,
        minHeight: `${CARD_HEIGHT}px`,
        margin: '0 auto',
        cursor: onOpenAnalysis ? 'pointer' : 'default',
      }}
    >
      <div
        className="blur-wave"
        style={{
          position: 'absolute',
          inset: 0,
          backdropFilter: 'blur(50px)',
          background: '#000',
          border: '4px solid rgba(255,255,255,0.3)',
          borderRadius: '30px',
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: `${CARD_INSET_X}px`,
          top: `${CARD_INSET_TOP}px`,
          width: `${COVER_SIZE}px`,
          height: `${COVER_SIZE}px`,
          borderRadius: '30px',
          overflow: 'hidden',
          border: '2px solid rgba(0,0,0,0.3)',
          background: 'rgba(255,255,255,0.08)',
        }}
      >
        {coverSrc ? (
          <img
            src={coverSrc}
            alt=""
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => {
              if (coverIndex < coverSources.length - 1) {
                setCoverIndex((current) => current + 1);
              }
            }}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : null}
      </div>

      <FigmaLikeButton
        active={isFavorite}
        effectVariant={likeEffectVariant}
        onClick={(event) => {
          event.stopPropagation();
          onToggleFavorite(reel.id);
        }}
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
            textTransform: 'lowercase',
          }}
        >
          <span style={{ transform: 'translateY(-4px)', display: 'block', lineHeight: 1 }}>новое</span>
        </div>
      ) : null}

      {onOpenAnalysis && openAnalysisButtonSrc ? (
        <button
          type="button"
          className={`premium-button-shell ${isAnalysisPressed ? 'is-pressed' : ''}`}
          onClick={(event) => {
            event.stopPropagation();
            onOpenAnalysis();
          }}
          onPointerDown={() => setIsAnalysisPressed(true)}
          onPointerUp={() => setIsAnalysisPressed(false)}
          onPointerLeave={() => setIsAnalysisPressed(false)}
          onPointerCancel={() => setIsAnalysisPressed(false)}
          style={{
            position: 'absolute',
            left: openAnalysisButtonSrc ? '288px' : '377px',
            top: openAnalysisButtonSrc ? '370px' : '374px',
            width: openAnalysisButtonSrc ? '251px' : '72px',
            height: openAnalysisButtonSrc ? '80px' : '72px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            padding: 0,
            zIndex: 3,
            borderRadius: '62px',
            overflow: 'hidden',
          }}
        >
          <div className="premium-button-inner" />
          <img
            src={openAnalysisButtonSrc}
            alt=""
            className="button-inner-glow"
            style={{
              position: 'absolute',
              inset: '2px',
              width: 'calc(100% - 4px)',
              height: 'calc(100% - 4px)',
              objectFit: 'contain',
              display: 'block',
              pointerEvents: 'none',
              zIndex: 2,
            }}
          />
        </button>
      ) : null}

      {onOpenReel ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onOpenReel();
          }}
          aria-label="открыть рилс"
          className="motion-press-grow"
          style={{
            position: 'absolute',
            left: '380px',
            top: '374px',
            width: '72px',
            height: '72px',
            border: 'none',
            background: 'transparent',
            padding: 0,
            cursor: 'pointer',
            zIndex: 4,
          }}
        >
          <OpenReelButton />
        </button>
      ) : null}

      <div
        className="blur-wave"
        style={{
          position: 'absolute',
          left: '50%',
          top: `${activityPillTop}px`,
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
            transform: 'translateY(0px)',
          }}
        >
          <MetricStat icon={viewsIcon} value={formatCount(reel.viewsCount)} iconWidth={58} iconHeight={48} width={106} />
          <MetricStat icon={likesIcon} value={formatCount(reel.likesCount)} iconWidth={58} iconHeight={56} width={96} />
          <MetricStat icon={commentsIcon} value={formatCount(reel.commentsCount)} iconWidth={60} iconHeight={58} width={101} />
        </div>
      </div>

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

      <LabaAccountHeaderRow
        username={displayUsername}
        followersCount={reel.accountFollowers}
        avatarSrc={avatarSrc}
        avatarContainerStyle={{
          left: '62px',
          top: '838px',
          width: '190px',
          height: '190px',
          borderRadius: '50%',
        }}
        logoStyle={{
          left: '268px',
          top: '846px',
          display: 'block',
        }}
        usernameStyle={{
          position: 'absolute',
          left: '284px',
          top: '926px',
          width: '398px',
          fontFamily: textFont,
          fontWeight: 700,
          fontSize: '52px',
          lineHeight: '42px',
          color: '#fff',
          whiteSpace: 'nowrap',
        }}
        followersStyle={{
          position: 'absolute',
          left: '281px',
          top: '977px',
          width: '350px',
          height: '32px',
          fontFamily: textFont,
          fontWeight: 400,
          fontSize: '32px',
          lineHeight: '32px',
          color: '#fff',
          whiteSpace: 'nowrap',
        }}
        onAvatarError={() => {
          if (avatarIndex < avatarSources.length - 1) {
            setAvatarIndex((current) => current + 1);
            return;
          }
          setAvatarIndex(avatarSources.length);
        }}
        avatarImgProps={{ referrerPolicy: 'no-referrer' }}
      />

      <ActionButton
        label={actionLabel}
        cost={actionCost}
        variant={actionVariant}
        imageSrc={resolvedActionButtonImageSrc}
        motionVariant={actionMotionVariant}
        onClick={(event) => {
          event.stopPropagation();
          onAction?.();
        }}
      />
    </div>
  );
};

interface PlaceholderProps {
  showAccountRow?: boolean;
  showActionRow?: boolean;
}

export const LabaFeedPlaceholderCard: React.FC<PlaceholderProps> = ({
  showAccountRow = true,
  showActionRow = true,
}) => (
  <div style={{ position: 'relative', width: `${CARD_WIDTH}px`, minHeight: `${CARD_HEIGHT}px`, margin: '0 auto' }}>
    <div
      className="blur-wave"
      style={{
        position: 'absolute',
        inset: 0,
        backdropFilter: 'blur(50px)',
        background: 'rgba(0,0,0,0.5)',
        border: '4px solid rgba(255,255,255,0.2)',
        borderRadius: '30px',
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }}
    />
    <div
      style={{
        position: 'absolute',
        left: `${CARD_INSET_X}px`,
        top: `${CARD_INSET_TOP}px`,
        width: `${COVER_SIZE}px`,
        height: `${COVER_SIZE}px`,
        borderRadius: '30px',
        background: 'rgba(255,255,255,0.06)',
      }}
    />
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '674px',
        transform: 'translateX(-50%)',
        width: '468px',
        height: '102px',
        borderRadius: '62px',
        background: 'rgba(255,255,255,0.08)',
      }}
    />
    {showAccountRow ? (
      <>
        <div
          style={{
            position: 'absolute',
            left: '62px',
            top: '838px',
            width: '190px',
            height: '190px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '268px',
            top: '846px',
            width: '64px',
            height: '78px',
            borderRadius: '14px',
            background: 'rgba(255,255,255,0.1)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '284px',
            top: '920px',
            width: '398px',
            height: '48px',
            borderRadius: '14px',
            background: 'rgba(255,255,255,0.1)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '281px',
            top: '971px',
            width: '350px',
            height: '32px',
            borderRadius: '12px',
            background: 'rgba(255,255,255,0.08)',
          }}
        />
      </>
    ) : null}
    {showActionRow ? (
      <div
        style={{
          position: 'absolute',
          left: '356px',
          top: '831px',
          width: '251px',
          height: '79.63px',
          borderRadius: '62px',
          background: 'rgba(255,255,255,0.08)',
        }}
      />
    ) : null}
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

const ActionButton: React.FC<{
  label: string;
  cost?: number;
  variant: ActionVariant;
  imageSrc?: string;
  motionVariant?: 'default' | 'premium';
  onClick: React.MouseEventHandler<HTMLButtonElement>;
}> = ({ label, cost, variant, imageSrc, motionVariant = 'default', onClick }) => {
  const [isPressed, setIsPressed] = React.useState(false);

  if (imageSrc) {
    return (
      <button
        type="button"
        onClick={onClick}
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
          borderRadius: '62px',
          overflow: 'visible',
          transform: isPressed ? 'scale(0.985)' : 'scale(1)',
        }}
      >
        <img
          src={imageSrc}
          alt={label}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'fill',
            display: 'block',
            pointerEvents: 'none',
            borderRadius: '62px',
          }}
        />
      </button>
    );
  }

  if (variant === 'light') {
    return (
      <button
        type="button"
        onClick={onClick}
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
          border: '4px solid rgba(255,255,255,0.3)',
          background: 'rgba(0,0,0,0.9)',
          cursor: 'pointer',
          borderRadius: '62px',
          overflow: 'hidden',
          boxShadow: isPressed ? '0 0 18px rgba(255,255,255,0.16)' : '0 0 28px rgba(255,255,255,0.24)',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: '-20px',
            top: '-22px',
            width: '124px',
            height: '110px',
            borderRadius: '999px',
            background: 'rgba(255,255,255,0.96)',
            filter: 'blur(22px)',
            opacity: 0.95,
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: '4px',
            borderRadius: '62px',
            border: '4px solid rgba(255,255,255,0.3)',
            background: 'rgba(0,0,0,0.1)',
          }}
        />
        <span
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            width: '100%',
            height: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: textFont,
            fontWeight: 700,
            fontSize: '27px',
            lineHeight: '1',
            color: '#fff',
            textAlign: 'center',
            textShadow: '0 0 10px rgba(255,255,255,0.18)',
            transform: isPressed ? 'scale(0.985)' : 'scale(1)',
          }}
        >
          {label}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={motionVariant === 'premium' ? `premium-button-shell ${isPressed ? 'is-pressed' : ''}` : undefined}
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
        opacity: 1,
        borderRadius: '62px',
        overflow: 'hidden',
      }}
    >
      {motionVariant === 'premium' ? <div className="premium-button-inner" /> : null}
      {imageSrc ? (
        <img
          src={imageSrc}
          alt=""
          style={{
            position: 'absolute',
            inset: motionVariant === 'premium' ? '4px' : 0,
            width: motionVariant === 'premium' ? 'calc(100% - 8px)' : '100%',
            height: motionVariant === 'premium' ? 'calc(100% - 8px)' : '100%',
            objectFit: 'fill',
            display: 'block',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />
      ) : (
        <div
          className={motionVariant === 'premium' ? 'premium-button-inner' : undefined}
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            borderRadius: '62px',
            border: '4px solid rgba(255,255,255,0.3)',
            background: 'rgba(0,0,0,0.9)',
            backdropFilter: 'blur(50px)',
            overflow: 'hidden',
          }}
        >
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '16.5px',
            transform: 'translateX(-50%)',
            width: '199px',
            height: '29px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: textFont,
            fontWeight: 700,
            fontSize: '27px',
            lineHeight: '1',
            color: '#fff',
            whiteSpace: 'pre',
          }}
        >
          {`${label}    ${cost ?? ''}`}
        </div>
        <div style={{ position: 'absolute', left: '146px', top: '26px', width: '19px', height: '19px', overflow: 'hidden' }}>
          <img
            src={metacoinSmall}
            alt=""
            className="motion-metacoin"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />
        </div>
        </div>
      )}
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
    <ChevronIcon left="14px" opacity={0.45} src={openReelChevronOne} />
    <ChevronIcon left="22px" opacity={0.72} src={openReelChevronTwo} />
    <ChevronIcon left="32px" opacity={1} src={openReelChevronThree} />
  </div>
);

const ChevronIcon: React.FC<{ left: string; opacity: number; src: string }> = ({ left, opacity, src }) => (
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
    <img
      src={src}
      alt=""
      style={{
        width: '32px',
        height: '32px',
        display: 'block',
        objectFit: 'contain',
        opacity,
      }}
    />
  </div>
);

