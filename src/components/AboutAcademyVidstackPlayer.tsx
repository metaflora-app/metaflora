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

import fullscreenIcon from '../assets/about-academy-player/fullscreen-icon.svg';
import muteIcon from '../assets/about-academy-player/mute-icon.svg';
import pauseIcon from '../assets/about-academy-player/pause-icon.svg';
import playIcon from '../assets/about-academy-player/play-icon.svg';
import seekBackwardIcon from '../assets/about-academy-player/seek-backward-icon.svg';
import seekForwardIcon from '../assets/about-academy-player/seek-forward-icon.svg';
import speedIcon from '../assets/about-academy-player/speed-icon.svg';
import timelineThumb from '../assets/about-academy-player/timeline-thumb.svg';
import timelineTrack from '../assets/about-academy-player/timeline-track.svg';
import volumeIcon from '../assets/about-academy-player/volume-icon.svg';

const CONTROL_SIZE = 100;
const ICON_SIZE = 90;
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
const TIME_TOP = 1336;

type FlashOverlayState = 'seek-backward' | 'seek-forward' | 'play' | 'pause' | null;

interface AboutAcademyVidstackPlayerProps {
  style?: React.CSSProperties;
}

const baseControlStyle: React.CSSProperties = {
  position: 'absolute',
  width: `${CONTROL_SIZE}px`,
  height: `${CONTROL_SIZE}px`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '10px',
  border: 0,
  borderRadius: '100px',
  background: CONTROL_BACKGROUND,
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  cursor: 'pointer',
  appearance: 'none',
  outline: 'none',
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

export const AboutAcademyVidstackPlayer: React.FC<AboutAcademyVidstackPlayerProps> = ({
  style = {},
}) => {
  const playerRef = React.useRef<MediaPlayerElement>(null);
  const timeSliderRef = React.useRef<MediaSliderElement>(null);
  const overlayTimeoutRef = React.useRef<number | null>(null);
  const lastTapRef = React.useRef({ left: 0, right: 0 });
  const [playbackRate, setPlaybackRate] = React.useState(1);
  const [flashOverlay, setFlashOverlay] = React.useState<FlashOverlayState>(null);
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

    if (media.paused) {
      await player.play();
      showOverlay('play');
      return;
    }

    await player.pause();
    showOverlay('pause');
  }, [getPlayer, media.paused, showOverlay]);

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
    const player = getPlayer();
    if (!player) return;
    await player.enterFullscreen('prefer-media');
  }, [getPlayer]);

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
        background: '#000',
        ...style,
      }}
    >
      <MediaPlayer
        ref={playerRef}
        src="/about-academy-test-video.mp4"
        title="Как устроена МЕТАФЛОРА академия"
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
          background: '#000',
        }}
      >
        <MediaOutlet
          style={{
            width: '100%',
            height: '100%',
            background: '#000',
          }}
        />

        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 3,
          }}
        >
          <button
            type="button"
            aria-label={`Перемотать назад на ${SEEK_SECONDS} секунд двойным нажатием`}
            onClick={() => handleEdgeTap('left')}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '33.33%',
              height: 'calc(100% - 170px)',
              border: 0,
              background: 'transparent',
              padding: 0,
              cursor: 'pointer',
              touchAction: 'manipulation',
            }}
          />

          <button
            type="button"
            aria-label={media.paused ? 'Воспроизвести видео' : 'Поставить видео на паузу'}
            onClick={handleTogglePlay}
            style={{
              position: 'absolute',
              left: '33.33%',
              top: 0,
              width: '33.34%',
              height: 'calc(100% - 170px)',
              border: 0,
              background: 'transparent',
              padding: 0,
              cursor: 'pointer',
              touchAction: 'manipulation',
            }}
          />

          <button
            type="button"
            aria-label={`Перемотать вперед на ${SEEK_SECONDS} секунд двойным нажатием`}
            onClick={() => handleEdgeTap('right')}
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              width: '33.33%',
              height: 'calc(100% - 170px)',
              border: 0,
              background: 'transparent',
              padding: 0,
              cursor: 'pointer',
              touchAction: 'manipulation',
            }}
          />
        </div>

        {flashOverlay ? (
          <div
            style={{
              ...baseControlStyle,
              zIndex: 4,
              left:
                flashOverlay === 'seek-backward'
                  ? '145.92px'
                  : flashOverlay === 'seek-forward'
                    ? '647.92px'
                    : '396.92px',
              top: '667.08px',
              pointerEvents: 'none',
            }}
          >
            <img
              src={
                flashOverlay === 'seek-backward'
                  ? seekBackwardIcon
                  : flashOverlay === 'seek-forward'
                    ? seekForwardIcon
                    : flashOverlay === 'pause'
                      ? pauseIcon
                      : playIcon
              }
              alt=""
              style={iconStyle}
            />
          </div>
        ) : null}

        <button
          type="button"
          aria-label={`Скорость воспроизведения ${media.playbackRate}x`}
          title={`Скорость ${media.playbackRate}x`}
          onClick={handleCyclePlaybackRate}
          style={getControlStyle(306.92, BOTTOM_CONTROL_TOP)}
        >
          <img src={speedIcon} alt="" style={iconStyle} />
        </button>

        <button
          type="button"
          onClick={handleEnterFullscreen}
          aria-label="Развернуть видео на полный экран"
          style={getControlStyle(406.92, BOTTOM_CONTROL_TOP)}
        >
          <img src={fullscreenIcon} alt="" style={iconStyle} />
        </button>

        <button
          type="button"
          onClick={handleToggleMute}
          aria-label={media.muted || media.volume === 0 ? 'Включить звук' : 'Выключить звук'}
          style={getControlStyle(506.92, BOTTOM_CONTROL_TOP)}
        >
          <img src={media.muted || media.volume === 0 ? muteIcon : volumeIcon} alt="" style={iconStyle} />
        </button>

        <MediaTime
          type="current"
          showHours={false}
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
        />

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

        <MediaTime
          type="duration"
          showHours={false}
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
        />

      </MediaPlayer>
    </div>
  );
};
