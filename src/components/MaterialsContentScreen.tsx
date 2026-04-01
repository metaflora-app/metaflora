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

const INLINE_CONTENT_MEDIA_WIDTH = 764;

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
  contentContainerRef?: React.Ref<HTMLDivElement>;
  badgeTheme?: 'academy' | 'article';
  defaultVideoPosterSrc?: string | null;
}

function buildImageSources(content: string): string[] {
  const normalized = String(content || '').trim();
  const converted = convertPngToJpeg(normalized);
  return Array.from(new Set([converted, normalized].filter(Boolean)));
}

function parseBlockMediaContent(content: any): any {
  if (typeof content !== 'string') {
    return content;
  }

  const normalized = content.trim();
  if (!normalized) {
    return content;
  }

  if ((normalized.startsWith('{') && normalized.endsWith('}')) || (normalized.startsWith('[') && normalized.endsWith(']'))) {
    try {
      return JSON.parse(normalized);
    } catch {
      return content;
    }
  }

  return content;
}

function useLazyActivation(rootMargin = '240px') {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [isActive, setIsActive] = React.useState(false);

  React.useEffect(() => {
    if (isActive) return;
    const node = containerRef.current;
    if (!node) return;

    if (typeof IntersectionObserver === 'undefined') {
      setIsActive(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting || entry.intersectionRatio > 0)) {
          setIsActive(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, [isActive, rootMargin]);

  return { containerRef, isActive };
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
  contentContainerRef,
  badgeTheme = 'academy',
  defaultVideoPosterSrc = null,
}) => {
  const navigate = useNavigate();
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;
  const [expandedImageSources, setExpandedImageSources] = React.useState<string[] | null>(null);
  const [expandedImageIndex, setExpandedImageIndex] = React.useState(0);
  const enableScrollMask = contentBlocks.length <= 6;
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
      const parsedContent = parseBlockMediaContent(block.content);
      const imageValue = typeof parsedContent === 'string'
        ? parsedContent
        : parsedContent?.url || parsedContent?.src || parsedContent?.image_url || parsedContent?.cover_image_url || '';
      const imageSources = buildImageSources(imageValue);
      const imageUrl = imageSources[0] || String(imageValue || '');
      return (
        <InteractiveTiltCard
          key={block.id}
          disabled
          maxRotateX={3}
          maxRotateY={4}
          maxScale={1.008}
          style={{ position: 'relative', width: '760px', margin: '30px auto' }}
        >
          <img
            src={imageUrl}
            alt="изображение"
            loading="lazy"
            decoding="async"
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
      const parsedContent = parseBlockMediaContent(block.content);
      const videoUrl = typeof parsedContent === 'string'
        ? parsedContent
        : parsedContent?.url || parsedContent?.video_url || parsedContent?.src || null;
      const posterSrc = typeof parsedContent === 'object'
        ? parsedContent?.poster_url
          || parsedContent?.poster
          || parsedContent?.cover_image_url
          || parsedContent?.preview_image_url
          || parsedContent?.image_url
          || parsedContent?.thumbnail_url
          || null
        : null;
      if (!videoUrl) return null;

      return (
        <div
          key={block.id}
          style={{ position: 'relative', width: `${INLINE_CONTENT_MEDIA_WIDTH}px`, margin: '30px auto' }}
        >
          <InlineContentVideoPlayer src={videoUrl} posterSrc={posterSrc || defaultVideoPosterSrc} />
        </div>
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
              ref={contentContainerRef}
              onScroll={onContentScroll}
              style={{
                position: 'absolute',
                inset: 0,
                overflowY: 'auto',
                overflowX: 'hidden',
                padding: '40px 25px 110px',
                touchAction: 'pan-y',
                overscrollBehaviorX: 'none',
                WebkitMaskImage: enableScrollMask ? 'linear-gradient(to bottom, black calc(100% - 70px), transparent 100%)' : undefined,
                maskImage: enableScrollMask ? 'linear-gradient(to bottom, black calc(100% - 70px), transparent 100%)' : undefined,
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
  const { containerRef, isActive } = useLazyActivation('320px');
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [aspectRatio, setAspectRatio] = React.useState<number>(9 / 16);
  const [playRequested, setPlayRequested] = React.useState(false);
  const shouldLoadVideo = isActive || playRequested;

  React.useEffect(() => {
    if (!playRequested || !shouldLoadVideo) return;
    const video = videoRef.current;
    if (!video) return;

    const tryPlay = async () => {
      try {
        await video.play();
      } catch (error) {
        console.error('Inline content video play failed:', error);
      } finally {
        setPlayRequested(false);
      }
    };

    void tryPlay();
  }, [playRequested, shouldLoadVideo]);

  const handleTogglePlayback = React.useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    if (!shouldLoadVideo) {
      setPlayRequested(true);
      return;
    }

    if (video.paused) {
      await video.play();
      return;
    }

    video.pause();
  }, [shouldLoadVideo]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: `${INLINE_CONTENT_MEDIA_WIDTH}px`,
        aspectRatio: `${aspectRatio}`,
        borderRadius: '20px',
        overflow: 'hidden',
        background: '#000',
      }}
    >
      <video
        ref={videoRef}
        src={shouldLoadVideo ? src : undefined}
        poster={posterSrc || undefined}
        playsInline
        preload={shouldLoadVideo ? 'metadata' : 'none'}
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

      {!shouldLoadVideo && posterSrc ? (
        <img
          src={posterSrc}
          alt=""
          loading="lazy"
          decoding="async"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            pointerEvents: 'none',
          }}
        />
      ) : null}

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
