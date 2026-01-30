import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Reel } from '../types/laba';
import { formatCount, formatTimeAgo } from '../utils/labaApi';

// Assets
import newBadgePNG from '../assets/laba-main/плашка новое.png';
import analysisButtonPNG from '../assets/laba-main/кнопка анализ.png';
import playIcon from '../assets/tour-video/play-icon.png';
import viewsIcon from '../assets/laba-icons/иконка просмотры.png';
import likesIcon from '../assets/laba-icons/иконка лайки.png';
import commentsIcon from '../assets/laba-icons/иконка комментарии.png';
import instaLogo from '../assets/laba-icons/лого инста.png';

interface ReelCardProps {
  reel: Reel;
  index: number;
  isFavorite: boolean;
  onToggleFavorite: (reelId: string) => void;
}

export const ReelCard: React.FC<ReelCardProps> = ({ 
  reel, 
  index, 
  isFavorite, 
  onToggleFavorite 
}) => {
  const navigate = useNavigate();
  
  // Position: left column (0, 2, 4...) or right column (1, 3, 5...)
  const isLeftColumn = index % 2 === 0;
  const rowIndex = Math.floor(index / 2);
  
  const left = isLeftColumn ? '22px' : '444px';
  const top = `${23 + rowIndex * 805}px`;
  
  return (
    <div style={{
      position: 'absolute',
      left,
      top,
      width: '410px',
      height: '782px',
    }}>
      <div className="blur-wave" style={{
        position: 'absolute',
        inset: 0,
        backdropFilter: 'blur(50px)',
        background: '#000',
        border: '4px solid rgba(255, 255, 255, 0.3)',
        borderRadius: '30px',
      }} />
      
      {/* Cover image */}
      <div style={{
        position: 'absolute',
        top: '3.45%',
        right: '6.59%',
        bottom: '45.4%',
        left: '6.59%',
        border: '2px solid rgba(0, 0, 0, 0.3)',
        borderRadius: '25px',
        overflow: 'hidden',
      }}>
        <img 
          src={reel.coverImageUrl}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '25px',
          }}
        />
      </div>

      {/* Badge "новое" */}
      {reel.isNew && (
        <img
          src={newBadgePNG}
          alt="новое"
          className="button-inner-glow"
          style={{
            position: 'absolute',
            left: '269px',
            top: '44px',
            width: '101px',
            height: '36px',
            objectFit: 'contain',
          }}
        />
      )}

      {/* Like icon */}
      <div 
        onClick={() => onToggleFavorite(reel.id)}
        style={{
          position: 'absolute',
          left: '42px',
          top: '44px',
          width: '36px',
          height: '36px',
          cursor: 'pointer',
        }}
      >
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <path 
            d="M18 30L6 18C3 15 3 9 6 6C9 3 15 3 18 6C21 3 27 3 30 6C33 9 33 15 30 18L18 30Z" 
            stroke={isFavorite ? '#FF0000' : 'white'} 
            strokeWidth="2" 
            fill={isFavorite ? '#FF0000' : 'none'} 
          />
        </svg>
      </div>

      {/* Play button */}
      <div className="blur-wave" style={{
        position: 'absolute',
        left: 'calc(50% - 49px)',
        top: '178px',
        width: '98px',
        height: '98px',
        backdropFilter: 'blur(50px)',
        background: 'rgba(0, 0, 0, 0.1)',
        border: '4px solid rgba(255, 255, 255, 0.3)',
        borderRadius: '62px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
      }}
      onClick={() => window.open(reel.reelUrl, '_blank')}
      >
        <img 
          src={playIcon}
          alt="play"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
      </div>

      {/* Statistics bar */}
      <div className="blur-wave" style={{
        position: 'absolute',
        backdropFilter: 'blur(50px)',
        background: '#000',
        border: '2px solid rgba(255, 255, 255, 0.3)',
        height: '52px',
        left: 'calc(50% + 0.5px)',
        borderRadius: '30px',
        top: '365px',
        transform: 'translateX(-50%)',
        width: '333px',
        overflow: 'clip',
      }}>
        {/* Views icon */}
        <div style={{
          position: 'absolute',
          height: '39px',
          left: '21px',
          top: '5px',
          width: '46px',
        }}>
          <img src={viewsIcon} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>

        {/* Likes icon */}
        <div style={{
          position: 'absolute',
          height: '39px',
          left: '132px',
          top: '4px',
          width: '40px',
        }}>
          <img src={likesIcon} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>

        {/* Comments icon */}
        <div style={{
          position: 'absolute',
          height: '39px',
          left: '228px',
          top: '5px',
          width: '40px',
        }}>
          <img src={commentsIcon} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>

        {/* Views count */}
        <div style={{
          position: 'absolute',
          bottom: 'calc(30.77% - 2px)',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'Gotham Pro, sans-serif',
          fontWeight: 500,
          justifyContent: 'center',
          left: 'calc(50% - 68px)',
          lineHeight: 0,
          fontSize: '27px',
          textAlign: 'center',
          color: 'white',
          top: 'calc(30.77% - 2px)',
          transform: 'translateX(-50%)',
          width: '73px',
        }}>
          <p style={{ lineHeight: 'normal', whiteSpace: 'pre-wrap', margin: 0 }}>
            {formatCount(reel.viewsCount)}
          </p>
        </div>

        {/* Likes count */}
        <div style={{
          position: 'absolute',
          bottom: 'calc(31.39% - 2px)',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'Gotham Pro, sans-serif',
          fontWeight: 500,
          justifyContent: 'center',
          left: 'calc(50% + 33px)',
          lineHeight: 0,
          fontSize: '27px',
          textAlign: 'center',
          color: 'white',
          top: 'calc(30.77% - 2px)',
          transform: 'translateX(-50%)',
          width: '55px',
        }}>
          <p style={{ lineHeight: 'normal', whiteSpace: 'pre-wrap', margin: 0 }}>
            {formatCount(reel.likesCount)}
          </p>
        </div>

        {/* Comments count */}
        <div style={{
          position: 'absolute',
          bottom: 'calc(31.39% - 2px)',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'Gotham Pro, sans-serif',
          fontWeight: 500,
          justifyContent: 'center',
          left: 'calc(50% + 120px)',
          lineHeight: 0,
          fontSize: '27px',
          textAlign: 'center',
          color: 'white',
          top: 'calc(30.77% - 2px)',
          transform: 'translateX(-50%)',
          width: '35px',
        }}>
          <p style={{ lineHeight: 'normal', whiteSpace: 'pre-wrap', margin: 0 }}>
            {formatCount(reel.commentsCount)}
          </p>
        </div>
      </div>

      {/* Instagram logo */}
      <img 
        src={instaLogo}
        alt=""
        style={{
          position: 'absolute',
          left: '30px',
          top: '448px',
          width: '64px',
          height: '78px',
          opacity: 0.6,
          objectFit: 'contain',
        }}
      />

      {/* Account username */}
      <div style={{
        position: 'absolute',
        top: '67.26%',
        right: '11.22%',
        bottom: '27.37%',
        left: '7.32%',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 700,
        fontSize: '40px',
        color: 'white',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}>
        @{reel.accountUsername}
      </div>

      {/* Account followers */}
      <div style={{
        position: 'absolute',
        top: '74.55%',
        right: '8.05%',
        bottom: '22.12%',
        left: '6.59%',
        fontFamily: 'Gotham Pro, sans-serif',
        fontWeight: 300,
        fontSize: '32px',
        color: 'white',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}>
        {formatCount(reel.accountFollowers)} подписчиков
      </div>

      {/* Analysis button */}
      <img
        src={analysisButtonPNG}
        alt="анализ"
        onClick={() => navigate('/laba-analysis', { state: { reel } })}
        className="button-inner-glow"
        style={{
          position: 'absolute',
          bottom: '63px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '248px',
          height: '79px',
          cursor: 'pointer',
        }}
      />

      {/* Time ago badge */}
      <div className="blur-wave button-inner-glow" style={{
        position: 'absolute',
        left: 'calc(50% + 1px)',
        top: '417px',
        transform: 'translateX(-50%)',
        width: '220px',
        height: '38px',
        backdropFilter: 'blur(50px)',
        background: 'rgba(255, 255, 255, 0.1)',
        border: '2px solid rgba(255, 255, 255, 0.3)',
        borderRadius: '62px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          fontFamily: 'Gotham Pro, sans-serif',
          fontWeight: 500,
          fontSize: '23px',
          color: 'white',
          textAlign: 'center',
        }}>
          {formatTimeAgo(reel.publishedAt)}
        </div>
      </div>
    </div>
  );
};
