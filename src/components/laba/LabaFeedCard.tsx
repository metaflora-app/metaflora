import React from 'react';
import { FigmaLikeButton } from '../FigmaLikeButton';
import type { Reel } from '../../types/laba';
import {
  formatCount,
  formatFollowersLabel,
  formatTimeAgo,
  getReelAvatarSources,
  getReelCoverSources,
} from '../../utils/labaApi';
import instagramLogo from '../../assets/laba-icons/лого инста.png';
import commentsIcon from '../../assets/laba-icons/иконка комментарии.png';
import likesIcon from '../../assets/laba-icons/иконка лайки.png';
import viewsIcon from '../../assets/laba-icons/иконка просмотры.png';

type ActionVariant = 'dark' | 'light';

interface LabaFeedCardProps {
  reel: Reel;
  isFavorite: boolean;
  onToggleFavorite: (reelId: string) => void;
  onAction?: () => void;
  onOpenAnalysis?: () => void;
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
const figmaCardCover = 'https://www.figma.com/api/mcp/asset/7f9e903d-46e2-4ee5-a7da-bed29379226d';
const openReelChevronOne = 'https://www.figma.com/api/mcp/asset/c438e6ad-9b13-4d96-a92b-f79405621e12';
const openReelChevronTwo = 'https://www.figma.com/api/mcp/asset/ca4f9322-b09a-4358-a069-4bf92288177c';
const openReelChevronThree = 'https://www.figma.com/api/mcp/asset/1355747b-76c8-4fd1-a9a1-c9a669881457';
const followMetacoin = 'https://www.figma.com/api/mcp/asset/a79513b9-0b71-424b-9846-a5db2e047107';

export const LabaFeedCard: React.FC<LabaFeedCardProps> = ({
  reel,
  isFavorite,
  onToggleFavorite,
  onAction,
  onOpenAnalysis,
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

  React.useEffect(() => {
    setCoverIndex(0);
  }, [coverSources]);

  React.useEffect(() => {
    setAvatarIndex(0);
  }, [avatarSources]);

  const coverSrc = coverSources[coverIndex] || figmaCardCover;
  const avatarSrc = avatarSources[avatarIndex] || null;

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

      {onOpenAnalysis ? (
        <button
          type="button"
          className={`premium-button-shell button-inner-glow ${isAnalysisPressed ? 'is-pressed' : ''}`}
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
            borderRadius: openAnalysisButtonSrc ? '62px' : '32px',
            overflow: 'hidden',
          }}
        >
          {openAnalysisButtonSrc ? (
            <img src={openAnalysisButtonSrc} alt="" style={{ position: 'absolute', inset: '2px', width: 'calc(100% - 4px)', height: 'calc(100% - 4px)', objectFit: 'contain', display: 'block', pointerEvents: 'none', zIndex: 2 }} />
          ) : (
            <OpenReelButton />
          )}
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

      <div
        style={{
          position: 'absolute',
          left: '62px',
          top: '838px',
          width: '190px',
          height: '190px',
          borderRadius: '50%',
          overflow: 'hidden',
          background: 'rgba(255,255,255,0.12)',
        }}
      >
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

      <div
        style={{
          position: 'absolute',
          left: '268px',
          top: '846px',
          width: '64px',
          height: '78px',
          overflow: 'hidden',
          opacity: 0.6,
        }}
      >
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

      <div
        style={{
          position: 'absolute',
          left: '284px',
          top: '920px',
          width: '398px',
          fontFamily: textFont,
          fontWeight: 700,
          fontSize: '52px',
          lineHeight: '42px',
          color: '#fff',
          whiteSpace: 'nowrap',
        }}
      >
        @{displayUsername}
      </div>

      <div
        style={{
          position: 'absolute',
          left: '281px',
          top: '971px',
          width: '350px',
          height: '32px',
          fontFamily: textFont,
          fontWeight: 400,
          fontSize: '32px',
          lineHeight: '32px',
          color: '#fff',
          whiteSpace: 'nowrap',
        }}
      >
        {formatFollowersLabel(reel.accountFollowers)}
      </div>

      <ActionButton
        label={actionLabel}
        cost={actionCost}
        variant={actionVariant}
        imageSrc={actionButtonImageSrc}
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
        opacity: variant === 'light' ? 0.92 : 1,
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

