import React from 'react';
import type { Reel } from '../../types/laba';
import { formatCount, formatTimeAgo } from '../../utils/labaApi';

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
const figmaInstagramIcon = 'https://www.figma.com/api/mcp/asset/6807ecfb-95f6-4a90-91fb-04c34c2204da';
const figmaProfilePhoto = 'https://www.figma.com/api/mcp/asset/7c7e9ccf-5f4d-4211-9ee3-97edfc45576f';
const figmaStatsSprite = 'https://www.figma.com/api/mcp/asset/e775c80c-8bf9-42fe-abd7-d5fcf42418b6';
const figmaLikeInactive = 'https://www.figma.com/api/mcp/asset/c914514e-0b54-4b1b-8ce2-5473d0d1671f';
const figmaLikeActive = 'https://www.figma.com/api/mcp/asset/9706fd0a-d277-4e19-abed-e80b0990d5eb';
const figmaMetacoin = 'https://www.figma.com/api/mcp/asset/11c731d9-08ad-4dab-aa88-2e2f793f2687';

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
        <img src={figmaCardCover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>

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

      {onOpenAnalysis ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onOpenAnalysis();
          }}
          className="button-inner-glow"
          style={{
            position: 'absolute',
            left: '50%',
            top: '374px',
            transform: 'translateX(-50%)',
            width: '246px',
            height: '79px',
            borderRadius: '62px',
            border: '4px solid rgba(255,255,255,0.3)',
            background: 'rgba(0,0,0,0.9)',
            color: '#fff',
            fontFamily: textFont,
            fontWeight: 700,
            fontSize: '27px',
            lineHeight: '1',
            cursor: 'pointer',
          }}
        >
          ИИ-анализ
        </button>
      ) : null}

      <div
        className="blur-wave"
        style={{
          position: 'absolute',
          left: '50%',
          top: '676px',
          transform: 'translateX(-50%)',
          width: '468px',
          height: '79px',
          borderRadius: '62px',
          border: '4px solid rgba(255,255,255,0.3)',
          background: '#000',
        }}
      >
        <Metric sprite={figmaStatsSprite} value={formatCount(reel.viewsCount)} iconLeft={197} iconTop={673} iconWidth={66} iconHeight={56} spriteLeft="-69.53%" spriteTop="-115.69%" spriteWidth="426.73%" valueLeft={308} valueTop={687} />
        <Metric sprite={figmaStatsSprite} value={formatCount(reel.likesCount)} iconLeft={347} iconTop={665} iconWidth={66} iconHeight={64} spriteLeft="-193.75%" spriteTop="-115.69%" spriteWidth="487.69%" valueLeft={448} valueTop={687} />
        <Metric sprite={figmaStatsSprite} value={formatCount(reel.commentsCount)} iconLeft={481} iconTop={665} iconWidth={68} iconHeight={66} spriteLeft="-304.47%" spriteTop="-115.69%" spriteWidth="487.69%" valueLeft={577} valueTop={687} />
      </div>

      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '54px',
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
        <img src={figmaProfilePhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>

      <div
        style={{
          position: 'absolute',
          left: '267px',
          top: '811px',
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
          top: '872px',
          width: '398px',
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
          left: '281px',
          top: '936px',
          width: '350px',
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
          height: '79px',
          borderRadius: '62px',
          background: 'rgba(255,255,255,0.08)',
        }}
      />
    ) : null}
  </div>
);

const Metric: React.FC<{
  sprite: string;
  value: string;
  iconLeft: number;
  iconTop: number;
  iconWidth: number;
  iconHeight: number;
  spriteLeft: string;
  spriteTop: string;
  spriteWidth: string;
  valueLeft: number;
  valueTop: number;
}> = ({
  sprite,
  value,
  iconLeft,
  iconTop,
  iconWidth,
  iconHeight,
  spriteLeft,
  spriteTop,
  spriteWidth,
  valueLeft,
  valueTop,
}) => (
  <>
    <div
      style={{
        position: 'absolute',
        left: `${iconLeft}px`,
        top: `${iconTop}px`,
        width: `${iconWidth}px`,
        height: `${iconHeight}px`,
        overflow: 'hidden',
      }}
    >
      <img
        src={sprite}
        alt=""
        style={{
          position: 'absolute',
          height: '339.22%',
          left: spriteLeft,
          top: spriteTop,
          width: spriteWidth,
          maxWidth: 'none',
        }}
      />
    </div>
    <div
      style={{
        position: 'absolute',
        left: `${valueLeft}px`,
        top: `${valueTop}px`,
        fontFamily: textFont,
        fontWeight: 700,
        fontSize: '35px',
        lineHeight: '1',
        color: '#fff',
      }}
    >
      {value}
    </div>
  </>
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
      top: '850px',
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
    }}
  >
    {typeof cost === 'number' ? (
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '199px',
            textAlign: 'center',
            fontFamily: textFont,
            fontWeight: 700,
            fontSize: '27px',
            lineHeight: '1',
            whiteSpace: 'pre-wrap',
          }}
        >
          {`${label}    ${cost}`}
        </div>
        <div style={{ position: 'absolute', left: '146px', top: '26px', width: '19px', height: '19px', overflow: 'hidden' }}>
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
      <span>{label}</span>
    )}
  </button>
);
