import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MainBackdropNew, SecondaryBlackBackdrop } from './MainBackdropNew';
import { Footer, Header, ThreeBg } from './ScreenLayout';
import { showPopupMessage } from '../app/telegram/telegramHelpers';
import { copyToClipboard } from '../utils/clipboard';
import { convertPngToJpeg } from '../utils/imageConverter';
import { FigmaDownloadIconButton, FigmaMaterialsBadge, FigmaPromptBadge } from './FigmaPills';
import { InteractiveTiltCard } from './InteractiveTiltCard';
import playIcon from '../assets/about-academy-player/play-icon.svg';

interface ContentBlockLike {
  id: string;
  type: string;
  content: any;
}

interface MaterialsContentScreenProps {
  homeRoute: string;
  heading: string;
  subtitleLines: string[];
  contentTitle: string;
  contentBlocks: ContentBlockLike[];
  downloadCount: number;
  onSendMaterials: () => void;
  onContentScroll?: React.UIEventHandler<HTMLDivElement>;
  badgeTheme?: 'academy' | 'article';
}

function buildImageSources(content: string): string[] {
  const normalized = String(content || '').trim();
  const converted = convertPngToJpeg(normalized);
  return Array.from(new Set([converted, normalized].filter(Boolean)));
}

export const MaterialsContentScreen: React.FC<MaterialsContentScreenProps> = ({
  homeRoute,
  heading,
  subtitleLines,
  contentTitle,
  contentBlocks,
  downloadCount,
  onSendMaterials,
  onContentScroll,
  badgeTheme = 'academy',
}) => {
  const navigate = useNavigate();
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;
  const [expandedImageSources, setExpandedImageSources] = React.useState<string[] | null>(null);
  const [expandedImageIndex, setExpandedImageIndex] = React.useState(0);
  const handleCopyPrompt = React.useCallback(async (promptText: string) => {
    const copied = await copyToClipboard(promptText);
    if (!copied) return;
    showPopupMessage('промпт скопирован в буфер обмена');
  }, []);

  const renderBlock = (block: ContentBlockLike) => {
    if (block.type === 'title') {
      return (
        <div
          key={block.id}
          style={{
            margin: '0 0 30px',
            fontFamily: 'Cygre',
            fontWeight: 700,
            fontSize: '52px',
            lineHeight: '1',
            color: 'white',
            textAlign: 'center',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            overflowWrap: 'anywhere',
          }}
        >
          {block.content}
        </div>
      );
    }

    if (block.type === 'description') {
      return (
        <div
          key={block.id}
          style={{
            marginBottom: '30px',
            fontFamily: 'Cygre',
            fontWeight: 400,
            fontSize: '35px',
            lineHeight: '1',
            color: 'rgba(255,255,255,0.82)',
            textAlign: 'center',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            overflowWrap: 'anywhere',
          }}
        >
          {block.content}
        </div>
      );
    }

    if (block.type === 'text') {
      return (
        <div key={block.id} style={{ marginBottom: '30px', fontFamily: 'Cygre', fontWeight: 400, fontSize: '35px', lineHeight: '1', color: 'white', textAlign: 'center', whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
          {block.content}
        </div>
      );
    }

    if (block.type === 'image') {
      const imageSources = buildImageSources(block.content);
      const imageUrl = imageSources[0] || String(block.content || '');
      return (
        <InteractiveTiltCard
          key={block.id}
          className="pricing-card-shell"
          maxRotateX={3}
          maxRotateY={4}
          maxScale={1.008}
          style={{ position: 'relative', width: '760px', margin: '30px auto' }}
        >
          <div className="pricing-card-sheen-zone">
            <div className="pricing-card-sheen" />
            <div className="pricing-card-sheen pricing-card-sheen-soft" />
          </div>
          <img
            src={imageUrl}
            alt="изображение"
            loading="eager"
            crossOrigin="anonymous"
            onClick={() => {
              setExpandedImageSources(imageSources);
              setExpandedImageIndex(0);
            }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              const nextSource = imageSources.find((source) => source !== target.src);
              if (nextSource) {
                target.src = nextSource;
              }
            }}
            style={{ width: '760px', display: 'block', borderRadius: '20px', cursor: 'pointer' }}
          />
        </InteractiveTiltCard>
      );
    }

    if (block.type === 'video') {
      const videoUrl = typeof block.content === 'string' ? block.content : block.content?.url;
      const posterSrc = typeof block.content === 'object'
        ? block.content?.poster_url || block.content?.poster || block.content?.cover_image_url || null
        : null;
      if (!videoUrl) return null;

      return (
        <InteractiveTiltCard
          key={block.id}
          className="pricing-card-shell"
          maxRotateX={3}
          maxRotateY={4}
          maxScale={1.008}
          style={{ position: 'relative', width: '760px', margin: '30px auto' }}
        >
          <div className="pricing-card-sheen-zone">
            <div className="pricing-card-sheen" />
            <div className="pricing-card-sheen pricing-card-sheen-soft" />
          </div>
          <InlineContentVideoPlayer src={videoUrl} posterSrc={posterSrc} />
        </InteractiveTiltCard>
      );
    }

    if (block.type === 'prompt') {
      const promptText = typeof block.content === 'string' ? block.content : String(block.content ?? '');

      return (
        <div key={block.id} style={{ margin: '28px 0 30px', width: '100%' }}>
          <button
            type="button"
            onClick={() => void handleCopyPrompt(promptText)}
            className="motion-press-grow"
            style={{ display: 'block', margin: '0 auto 24px', border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}
          >
            <FigmaPromptBadge className="button-inner-glow" />
          </button>
          <div
            role="button"
            tabIndex={0}
            onClick={() => void handleCopyPrompt(promptText)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                void handleCopyPrompt(promptText);
              }
            }}
            style={{
              padding: 0,
              width: '100%',
              cursor: 'pointer',
              display: 'block',
            }}
          >
            <div style={{ fontFamily: 'Cygre', fontWeight: 400, fontSize: '35px', lineHeight: '1', color: 'rgba(255,255,255,0.6)', textAlign: 'center', whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere', width: '100%', userSelect: 'text' }}>
              {promptText}
            </div>
          </div>
        </div>
      );
    }

    if (block.type === 'materials') {
      return (
        <div key={block.id} style={{ margin: '34px 0 10px' }}>
          <FigmaMaterialsBadge className="button-inner-glow" style={{ display: 'block', margin: '0 auto 24px' }} />
          <button
            type="button"
            onClick={onSendMaterials}
            className="motion-press-grow"
            style={{
              border: 'none',
              background: 'transparent',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '14px auto 0',
              cursor: 'pointer',
            }}
          >
            <span className="materials-download-pulse" style={{ transform: 'translateY(1px)' }}>
              <span style={{ fontFamily: 'Cygre', fontWeight: 700, fontSize: '32px', lineHeight: '1', color: 'white', display: 'inline-block' }}>
                скачать файлы ({downloadCount})
              </span>
              <span style={{ width: '32px', height: '32px', borderRadius: '32px', border: '4px solid rgba(255,255,255,0.3)', background: '#000', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transform: 'translateY(4px)', boxSizing: 'border-box' }}>
                <FigmaDownloadIconButton className="button-inner-glow" style={{ width: '16px', height: '16px', marginTop: 0, transform: 'none' }} />
              </span>
            </span>
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      {expandedImageSources?.length ? (
        <div
          onClick={() => {
            setExpandedImageSources(null);
            setExpandedImageIndex(0);
          }}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.94)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <img
            src={expandedImageSources?.[expandedImageIndex] || ''}
            alt="fullscreen"
            onError={() => {
              setExpandedImageIndex((current) => {
                if (!expandedImageSources || current >= expandedImageSources.length - 1) {
                  return current;
                }
                return current + 1;
              });
            }}
            style={{ maxWidth: '95vw', maxHeight: '95vh', objectFit: 'contain' }}
          />
        </div>
      ) : null}

      <div style={{ position: 'relative', width: '100vw', minHeight: '100vh', background: '#020101', overflow: 'hidden' }}>
        <div style={{ position: 'relative', width: '1180px', minHeight: '2550px', transform: `scale(${scale})`, transformOrigin: 'top left' }}>
          <ThreeBg />
          <Header onLogoClick={() => navigate(homeRoute)} />

          <div style={{ position: 'absolute', left: '85px', top: '207px', width: '1020px' }}>
            <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 700, fontSize: '80px', lineHeight: '1', color: 'white' }}>{heading}</p>
          </div>

          <div style={{ position: 'absolute', left: '85px', top: '291px', width: '915px' }}>
            {subtitleLines.map((line, index) => (
              <p key={`${heading}-${index}`} style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 400, fontSize: '40px', lineHeight: '1', color: 'white', whiteSpace: 'pre-wrap' }}>
                {line}
              </p>
            ))}
          </div>

          <MainBackdropNew />

          <SecondaryBlackBackdrop>
            <div
              className="laba-feed-scroll"
              onScroll={onContentScroll}
              style={{
                position: 'absolute',
                inset: 0,
                overflowY: 'auto',
                overflowX: 'hidden',
                padding: '40px 25px 110px',
                touchAction: 'pan-y',
                overscrollBehaviorX: 'none',
                WebkitMaskImage: 'linear-gradient(to bottom, black calc(100% - 70px), transparent 100%)',
                maskImage: 'linear-gradient(to bottom, black calc(100% - 70px), transparent 100%)',
              }}
            >
              <h2 style={{ margin: '0 0 34px', fontFamily: 'Cygre', fontWeight: 700, fontSize: '52px', lineHeight: '1', color: 'white', textAlign: 'center' }}>
                {contentTitle}
              </h2>
              {contentBlocks.map(renderBlock)}
            </div>
          </SecondaryBlackBackdrop>

          <Footer />
        </div>
      </div>
    </>
  );
};

