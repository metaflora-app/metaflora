import React from 'react';
import { MediaOutlet, MediaPlayer, useMediaStore } from '@vidstack/react';
import type { MediaPlayerElement } from 'vidstack';

import pauseIcon from '../assets/about-academy-player/pause-icon.svg';
import playIcon from '../assets/about-academy-player/play-icon.svg';

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
}) => {
  const playerRef = React.useRef<MediaPlayerElement>(null);
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
  const shouldShowPoster = Boolean(posterSrc) && !hasStartedPlayback && media.currentTime <= 0.05;
  const shouldShowOverlayButton = media.paused || shouldShowPoster;

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
      </MediaPlayer>
    </div>
  );
};
