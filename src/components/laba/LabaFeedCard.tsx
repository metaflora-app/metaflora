import React from 'react';
import { FigmaLikeButton } from '../FigmaLikeButton';
import type { Reel } from '../../types/laba';
import { formatCount, formatTimeAgo, getInstagramAvatarSrc, getReelCoverSrc } from '../../utils/labaApi';

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
const figmaCardCover = 'https://www.figma.com/api/mcp/asset/7f9e903d-46e2-4ee5-a7da-bed29379226d';
const figmaInstagramIcon = 'https://www.figma.com/api/mcp/asset/200ff601-2b41-4029-92e4-df8b7f6e9be8';
const figmaProfilePhoto = 'https://www.figma.com/api/mcp/asset/7c7e9ccf-5f4d-4211-9ee3-97edfc45576f';
const figmaViewsIcon = 'https://www.figma.com/api/mcp/asset/0ebdf626-69e3-4fbf-8d9e-93bb38c2a658';
const figmaCommentsIcon = 'https://www.figma.com/api/mcp/asset/f1737cfb-06b3-4dfa-ad50-233a8dec72a0';
const figmaLikesIcon = 'https://www.figma.com/api/mcp/asset/b45d8cd2-65a2-4ada-970d-40991751091f';
const figmaMetacoin = 'https://www.figma.com/api/mcp/asset/e6b64005-5519-4c93-8ecd-51c66606778e';

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
  const displayUsername = reel.accountUsername.length > 15
    ? `${reel.accountUsername.slice(0, 15)}..`
    : reel.accountUsername;
  const coverSrc = getReelCoverSrc(reel) || reel.coverImageUrl || figmaCardCover;
  const avatarSrc = getInstagramAvatarSrc(reel.accountUsername, reel.accountProfilePicUrl) || reel.accountProfilePicUrl || figmaProfilePhoto;

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
        <img
          src={coverSrc}
          alt=""
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
            right: '48px',
            top: '50px',
            minWidth: '121px',
            height: '44px',
            padding: '0 20px',
            borderRadius: '62px',
            border: '2px solid rgba(255,255,255,0.3)',
            background: 'rgba(0,0,0,0.9)',
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
          новое
        </div>
      ) : null}

      {onOpenAnalysis ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onOpenAnalysis();
          }}
          className="button-inner-glow blur-wave"
          style={{
            position: 'absolute',
            left: '50%',
            top: '374px',
            transform: 'translateX(-50%)',
            width: '246px',
            height: '79px',
            borderRadius: '62px',
            border: '4px solid rgba(255,255,255,0.3)',
            background: '#000',
            color: '#fff',
            fontFamily: textFont,
            fontWeight: 700,
            fontSize: '27px',
            lineHeight: '1',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ transform: 'translateY(-4px)' }}>ИИ-анализ</span>
        </button>
      ) : null}

      <div
        className="blur-wave"
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
            transform: 'translateY(0px)',
          }}
        >
          <MetricStat icon={figmaViewsIcon} value={formatCount(reel.viewsCount)} iconWidth={58} iconHeight={48} cropLeft="-69.53%" cropTop="-115.69%" cropWidth="426.73%" width={106} />
          <MetricStat icon={figmaLikesIcon} value={formatCount(reel.likesCount)} iconWidth={58} iconHeight={56} cropLeft="-193.75%" cropTop="-115.69%" cropWidth="487.69%" width={96} />
          <MetricStat icon={figmaCommentsIcon} value={formatCount(reel.commentsCount)} iconWidth={60} iconHeight={58} cropLeft="-304.47%" cropTop="-115.69%" cropWidth="487.69%" width={101} />
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
          top: '803px',
          width: '190px',
          height: '190px',
          borderRadius: '50%',
          overflow: 'hidden',
          background: 'rgba(255,255,255,0.12)',
        }}
      >
        <img
          src={avatarSrc}
          alt=""
          onError={(event) => {
            const target = event.currentTarget;
            if (target.src !== figmaProfilePhoto) {
              target.src = figmaProfilePhoto;
            }
          }}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>

      <div
        style={{
          position: 'absolute',
          left: '268px',
          top: '813px',
          width: '64px',
          height: '78px',
          overflow: 'hidden',
          opacity: 0.6,
        }}
      >
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

      <div
        style={{
          position: 'absolute',
          left: '284px',
          top: '885px',
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
          top: '936px',
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
        top: '890px',
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
          right: '40px',
          top: '911px',
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
          <img
            src={figmaMetacoin}
            alt=""
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
    ) : (
      <span style={{ transform: 'translateY(-4px)' }}>{label}</span>
    )}
  </button>
);