const InlineContentVideoPlayer: React.FC<{
  src: string;
  posterSrc?: string | null;
}> = ({ src, posterSrc }) => {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [aspectRatio, setAspectRatio] = React.useState<number>(9 / 16);

  const handleTogglePlayback = React.useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      await video.play();
      return;
    }

    video.pause();
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        width: '760px',
        aspectRatio: `${aspectRatio}`,
        maxHeight: '1100px',
        borderRadius: '20px',
        overflow: 'hidden',
        background: '#000',
      }}
    >
      <video
        ref={videoRef}
        src={src}
        poster={posterSrc || undefined}
        playsInline
        preload="metadata"
        onLoadedMetadata={(event) => {
          const video = event.currentTarget;
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            setAspectRatio(video.videoWidth / video.videoHeight);
          }
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          objectFit: 'contain',
          background: '#000',
        }}
      />

      <button
        type="button"
        onClick={() => void handleTogglePlayback()}
        aria-label={isPlaying ? 'пауза' : 'воспроизвести видео'}
        style={{
          position: 'absolute',
          inset: 0,
          border: 'none',
          background: 'transparent',
          padding: 0,
          cursor: 'pointer',
        }}
      />

      {!isPlaying ? (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '150px',
            height: '150px',
            borderRadius: '999px',
            background: 'rgba(4, 22, 39, 0.18)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <img
            src={playIcon}
            alt=""
            style={{
              width: '140px',
              height: '140px',
              display: 'block',
            }}
          />
        </div>
      ) : null}
    </div>
  );
};
