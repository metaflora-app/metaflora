import React, { useState, useEffect } from 'react';
import playButton from '../assets/tour-video/play-icon.png';

interface AboutVideoPlayerProps {
  videoId?: string;
  style?: React.CSSProperties;
  autoPlay?: boolean;
  hidePlayButton?: boolean;
  onPlaybackStart?: () => void;
  onWatchThreshold?: () => void;
}

// Legacy Kinescope fallback used only for old lessons that still have `video_id`
// but do not yet have direct `video_url`/`poster_url` data.
export const AboutVideoPlayer: React.FC<AboutVideoPlayerProps> = ({
  videoId = 'pD2N536keyLq269TK32qnE', // Видео из AboutLabaScreen по умолчанию
  style = {},
  autoPlay = false,
  hidePlayButton = false,
  onPlaybackStart,
  onWatchThreshold,
}) => {
  const [videoStarted, setVideoStarted] = useState(autoPlay);
  const thresholdReachedRef = React.useRef(false);
  const preloadSrc = `https://kinescope.io/embed/${videoId}?autoplay=0&token=e7dc4869-562f-492a-811b-506296b20fb7`;
  const playbackSrc = `https://kinescope.io/embed/${videoId}?autoplay=1&token=e7dc4869-562f-492a-811b-506296b20fb7`;

  useEffect(() => {
    thresholdReachedRef.current = false;
  }, [videoId]);

  useEffect(() => {
    if (autoPlay) {
      setVideoStarted(true);
    }
  }, [autoPlay]);

  // Слушаем события от Kinescope для возврата кнопки
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://kinescope.io') return;
      
      try {
        const data = event.data;
        if (data.event === 'ended') {
          setVideoStarted(false);
          if (!thresholdReachedRef.current) {
            thresholdReachedRef.current = true;
            onWatchThreshold?.();
          }
        }

        const eventName = String(data.event || data.type || '').toLowerCase();
        const payload = data.data || data.payload || data.detail || {};
        const currentTime = Number(
          payload.currentTime ??
          payload.current_time ??
          data.currentTime ??
          data.current_time
        );
        const duration = Number(
          payload.duration ??
          payload.total ??
          data.duration ??
          data.total
        );

        if (
          !thresholdReachedRef.current &&
          ['time-update', 'timeupdate', 'progress', 'playing'].includes(eventName) &&
          Number.isFinite(currentTime) &&
          Number.isFinite(duration) &&
          duration > 0 &&
          currentTime / duration >= 0.8
        ) {
          thresholdReachedRef.current = true;
          onWatchThreshold?.();
        }
      } catch (error) {
        console.error('Ошибка обработки события:', error);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onWatchThreshold]);

  const handlePlayClick = () => {
    setVideoStarted(true);
    onPlaybackStart?.();
  };

  useEffect(() => {
    if (videoStarted) {
      onPlaybackStart?.();
    }
  }, [onPlaybackStart, videoStarted]);

  return (
    <div style={{
      position: 'absolute',
      left: '142px',
      top: '401px',
      width: '891px',
      height: '1457px',
      borderRadius: '30px',
      overflow: 'hidden',
      border: '4px solid rgba(255, 255, 255, 0.3)',
      background: '#000',
      ...style,
    }}>
      {/* Kinescope wrapper с padding-top для растягивания видео */}
      <div style={{
        position: 'relative',
        paddingTop: '179.33%',
        width: '100%',
        height: 0,
      }}>
        {/* Постер */}
        {!videoStarted && (
          <img
            src={`https://kinescope.io/${videoId}/poster.jpg`}
            alt="Постер видео"
            loading="eager"
            decoding="async"
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              top: 0,
              left: 0,
              objectFit: 'cover',
            }}
          />
        )}

        {!videoStarted && (
          <iframe
            src={preloadSrc}
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media; gyroscope; accelerometer; clipboard-write; screen-wake-lock;"
            frameBorder="0"
            allowFullScreen
            loading="eager"
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              top: 0,
              left: 0,
              opacity: 0,
              pointerEvents: 'none',
            }}
          />
        )}
        
        {/* Iframe с autoplay */}
        {videoStarted && (
          <iframe 
            src={playbackSrc}
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media; gyroscope; accelerometer; clipboard-write; screen-wake-lock;" 
            frameBorder="0" 
            allowFullScreen
            loading="eager"
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              top: 0,
              left: 0,
            }}
          />
        )}
      </div>
      
      {/* Кастомная кнопка Play */}
      {!videoStarted && !hidePlayButton && (
        <img
          src={playButton}
          alt="плей"
          onClick={handlePlayClick}
          className="button-inner-glow"
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '180px',
            height: '180px',
            cursor: 'pointer',
            zIndex: 1000,
          }}
        />
      )}
    </div>
  );
};
