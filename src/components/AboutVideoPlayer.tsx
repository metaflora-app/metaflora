import React, { useState, useEffect } from 'react';
import playButton from '../assets/tour-video/play-icon.png';

interface AboutVideoPlayerProps {
  videoId?: string;
  style?: React.CSSProperties;
}

export const AboutVideoPlayer: React.FC<AboutVideoPlayerProps> = ({
  videoId = 'pD2N536keyLq269TK32qnE', // Видео из AboutLabaScreen по умолчанию
  style = {},
}) => {
  const [videoStarted, setVideoStarted] = useState(false);

  // Слушаем события от Kinescope для возврата кнопки
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://kinescope.io') return;
      
      try {
        const data = event.data;
        if (data.event === 'ended') {
          setVideoStarted(false);
        }
      } catch (error) {
        console.error('Ошибка обработки события:', error);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handlePlayClick = () => {
    setVideoStarted(true);
  };

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
        
        {/* Iframe с autoplay */}
        {videoStarted && (
          <iframe 
            src={`https://kinescope.io/embed/${videoId}?autoplay=1&token=e7dc4869-562f-492a-811b-506296b20fb7`}
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media; gyroscope; accelerometer; clipboard-write; screen-wake-lock;" 
            frameBorder="0" 
            allowFullScreen
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
      {!videoStarted && (
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
