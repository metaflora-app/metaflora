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
import expandPlashka from '../assets/tour-video/плашка развернуть видео.png';

const CONTROL_SIZE = 100;
const ICON_SIZE = 90;
const CONTROL_TOP = 667.08;
const BOTTOM_CONTROL_TOP = 1204.08;
const CONTROL_BACKGROUND = 'rgba(4, 22, 39, 0.1)';
const PLAYBACK_RATES = [1, 1.25, 1.5, 2];

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

const visuallyHiddenStyle: React.CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

export const AboutAcademyVidstackPlayer: React.FC<AboutAcademyVidstackPlayerProps> = ({
  style = {},
}) => {
  const playerRef = React.useRef<MediaPlayerElement>(null);
  const timeSliderRef = React.useRef<MediaSliderElement>(null);
  const [playbackRate, setPlaybackRate] = React.useState(1);
  const media = useMediaStore(playerRef);
  const slider = useSliderStore(timeSliderRef);
  const fillPercent = React.useMemo(() => {
    if (typeof slider.fillPercent === 'number') return slider.fillPercent;
    if (!media.duration) return 0;
    return (media.currentTime / media.duration) * 100;
  }, [media.currentTime, media.duration, slider.fillPercent]);

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

  const handleTogglePlay = React.useCallback(async () => {
    const player = getPlayer();
    if (!player) return;

    if (media.paused) {
      await player.play();
      return;
    }

    await player.pause();
  }, [getPlayer, media.paused]);

  const handleSeek = React.useCallback((delta: number) => {
    const player = getPlayer();
    if (!player) return;

    const duration = Number.isFinite(media.duration) ? media.duration : player.duration || 0;
    const nextTime = Math.max(0, Math.min(player.currentTime + delta, duration));
    player.currentTime = nextTime;
  }, [getPlayer, media.duration]);

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
            objectFit: 'contain',
          }}
        />

        <button
          type="button"
          onClick={() => handleSeek(-10)}
          aria-label="Перемотать назад на 10 секунд"
          style={getControlStyle(145.92, CONTROL_TOP)}
        >
          <img src={seekBackwardIcon} alt="" style={iconStyle} />
        </button>

        <button
          type="button"
          onClick={handleTogglePlay}
          aria-label={media.paused ? 'Воспроизвести видео' : 'Поставить видео на паузу'}
          style={getControlStyle(396.92, CONTROL_TOP)}
        >
          <img src={media.paused ? playIcon : pauseIcon} alt="" style={iconStyle} />
        </button>

        <button
          type="button"
          onClick={() => handleSeek(10)}
          aria-label="Перемотать вперед на 10 секунд"
          style={getControlStyle(647.92, CONTROL_TOP)}
        >
          <img src={seekForwardIcon} alt="" style={iconStyle} />
        </button>

        <button
          type="button"
          aria-label={`Скорость воспроизведения ${media.playbackRate}x`}
          title={`Скорость ${media.playbackRate}x`}
          onClick={handleCyclePlaybackRate}
          style={getControlStyle(296.92, BOTTOM_CONTROL_TOP)}
        >
          <img src={speedIcon} alt="" style={iconStyle} />
        </button>

        <button
          type="button"
          onClick={handleEnterFullscreen}
          aria-label="Развернуть видео на полный экран"
          style={getControlStyle(396.92, BOTTOM_CONTROL_TOP)}
        >
          <img src={fullscreenIcon} alt="" style={iconStyle} />
        </button>

        <button
          type="button"
          onClick={handleToggleMute}
          aria-label={media.muted || media.volume === 0 ? 'Включить звук' : 'Выключить звук'}
          style={getControlStyle(496.92, BOTTOM_CONTROL_TOP)}
        >
          <img src={media.muted || media.volume === 0 ? muteIcon : volumeIcon} alt="" style={iconStyle} />
        </button>

        <MediaTime
          type="current"
          showHours={false}
          style={{
            position: 'absolute',
            left: '46px',
            top: '1333px',
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
            left: '132px',
            top: '1336px',
            width: '600px',
            height: '21px',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: '5px',
              width: '600px',
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
              top: '5px',
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
            left: '132px',
            top: '1336px',
            width: '600px',
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
            left: '735px',
            top: '1333px',
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

        <button
          type="button"
          onClick={handleEnterFullscreen}
          style={{
            position: 'absolute',
            left: '31.43%',
            right: '31.43%',
            top: '91.15%',
            bottom: '3.43%',
            width: '37.14%',
            height: '5.42%',
            border: 'none',
            background: 'transparent',
            padding: 0,
            cursor: 'pointer',
          }}
        >
          <span style={visuallyHiddenStyle}>развернуть видео на полный экран</span>
          <img
            src={expandPlashka}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              pointerEvents: 'none',
            }}
          />
        </button>
      </MediaPlayer>
    </div>
  );
};
