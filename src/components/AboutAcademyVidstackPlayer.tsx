import React from 'react';
import {
  MediaOutlet,
  MediaPlayer,
  MediaTime,
  MediaTimeSlider,
  useMediaStore,
  useSliderStore,
} from '@vidstack/react';
import type { MediaPlayerElement, MediaSliderElement } from 'vidstack';
import { prewarmVideoSource } from '../utils/videoPreloader';

import fullscreenIcon from '../assets/about-academy-player/fullscreen-icon.svg';
import muteIcon from '../assets/about-academy-player/mute-icon.svg';
import playIcon from '../assets/about-academy-player/play-icon.svg';
import seekBackwardIcon from '../assets/about-academy-player/seek-backward-icon.svg';
import seekForwardIcon from '../assets/about-academy-player/seek-forward-icon.svg';
import speedIcon from '../assets/about-academy-player/speed-icon.svg';
import timelineThumb from '../assets/about-academy-player/timeline-thumb.svg';
import timelineTrack from '../assets/about-academy-player/timeline-track.svg';
import volumeIcon from '../assets/about-academy-player/volume-icon.svg';
const CONTROL_SIZE = 100;
const ICON_SIZE = 90;
const OVERLAY_CONTROL_SIZE = 150;
const OVERLAY_ICON_SIZE = 140;
const OVERLAY_CONTROL_TOP = 642.08;
const OVERLAY_BACKWARD_LEFT = 120.92;
const OVERLAY_PLAY_LEFT = 371.92;
const OVERLAY_FORWARD_LEFT = 622.92;
const TAP_ZONE_WIDTH = 230;
const TAP_ZONE_HEIGHT = 230;
const TAP_ZONE_TOP = 602;
const BOTTOM_CONTROL_TOP = 1204.08;
const CONTROL_BACKGROUND = 'rgba(4, 22, 39, 0.1)';
const PLAYBACK_RATES = [1, 1.25, 1.5, 2];
const SEEK_SECONDS = 15;
const DOUBLE_TAP_DELAY_MS = 280;
const OVERLAY_HIDE_DELAY_MS = 420;
const TIMELINE_LEFT = 142;
const TIMELINE_TOP = 1343;
const TIMELINE_WIDTH = 600;
const TIME_LEFT = 56;
const DURATION_LEFT = 745;
const TIME_TOP = 1342;

type FlashOverlayState = 'seek-backward' | 'seek-forward' | null;

interface AboutAcademyVidstackPlayerProps {
  src?: string;
  title?: string;
  style?: React.CSSProperties;
  autoPlay?: boolean;
  initialTime?: number;
  onExpand?: () => void;
  onPlaybackStart?: () => void;
  onWatchThreshold?: () => void;
  onTimeChange?: (seconds: number) => void;
  posterSrc?: string | null;
  controlsVariant?: 'minimal' | 'full';
}

const baseControlStyle: React.CSSProperties = {
  position: 'absolute',
  width: `${CONTROL_SIZE}px`,
  height: `${CONTROL_SIZE}px`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '5px',
  border: 0,
  borderRadius: '100px',
  background: CONTROL_BACKGROUND,
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  cursor: 'pointer',
  appearance: 'none',
  outline: 'none',
};

const overlayControlStyle: React.CSSProperties = {
  ...baseControlStyle,
  width: `${OVERLAY_CONTROL_SIZE}px`,
  height: `${OVERLAY_CONTROL_SIZE}px`,
  padding: '5px',
};

const getControlStyle = (left: number, top: number): React.CSSProperties => ({
  ...baseControlStyle,
  left: `${left}px`,
  top: `${top}px`,
});

const iconStyle: React.CSSProperties = {
  width: `${ICON_SIZE}px`,
  height: `${ICON_SIZE}px`,
  display: 'block',
  pointerEvents: 'none',
  userSelect: 'none',
};

const overlayIconStyle: React.CSSProperties = {
  ...iconStyle,
  width: `${OVERLAY_ICON_SIZE}px`,
  height: `${OVERLAY_ICON_SIZE}px`,
};

