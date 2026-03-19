import React from 'react';
import type { Reel } from '../../types/laba';
import { convertInstagramImageUrl, formatCount, formatTimeAgo } from '../../utils/labaApi';
import playIcon from '../../assets/tour-video/play-icon.png';
import viewsIcon from '../../assets/laba-icons/иконка просмотры.png';
import likesIcon from '../../assets/laba-icons/иконка лайки.png';
import commentsIcon from '../../assets/laba-icons/иконка комментарии.png';
import instaLogo from '../../assets/laba-icons/лого инста.png';
import metacoinSmall from '../../assets/metacoins-redesign/новый метакоин маленький.png';

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
}

const CARD_WIDTH = 812;
const COVER_SIZE = 744;

const textFont = 'Cygre, sans-serif';

export const LabaFeedCard: React.FC<LabaFeedCardProps> = ({
  reel,
  isFavorite,
  onToggleFavorite,
  onAction,
  onOpenAnalysis,
  actionLabel,
  actionCost,
  actionVariant = 'dark',
}) => {
  const avatarUrl = React.useMemo(() => convertInstagramImageUrl(reel.accountProfilePicUrl), [reel.accountProfilePicUrl]);
  const coverUrl = React.useMemo(
    () => convertInstagramImageUrl(reel.coverImageUrl) || reel.coverImageUrl,
    [reel.coverImageUrl],
  );

  return (
    <div
      onClick={onOpenAnalysis}
      style={{
        position: 'relative',
        width: `${CARD_WIDTH}px`,
        minHeight: '1060px',
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
          left: '30px',
          top: '30px',
          width: `${COVER_SIZE}px`,
          height: `${COVER_SIZE}px`,
          borderRadius: '36px',
          overflow: 'hidden',
          border: '2px solid rgba(0,0,0,0.3)',
          background: 'rgba(255,255,255,0.08)',
        }}
      >
        {coverUrl ? (
          <img
            src={coverUrl}
            alt=""
            crossOrigin="anonymous"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : null}
      </div>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onToggleFavorite(reel.id);
        }}
        style={{
          position: 'absolute',
          left: '52px',
          top: '52px',
          width: '34px',
          height: '34px',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          filter: isFavorite ? 'drop-shadow(0 0 8px rgba(255,0,0,0.8))' : 'none',
        }}
      >
        <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
          <path
            d="M17 28.5L5.8 17.3C3 14.5 3 9.95 5.8 7.15C8.6 4.35 13.15 4.35 15.95 7.15L17 8.2L18.05 7.15C20.85 4.35 25.4 4.35 28.2 7.15C31 9.95 31 14.5 28.2 17.3L17 28.5Z"
            fill={isFavorite ? '#ff1f1f' : 'none'}
            stroke={isFavorite ? '#ff1f1f' : '#ffffff'}
            strokeWidth="2"
          />
        </svg>
      </button>

      {reel.isNew ? (
        <div
          className="blur-wave"
          style={{
            position: 'absolute',
            right: '48px',
            top: '50px',
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
        className="blur-wave"
        style={{
          position: 'absolute',
          left: '50%',
          top: '371px',
          transform: 'translate(-50%, -50%)',
          width: '72px',
          height: '72px',
          borderRadius: '32px',
          background: 'rgba(4,22,39,0.12)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            window.open(reel.reelUrl, '_blank');
          }}
          style={{
            width: '48px',
            height: '48px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <img src={playIcon} alt="открыть reels" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </button>
      </div>

      <div
        className="blur-wave"
        style={{
          position: 'absolute',
          left: '50%',
          top: '690px',
          transform: 'translateX(-50%)',
          width: '468px',
          height: '78px',
          borderRadius: '62px',
          border: '4px solid rgba(255,255,255,0.3)',
          background: '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-evenly',
        }}
      >
        <Metric icon={viewsIcon} value={formatCount(reel.viewsCount)} iconWidth={66} iconHeight={56} />
        <Metric icon={likesIcon} value={formatCount(reel.likesCount)} iconWidth={66} iconHeight={64} />
        <Metric icon={commentsIcon} value={formatCount(reel.commentsCount)} iconWidth={68} iconHeight={66} />
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
          left: '32px',
          top: '804px',
          width: '190px',
          height: '190px',
          borderRadius: '50%',
          overflow: 'hidden',
          background: 'rgba(255,255,255,0.12)',
        }}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={reel.accountUsername}
            crossOrigin="anonymous"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : null}
      </div>

      <img
        src={instaLogo}
        alt=""
        style={{
          position: 'absolute',
          left: '246px',
          top: '818px',
          width: '42px',
          height: '51px',
          objectFit: 'contain',
          opacity: 0.6,
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: '246px',
          top: '879px',
          width: '310px',
          fontFamily: textFont,
          fontWeight: 700,
          fontSize: '52px',
          lineHeight: '0.96',
          color: '#fff',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        @{reel.accountUsername}
      </div>

      <div
        style={{
          position: 'absolute',
          left: '246px',
          top: '943px',
          width: '310px',
          fontFamily: textFont,
          fontWeight: 400,
          fontSize: '32px',
          lineHeight: '1',
          color: '#fff',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {formatCount(reel.accountFollowers)} подписчиков
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
  <div style={{ position: 'relative', width: `${CARD_WIDTH}px`, minHeight: '1060px', margin: '0 auto' }}>
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
        left: '30px',
        top: '30px',
        width: `${COVER_SIZE}px`,
        height: `${COVER_SIZE}px`,
        borderRadius: '36px',
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
            top: '804px',
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
            top: '884px',
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
            top: '952px',
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
          right: '44px',
          top: '830px',
          width: '246px',
          height: '79px',
          borderRadius: '62px',
          background: 'rgba(255,255,255,0.08)',
        }}
      />
    ) : null}
  </div>
);

const Metric: React.FC<{ icon: string; value: string; iconWidth: number; iconHeight: number }> = ({
  icon,
  value,
  iconWidth,
  iconHeight,
}) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
    <img src={icon} alt="" style={{ width: `${iconWidth}px`, height: `${iconHeight}px`, objectFit: 'contain' }} />
    <div style={{ fontFamily: textFont, fontWeight: 700, fontSize: '35px', lineHeight: '1', color: '#fff' }}>{value}</div>
  </div>
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
      right: '44px',
      top: '833px',
      minWidth: '246px',
      height: '79px',
      padding: '0 28px',
      borderRadius: '62px',
      border: '4px solid rgba(255,255,255,0.3)',
      background: variant === 'light' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.9)',
      color: '#fff',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      fontFamily: textFont,
      fontWeight: 700,
      fontSize: '27px',
      cursor: 'pointer',
      boxShadow: variant === 'light' ? 'inset 0 0 40px rgba(255,255,255,0.18)' : 'none',
    }}
  >
    <span>{label}</span>
    {typeof cost === 'number' ? <img src={metacoinSmall} alt="" style={{ width: '19px', height: '19px', objectFit: 'contain' }} /> : null}
    {typeof cost === 'number' ? <span>{cost}</span> : null}
  </button>
);
