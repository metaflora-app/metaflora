import React from 'react';
import playButton from '../assets/tour-video/play-icon.png';

interface TelegramAcademyPlayerProps {
  src: string;
  posterSrc?: string | null;
  title?: string;
  style?: React.CSSProperties;
  autoPlay?: boolean;
  initialTime?: number;
  borderRadius?: number;
  onExpand?: () => void;
  onPlaybackStart?: () => void;
  onWatchThreshold?: () => void;
  onTimeChange?: (seconds: number) => void;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '0:00';
  }

  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export const TelegramAcademyPlayer: React.FC<TelegramAcademyPlayerProps> = ({
  src,
  posterSrc,
  title = '',
  style = {},
  autoPlay = false,
  initialTime = 0,
  borderRadius = 30,
  onExpand,
  onPlaybackStart,
  onWatchThreshold,
  onTimeChange,
}) => {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const requestedSeekRef = React.useRef(false);
  const startedRef = React.useRef(false);
  const thresholdReachedRef = React.useRef(false);

  const [isPlaying, setIsPlaying] = React.useState(autoPlay);
  const [isLoading, setIsLoading] = React.useState(autoPlay);
  const [duration, setDuration] = React.useState(0);
  const [currentTime, setCurrentTime] = React.useState(initialTime);
  const [error, setError] = React.useState<string | null>(null);

  const togglePlayback = React.useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (video.paused) {
        setIsLoading(true);
        await video.play();
      } else {
        video.pause();
      }
    } catch (playError) {
      console.error('Error toggling playback:', playError);
      setError('Не удалось запустить видео');
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video || !autoPlay) return;

    const attemptPlay = async () => {
      try {
        await video.play();
      } catch (playError) {
        console.error('Autoplay blocked:', playError);
        setIsPlaying(false);
        setIsLoading(false);
      }
    };

    attemptPlay();
  }, [autoPlay, src]);

  React.useEffect(() => {
    requestedSeekRef.current = false;
    startedRef.current = false;
    thresholdReachedRef.current = false;
    setCurrentTime(initialTime);
    setDuration(0);
    setError(null);
    setIsLoading(autoPlay);
    setIsPlaying(autoPlay);
  }, [autoPlay, initialTime, src]);

  const handleLoadedMetadata = React.useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    setDuration(video.duration || 0);
    setIsLoading(false);

    if (initialTime > 0 && !requestedSeekRef.current) {
      requestedSeekRef.current = true;
      video.currentTime = initialTime;
      setCurrentTime(initialTime);
    }
  }, [initialTime]);

  const handleTimeUpdate = React.useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const nextTime = video.currentTime;
    const nextDuration = video.duration || duration;
    setCurrentTime(nextTime);
    setDuration(nextDuration);
    onTimeChange?.(nextTime);

    if (!thresholdReachedRef.current && nextDuration > 0 && nextTime / nextDuration >= 0.8) {
      thresholdReachedRef.current = true;
      onWatchThreshold?.();
    }
  }, [duration, onTimeChange, onWatchThreshold]);

  const handlePlay = React.useCallback(() => {
    setIsPlaying(true);
    setIsLoading(false);

    if (!startedRef.current) {
      startedRef.current = true;
      onPlaybackStart?.();
    }
  }, [onPlaybackStart]);

  const handlePause = React.useCallback(() => {
    setIsPlaying(false);
    setIsLoading(false);
  }, []);

  const handleWaiting = React.useCallback(() => {
    setIsLoading(true);
  }, []);

  const handleCanPlay = React.useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleEnded = React.useCallback(() => {
    setIsPlaying(false);
    setIsLoading(false);
    setCurrentTime(duration);
  }, [duration]);

  const handleError = React.useCallback(() => {
    setError('Видео временно недоступно');
    setIsPlaying(false);
    setIsLoading(false);
  }, []);

  const handleSeek = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const nextTime = Number(event.target.value);
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = nextTime;
    setCurrentTime(nextTime);
    onTimeChange?.(nextTime);
  }, [onTimeChange]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        borderRadius: `${borderRadius}px`,
        overflow: 'hidden',
        background: '#000',
        ...style,
      }}
    >
      <video
        ref={videoRef}
        src={src}
        poster={posterSrc || undefined}
        playsInline
        preload="metadata"
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onPlay={handlePlay}
        onPause={handlePause}
        onWaiting={handleWaiting}
        onCanPlay={handleCanPlay}
        onEnded={handleEnded}
        onError={handleError}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          background: '#000',
        }}
      />

      {!isPlaying && !error && (
        <button
          type="button"
          onClick={togglePlayback}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '180px',
            height: '180px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            padding: 0,
            zIndex: 3,
          }}
        >
          <img
            src={playButton}
            alt="плей"
            className="button-inner-glow"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </button>
      )}

      {isLoading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.35)',
            color: 'white',
            fontFamily: 'Cygre',
            fontSize: '28px',
            zIndex: 2,
          }}
        >
          загрузка видео...
        </div>
      )}

      {error && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '20px',
            background: 'rgba(0, 0, 0, 0.78)',
            color: 'white',
            fontFamily: 'Cygre',
            fontSize: '28px',
            textAlign: 'center',
            padding: '0 40px',
            zIndex: 4,
          }}
        >
          <div>{error}</div>
          <button
            type="button"
            onClick={togglePlayback}
            style={{
              borderRadius: '62px',
              border: '2px solid rgba(255,255,255,0.35)',
              background: 'rgba(255,255,255,0.08)',
              color: 'white',
              padding: '18px 32px',
              fontFamily: 'Cygre',
              fontSize: '22px',
              cursor: 'pointer',
            }}
          >
            попробовать снова
          </button>
        </div>
      )}

      <div
        style={{
          position: 'absolute',
          left: '0',
          right: '0',
          bottom: '0',
          padding: '20px 24px 24px',
          background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.86) 100%)',
          zIndex: 3,
        }}
      >
        {title ? (
          <div
            style={{
              color: 'white',
              fontFamily: 'Cygre',
              fontSize: '24px',
              lineHeight: '1.1',
              marginBottom: '14px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {title}
          </div>
        ) : null}

        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={Math.min(currentTime, duration || 0)}
          onChange={handleSeek}
          style={{
            width: '100%',
            accentColor: '#ffffff',
            cursor: 'pointer',
            marginBottom: '14px',
          }}
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <button
            type="button"
            onClick={togglePlayback}
            style={{
              minWidth: '132px',
              height: '54px',
              borderRadius: '62px',
              border: '2px solid rgba(255,255,255,0.35)',
              background: 'rgba(255,255,255,0.08)',
              color: 'white',
              fontFamily: 'Cygre',
              fontSize: '22px',
              cursor: 'pointer',
            }}
          >
            {isPlaying ? 'пауза' : 'смотреть'}
          </button>

          <div
            style={{
              color: 'rgba(255,255,255,0.82)',
              fontFamily: 'Gotham Pro, sans-serif',
              fontSize: '18px',
              whiteSpace: 'nowrap',
            }}
          >
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>

          {onExpand ? (
            <button
              type="button"
              onClick={onExpand}
              style={{
                minWidth: '156px',
                height: '54px',
                borderRadius: '62px',
                border: '2px solid rgba(255,255,255,0.35)',
                background: 'rgba(255,255,255,0.08)',
                color: 'white',
                fontFamily: 'Cygre',
                fontSize: '22px',
                cursor: 'pointer',
              }}
            >
              fullscreen
            </button>
          ) : (
            <div style={{ width: '156px' }} />
          )}
        </div>
      </div>
    </div>
  );
};
