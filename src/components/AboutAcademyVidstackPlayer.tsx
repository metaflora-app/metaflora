import React from 'react';
import { MediaOutlet, MediaPlayer, MediaTime, MediaTimeSlider, useMediaStore } from '@vidstack/react';
import type { MediaPlayerElement } from 'vidstack';

import fullscreenIcon from '../assets/about-academy-player/fullscreen-icon.svg';
import muteIcon from '../assets/about-academy-player/mute-icon.svg';
import pauseIcon from '../assets/about-academy-player/pause-icon.svg';
import playIcon from '../assets/about-academy-player/play-icon.svg';
import volumeIcon from '../assets/about-academy-player/volume-icon.svg';

interface AboutAcademyVidstackPlayerProps {
  src?: string;
  title?: string;
  style?: React.CSSProperties;
  autoPlay?: boolean;
  initialTime?: number;
  onPlaybackStart?: () => void;
  onWatchThreshold?: () => void;
  onTimeChange?: (seconds: number) => void;
  posterSrc?: string | null;
  controlsVariant?: 'minimal' | 'full';
}

export const AboutAcademyVidstackPlayer: React.FC<AboutAcademyVidstackPlayerProps> = ({
  src = '/about-academy-test-video.mp4',
  title = 'Как устроена МЕТАФЛОРА академия',
  style = {},
  autoPlay = false,
  initialTime = 0,
  onPlaybackStart,
  onWatchThreshold,
  onTimeChange,
  posterSrc,
  controlsVariant = 'minimal',
}) => {
  const playerRef = React.useRef<MediaPlayerElement>(null);
  const frameRef = React.useRef<HTMLDivElement>(null);
  const initialSeekDoneRef = React.useRef(false);
  const playbackStartedRef = React.useRef(false);
  const watchThresholdReachedRef = React.useRef(false);
  const [hasStartedPlayback, setHasStartedPlayback] = React.useState(false);
  const media = useMediaStore(playerRef);

  React.useEffect(() => {
    initialSeekDoneRef.current = false;
    playbackStartedRef.current = false;
    watchThresholdReachedRef.current = false;
    setHasStartedPlayback(false);
  }, [initialTime, src]);

  const getPlayer = React.useCallback(() => {
    return playerRef.current as (MediaPlayerElement & {
      play: () => Promise<void>;
      pause: () => Promise<void>;
      currentTime: number;
      duration: number;
      muted: boolean;
      playbackRate: number;
    }) | null;
  }, []);

  React.useEffect(() => {
    const player = getPlayer();
    if (!player || !autoPlay) return;
    if (!media.paused) {
      setHasStartedPlayback(true);
      return;
    }

    void player.play()
      .then(() => {
        setHasStartedPlayback(true);
      })
      .catch((error) => {
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
    setHasStartedPlayback(true);
    onPlaybackStart();
  }, [media.paused, onPlaybackStart]);

  const handleTogglePlay = React.useCallback(async () => {
    const player = getPlayer();
    if (!player) return;

    if (media.paused) {
      setHasStartedPlayback(true);
      await player.play();
      return;
    }

    await player.pause();
  }, [getPlayer, media.paused]);

  const handleToggleMute = React.useCallback(() => {
    const player = getPlayer();
    if (!player) return;
    player.muted = !player.muted;
  }, [getPlayer]);

  const handleToggleFullscreen = React.useCallback(async () => {
    const frame = frameRef.current;
    if (!frame) return;
    try {
      if (document.fullscreenElement === frame) {
        await document.exitFullscreen();
        return;
      }
      await frame.requestFullscreen();
    } catch (error) {
      console.error('Fullscreen toggle failed:', error);
    }
  }, []);
  const shouldShowPoster = Boolean(posterSrc) && !hasStartedPlayback && media.currentTime <= 0.05;
  const shouldShowOverlayButton = media.paused || shouldShowPoster;
  const isFullControls = controlsVariant === 'full';

  return (
    <div
      ref={frameRef}
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
        title={title}
        viewType="video"
        streamType="on-demand"
        playsInline
        controls={false}
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
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: shouldShowPoster ? 1 : 0,
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
            opacity: shouldShowPoster ? 0 : 1,
          }}
        />

        <button
          type="button"
          aria-label={media.paused ? 'Воспроизвести видео' : 'Поставить видео на паузу'}
          onClick={() => void handleTogglePlay()}
          style={{
            position: 'absolute',
            inset: 0,
            border: 0,
            background: 'transparent',
            padding: 0,
            cursor: 'pointer',
            zIndex: 3,
          }}
        />

        {shouldShowOverlayButton ? (
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'min(18vw, 170px)',
              height: 'min(18vw, 170px)',
              borderRadius: '999px',
              background: 'rgba(4, 22, 39, 0.18)',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 4,
              pointerEvents: 'none',
            }}
          >
            <img
              src={media.paused ? playIcon : pauseIcon}
              alt=""
              style={{
                width: 'min(12vw, 118px)',
                height: 'min(12vw, 118px)',
                display: 'block',
              }}
            />
          </div>
        ) : null}

        {isFullControls ? (
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              padding: '24px 24px 28px',
              background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.88) 100%)',
              zIndex: 5,
              pointerEvents: 'none',
            }}
          >
            {title ? (
              <div
                style={{
                  marginBottom: '16px',
                  color: 'white',
                  fontFamily: 'Cygre',
                  fontWeight: 700,
                  fontSize: '24px',
                  lineHeight: '1.05',
                  textAlign: 'left',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {title}
              </div>
            ) : null}

            <div style={{ pointerEvents: 'auto' }}>
              <MediaTimeSlider style={{ width: '100%', marginBottom: '14px', accentColor: '#fff' }} />
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                pointerEvents: 'auto',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => void handleTogglePlay()}
                  style={controlButtonStyle}
                >
                  <img src={media.paused ? playIcon : pauseIcon} alt="" style={controlIconStyle} />
                </button>
                <button
                  type="button"
                  onClick={handleToggleMute}
                  style={controlButtonStyle}
                >
                  <img src={media.muted ? muteIcon : volumeIcon} alt="" style={controlIconStyle} />
                </button>
                <button
                  type="button"
                  onClick={handleToggleFullscreen}
                  style={controlButtonStyle}
                >
                  <img src={fullscreenIcon} alt="" style={controlIconStyle} />
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'white', fontFamily: 'Gotham Pro, sans-serif', fontSize: '18px', whiteSpace: 'nowrap' }}>
                <MediaTime type="current" />
                <span>/</span>
                <MediaTime type="duration" />
              </div>
            </div>
          </div>
        ) : null}
      </MediaPlayer>
    </div>
  );
};

const controlButtonStyle: React.CSSProperties = {
  width: '54px',
  height: '54px',
  borderRadius: '62px',
  border: '2px solid rgba(255,255,255,0.35)',
  background: 'rgba(255,255,255,0.08)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  cursor: 'pointer',
};

const controlIconStyle: React.CSSProperties = {
  width: '24px',
  height: '24px',
  display: 'block',
};
