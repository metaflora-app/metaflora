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
import openReelButton from '../../assets/laba-analysis/кнопка открыть рилс.png';
import followButtonShort from '../../assets/laba-analysis/кнопка следить активирована.png';
import unfollowButtonShort from '../../assets/laba-analysis/кнопка не следить если отмена.png';

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
  likeButtonSrc?: string;
  openAnalysisButtonSrc?: string;
  actionButtonSrc?: string;
}

const CARD_WIDTH = 831;
const CARD_HEIGHT = 1064;
const CARD_INSET_X = 31;
const CARD_INSET_TOP = 31;
const COVER_SIZE = 769;

const textFont = 'Cygre, sans-serif';
const figmaCardCover = 'https://www.figma.com/api/mcp/asset/7f9e903d-46e2-4ee5-a7da-bed29379226d';

export const LabaFeedCard: React.FC<LabaFeedCardProps> = ({
  reel,
  isFavorite,
  onToggleFavorite,
  onAction,
  onOpenAnalysis,
  actionLabel,
  actionCost,
  actionVariant = 'dark',
  likeButtonSrc,
  openAnalysisButtonSrc,
  actionButtonSrc,
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

      {likeButtonSrc ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onToggleFavorite(reel.id);
          }}
          style={{
            position: 'absolute',
            left: '62px',
            top: '53px',
            width: '72px',
            height: '72px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            padding: 0,
            zIndex: 3,
          }}
        >
          <img src={likeButtonSrc} alt="лайк" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', pointerEvents: 'none' }} />
        </button>
      ) : (
        <FigmaLikeButton
          active={isFavorite}
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
      )}

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
          onClick={(event) => {
            event.stopPropagation();
            onOpenAnalysis();
          }}
          style={{
            position: 'absolute',
            left: openAnalysisButtonSrc ? '288px' : '304px',
            top: openAnalysisButtonSrc ? '370px' : '362px',
            width: openAnalysisButtonSrc ? '251px' : '223px',
            height: openAnalysisButtonSrc ? '80px' : '95px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            padding: 0,
            zIndex: 3,
          }}
        >
          <img src={openAnalysisButtonSrc || openReelButton} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />
        </button>
      ) : null}

      <div
        className="blur-wave"
        style={{
          position: 'absolute',
          left: '50%',
          top: '654px',
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
        borderRadius: '62px',
        background: 'rgba(255,255,255,0.06)',
      }}
    />
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '690px',
        transform: 'translateX(-50%)',
        width: '468px',
        height: '78px',
        borderRadius: '62px',
        background: 'rgba(255,255,255,0.08)',
      }}
    />
    {showAccountRow ? (
      <>
        <div
          style={{
            position: 'absolute',
            left: '32px',
            top: '921px',
            width: '190px',
            height: '190px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '246px',
            top: '915px',
            width: '280px',
            height: '48px',
            borderRadius: '14px',
            background: 'rgba(255,255,255,0.1)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '246px',
            top: '983px',
            width: '220px',
            height: '30px',
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
          right: '40px',
          top: '942px',
          width: '246px',
          height: '102px',
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
  actionButtonSrc?: string;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
}> = ({ label, cost, variant, actionButtonSrc, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      position: 'absolute',
      left: '356px',
      top: '831px',
      width: '247px',
      height: '80px',
      padding: 0,
      border: 'none',
      background: 'transparent',
      cursor: 'pointer',
      overflow: 'visible',
    }}
  >
    <img
      src={actionButtonSrc || (variant === 'light' ? unfollowButtonShort : followButtonShort)}
      alt={typeof cost === 'number' ? `${label} ${cost}` : label}
      style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', pointerEvents: 'none' }}
    />
  </button>
);