function formatTimeLabel(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return '0:00';
  }

  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export const AboutAcademyVidstackPlayer: React.FC<AboutAcademyVidstackPlayerProps> = ({
  src = '/about-academy-test-video.mp4',
  title = 'Как устроена МЕТАФЛОРА академия',
  style = {},
  autoPlay = false,
  initialTime = 0,
  onExpand,
  onPlaybackStart,
  onWatchThreshold,
  onTimeChange,
  posterSrc,
}) => {
  const playerRef = React.useRef<MediaPlayerElement>(null);
  const timeSliderRef = React.useRef<MediaSliderElement>(null);
  const overlayTimeoutRef = React.useRef<number | null>(null);
  const lastTapRef = React.useRef({ left: 0, right: 0 });
  const initialSeekDoneRef = React.useRef(false);
  const playbackStartedRef = React.useRef(false);
  const watchThresholdReachedRef = React.useRef(false);
  const [playbackRate, setPlaybackRate] = React.useState(1);
  const [flashOverlay, setFlashOverlay] = React.useState<FlashOverlayState>(null);
  const [pressedControl, setPressedControl] = React.useState<string | null>(null);
  const [isPlayPending, setIsPlayPending] = React.useState(false);
  const media = useMediaStore(playerRef);
  const slider = useSliderStore(timeSliderRef);
  const fillPercent = React.useMemo(() => {
    if (typeof slider.fillPercent === 'number') return slider.fillPercent;
    if (!media.duration) return 0;
    return (media.currentTime / media.duration) * 100;
  }, [media.currentTime, media.duration, slider.fillPercent]);

  React.useEffect(() => {
    return () => {
      if (overlayTimeoutRef.current !== null) {
        window.clearTimeout(overlayTimeoutRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    initialSeekDoneRef.current = false;
    playbackStartedRef.current = false;
    watchThresholdReachedRef.current = false;
    setFlashOverlay(null);
    setPlaybackRate(1);
    setIsPlayPending(false);
  }, [initialTime, src]);

  React.useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined;
    }

    const head = document.head;
    const createdLinks: HTMLLinkElement[] = [];
    const preloadTargets: Array<{ href: string; as: 'video' | 'image' }> = [];

    if (src) {
      preloadTargets.push({ href: src, as: 'video' });
    }

    if (posterSrc) {
      preloadTargets.push({ href: posterSrc, as: 'image' });
    }

    for (const target of preloadTargets) {
      if (!target.href) continue;
      const existing = head.querySelector(`link[rel="preload"][href="${target.href}"]`);
      if (existing) continue;

      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = target.as;
      link.href = target.href;
      head.appendChild(link);
      createdLinks.push(link);
    }

    return () => {
      createdLinks.forEach((link) => link.remove());
    };
  }, [posterSrc, src]);
  React.useEffect(() => {
    prewarmVideoSource(src, posterSrc);
  }, [posterSrc, src]);

  const getPlayer = React.useCallback(() => {
    return playerRef.current as (MediaPlayerElement & {
      play: () => Promise<void>;
      pause: () => Promise<void>;
      currentTime: number;
      duration: number;
      muted: boolean;
      playbackRate: number;
      enterFullscreen: (target?: string) => Promise<void>;
    }) | null;
  }, []);

  const getNativeVideoElement = React.useCallback(() => {
    const playerRoot = playerRef.current as unknown as HTMLElement | null;
    if (!playerRoot) return null;
    return playerRoot.querySelector('video') as HTMLVideoElement | null;
  }, []);

  React.useEffect(() => {
    const player = getPlayer();
    const nativeVideo = getNativeVideoElement();

    if (player) {
      player.muted = false;
    }

    if (nativeVideo) {
      nativeVideo.muted = false;
      nativeVideo.defaultMuted = false;
      nativeVideo.volume = 1;
      nativeVideo.playsInline = true;
      nativeVideo.preload = 'auto';
    }
  }, [getNativeVideoElement, getPlayer, src]);

  React.useEffect(() => {
    const player = getPlayer();
    if (!player || !autoPlay) return;
    if (!media.paused) return;

    void player.play().catch((error) => {
      console.error('Autoplay failed:', error);
    });
  }, [autoPlay, getPlayer, media.paused]);

  React.useEffect(() => {
    const player = getPlayer();
    if (!player) return;
    if (!initialTime || initialSeekDoneRef.current) return;
    if (!media.duration) return;

    player.currentTime = initialTime;
    initialSeekDoneRef.current = true;
  }, [getPlayer, initialTime, media.duration]);

  React.useEffect(() => {
    onTimeChange?.(media.currentTime);

    if (
      onWatchThreshold &&
      !watchThresholdReachedRef.current &&
      media.duration > 0 &&
      media.currentTime / media.duration >= 0.8
    ) {
      watchThresholdReachedRef.current = true;
      onWatchThreshold();
    }
  }, [media.currentTime, media.duration, onTimeChange, onWatchThreshold]);

  React.useEffect(() => {
    if (!onPlaybackStart || playbackStartedRef.current || media.paused) return;
    playbackStartedRef.current = true;
    onPlaybackStart();
  }, [media.paused, onPlaybackStart]);

  React.useEffect(() => {
    if (!media.paused || media.currentTime > 0.08) {
      setIsPlayPending(false);
    }
  }, [media.currentTime, media.paused]);

  const showOverlay = React.useCallback((state: Exclude<FlashOverlayState, null>) => {
    if (overlayTimeoutRef.current !== null) {
      window.clearTimeout(overlayTimeoutRef.current);
    }

    setFlashOverlay(state);
    overlayTimeoutRef.current = window.setTimeout(() => {
      setFlashOverlay(null);
      overlayTimeoutRef.current = null;
    }, OVERLAY_HIDE_DELAY_MS);
  }, []);

  const handleTogglePlay = React.useCallback(async () => {
    const player = getPlayer();
    if (!player) return;
    const nativeVideo = getNativeVideoElement();

    try {
      if (media.paused) {
        setIsPlayPending(true);
        if (nativeVideo) {
          nativeVideo.preload = 'auto';
          nativeVideo.playsInline = true;
          nativeVideo.muted = false;
          nativeVideo.defaultMuted = false;
          nativeVideo.volume = 1;
          await nativeVideo.play();
        } else {
          await player.play();
        }
        return;
      }

      setIsPlayPending(false);
      if (nativeVideo) {
        nativeVideo.pause();
      } else {
        await player.pause();
      }
    } catch (error) {
      console.error('Video toggle failed:', error);
      setIsPlayPending(false);
    }
  }, [getNativeVideoElement, getPlayer, media.paused]);

  const handleSeek = React.useCallback((delta: number) => {
    const player = getPlayer();
    if (!player) return;

    const duration = Number.isFinite(media.duration) ? media.duration : player.duration || 0;
    const nextTime = Math.max(0, Math.min(player.currentTime + delta, duration));
    player.currentTime = nextTime;
  }, [getPlayer, media.duration]);

  const handleEdgeTap = React.useCallback((side: 'left' | 'right') => {
    const now = Date.now();
    const previousTapAt = lastTapRef.current[side];

    if (now - previousTapAt <= DOUBLE_TAP_DELAY_MS) {
      const delta = side === 'left' ? -SEEK_SECONDS : SEEK_SECONDS;
      handleSeek(delta);
      showOverlay(side === 'left' ? 'seek-backward' : 'seek-forward');
      lastTapRef.current[side] = 0;
      return;
    }

    lastTapRef.current[side] = now;
  }, [handleSeek, showOverlay]);

  const handleToggleMute = React.useCallback(() => {
    const player = getPlayer();
    if (!player) return;
    player.muted = !player.muted;
  }, [getPlayer]);

  const handleEnterFullscreen = React.useCallback(async () => {
    if (onExpand) {
      onExpand();
      return;
    }

    const player = getPlayer();
    const nativeVideo = getNativeVideoElement();
    if (!player && !nativeVideo) return;

    try {
      if (nativeVideo) {
        const webkitVideo = nativeVideo as HTMLVideoElement & {
          webkitEnterFullscreen?: () => void;
        };

        if (typeof webkitVideo.webkitEnterFullscreen === 'function') {
          webkitVideo.webkitEnterFullscreen();
          return;
        }

        if (typeof nativeVideo.requestFullscreen === 'function') {
          await nativeVideo.requestFullscreen();
          return;
        }
      }

      if (player) {
        await player.enterFullscreen('prefer-media');
      }
    } catch (error) {
      console.error('Failed to enter fullscreen:', error);
    }
  }, [getNativeVideoElement, getPlayer, onExpand]);

  const handleCyclePlaybackRate = React.useCallback(() => {
    setPlaybackRate((currentRate) => {
      const actualRate = media.playbackRate || currentRate;
      const currentIndex = PLAYBACK_RATES.findIndex((rate) => rate === actualRate);
      const nextRate = PLAYBACK_RATES[(currentIndex + 1) % PLAYBACK_RATES.length];
      const player = getPlayer();
      if (player) {
        player.playbackRate = nextRate;
      }
      return nextRate;
    });
  }, [getPlayer, media.playbackRate]);


  const shouldShowPreview = Boolean(posterSrc) && (isPlayPending || media.currentTime <= 0.08);


  return (
    <div
      className="about-academy-vidstack"
      style={{
        position: 'absolute',
        left: '142px',
        top: '401px',
        width: '894px',
        height: '1457px',
        overflow: 'hidden',
        borderRadius: '40px',
        background: 'transparent',
        ...style,
      }}
    >
      <MediaPlayer
        ref={playerRef}
        src={src}
        poster={posterSrc || undefined}
        preload="auto"
        muted={false}
        title={title}
        viewType="video"
        streamType="on-demand"
        playsInline
        controls={false}
        playbackRate={playbackRate}
        className="about-academy-vidstack"
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          background: 'transparent',
        }}
      >
        {posterSrc ? (
          <img
            src={posterSrc}
            alt=""
            loading="eager"
            decoding="async"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: shouldShowPreview ? 1 : 0,
              transition: 'opacity 180ms ease',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />
        ) : null}
        <MediaOutlet
          style={{
            width: '100%',
            height: '100%',
            background: 'transparent',
          }}
        />

        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 3,
            pointerEvents: 'none',
          }}
        >
          <button
            type="button"
            aria-label={`Перемотать назад на ${SEEK_SECONDS} секунд двойным нажатием`}
            onClick={() => handleEdgeTap('left')}
            style={{
              position: 'absolute',
              left: `${OVERLAY_BACKWARD_LEFT - ((TAP_ZONE_WIDTH - CONTROL_SIZE) / 2)}px`,
              top: `${TAP_ZONE_TOP}px`,
              width: `${TAP_ZONE_WIDTH}px`,
              height: `${TAP_ZONE_HEIGHT}px`,
              border: 0,
              background: 'transparent',
              padding: 0,
              cursor: 'pointer',
              touchAction: 'manipulation',
              pointerEvents: 'auto',
            }}
          />

          {!media.paused ? (
            <button
              type="button"
              aria-label="Поставить видео на паузу"
              onClick={() => void handleTogglePlay()}
              style={{
                position: 'absolute',
                left: `${OVERLAY_PLAY_LEFT - ((TAP_ZONE_WIDTH - CONTROL_SIZE) / 2)}px`,
                top: `${TAP_ZONE_TOP}px`,
                width: `${TAP_ZONE_WIDTH}px`,
                height: `${TAP_ZONE_HEIGHT}px`,
                border: 0,
                background: 'transparent',
                padding: 0,
                cursor: 'pointer',
                touchAction: 'manipulation',
                pointerEvents: 'auto',
              }}
            />
          ) : null}

          <button
            type="button"
            aria-label={`Перемотать вперед на ${SEEK_SECONDS} секунд двойным нажатием`}
            onClick={() => handleEdgeTap('right')}
            style={{
              position: 'absolute',
              left: `${OVERLAY_FORWARD_LEFT - ((TAP_ZONE_WIDTH - CONTROL_SIZE) / 2)}px`,
              top: `${TAP_ZONE_TOP}px`,
              width: `${TAP_ZONE_WIDTH}px`,
              height: `${TAP_ZONE_HEIGHT}px`,
              border: 0,
              background: 'transparent',
              padding: 0,
              cursor: 'pointer',
              touchAction: 'manipulation',
              pointerEvents: 'auto',
            }}
          />
        </div>

        {(media.paused || isPlayPending) && !flashOverlay ? (
          <button
            type="button"
            aria-label="Воспроизвести видео"
            className={`vid-control-button is-pulsing ${pressedControl === 'overlay-play' ? 'is-pressed' : ''}`}
            onPointerDown={() => setPressedControl('overlay-play')}
            onClick={() => {
              if (!isPlayPending) {
                void handleTogglePlay();
              }
            }}
            onPointerLeave={() => setPressedControl(null)}
            onPointerCancel={() => setPressedControl(null)}
            onPointerUp={() => setPressedControl(null)}
            style={{
              ...overlayControlStyle,
              zIndex: 5,
              left: `${OVERLAY_PLAY_LEFT}px`,
              top: `${OVERLAY_CONTROL_TOP}px`,
              cursor: 'pointer',
              opacity: isPlayPending ? 0 : 1,
              pointerEvents: isPlayPending ? 'none' : 'auto',
            }}
          >
            <img src={playIcon} alt="" style={overlayIconStyle} />
          </button>
        ) : flashOverlay ? (
          <div
            className="vid-control-button"
            style={{
              ...overlayControlStyle,
              zIndex: 4,
              left: flashOverlay === 'seek-backward' ? `${OVERLAY_BACKWARD_LEFT}px` : `${OVERLAY_FORWARD_LEFT}px`,
              top: `${OVERLAY_CONTROL_TOP}px`,
              pointerEvents: 'none',
            }}
          >
            <img
              src={flashOverlay === 'seek-backward' ? seekBackwardIcon : seekForwardIcon}
              alt=""
              style={overlayIconStyle}
            />
          </div>
        ) : null}

        <button
          type="button"
          aria-label={`Скорость воспроизведения ${media.playbackRate}x`}
          title={`Скорость ${media.playbackRate}x`}
          onClick={handleCyclePlaybackRate}
          className={`vid-control-button ${pressedControl === 'speed' ? 'is-pressed' : ''}`}
          onPointerDown={() => setPressedControl('speed')}
          onPointerUp={() => setPressedControl(null)}
          onPointerLeave={() => setPressedControl(null)}
          onPointerCancel={() => setPressedControl(null)}
          style={getControlStyle(306.92, BOTTOM_CONTROL_TOP)}
        >
          <img src={speedIcon} alt="" style={iconStyle} />
        </button>

        <button
          type="button"
          onClick={handleEnterFullscreen}
          aria-label="Развернуть видео на полный экран"
          className={`vid-control-button ${pressedControl === 'fullscreen' ? 'is-pressed' : ''}`}
          onPointerDown={() => setPressedControl('fullscreen')}
          onPointerUp={() => setPressedControl(null)}
          onPointerLeave={() => setPressedControl(null)}
          onPointerCancel={() => setPressedControl(null)}
          style={getControlStyle(406.92, BOTTOM_CONTROL_TOP)}
        >
          <img src={fullscreenIcon} alt="" style={iconStyle} />
        </button>

        <button
          type="button"
          onClick={handleToggleMute}
          aria-label={media.muted || media.volume === 0 ? 'Включить звук' : 'Выключить звук'}
          className={`vid-control-button ${pressedControl === 'mute' ? 'is-pressed' : ''}`}
          onPointerDown={() => setPressedControl('mute')}
          onPointerUp={() => setPressedControl(null)}
          onPointerLeave={() => setPressedControl(null)}
          onPointerCancel={() => setPressedControl(null)}
          style={getControlStyle(506.92, BOTTOM_CONTROL_TOP)}
        >
          <img src={media.muted || media.volume === 0 ? muteIcon : volumeIcon} alt="" style={iconStyle} />
        </button>

        <div
          style={{
            position: 'absolute',
            left: `${TIME_LEFT}px`,
            top: `${TIME_TOP}px`,
            width: '87px',
            height: '21px',
            fontFamily: 'Cygre',
            fontWeight: 400,
            fontSize: '27px',
            lineHeight: '1',
            color: '#fff',
            textAlign: 'center',
          }}
        >
          {formatTimeLabel(media.currentTime)}
        </div>

        <div
          style={{
            position: 'absolute',
            left: `${TIMELINE_LEFT}px`,
            top: `${TIMELINE_TOP}px`,
            width: `${TIMELINE_WIDTH}px`,
            height: '21px',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: '10px',
              width: `${TIMELINE_WIDTH}px`,
              height: '10px',
              backgroundImage: `url(${timelineTrack})`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              backgroundSize: '100% 10px',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: '10px',
              height: '10px',
              width: `${fillPercent}%`,
              borderRadius: '999px',
              background: 'rgba(255, 255, 255, 0.45)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: `${fillPercent}%`,
              top: 0,
              width: '21px',
              height: '21px',
              transform: 'translateX(-50%)',
              backgroundImage: `url(${timelineThumb})`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              backgroundSize: 'contain',
            }}
          />
        </div>

        <MediaTimeSlider
          ref={timeSliderRef}
          pauseWhileDragging
          aria-label="Таймлайн видео"
          style={{
            position: 'absolute',
            left: `${TIMELINE_LEFT}px`,
            top: `${TIMELINE_TOP}px`,
            width: `${TIMELINE_WIDTH}px`,
            height: '21px',
            opacity: 0,
            cursor: 'pointer',
          }}
        />

        <div
          style={{
            position: 'absolute',
            left: `${DURATION_LEFT}px`,
            top: `${TIME_TOP}px`,
            width: '87px',
            height: '21px',
            fontFamily: 'Cygre',
            fontWeight: 400,
            fontSize: '27px',
            lineHeight: '1',
            color: '#fff',
            textAlign: 'center',
          }}
        >
          {formatTimeLabel(media.duration)}
        </div>
      </MediaPlayer>
    </div>
  );
};
