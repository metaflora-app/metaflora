import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Reel } from '../types/laba';
import { formatCount, formatTimeAgo, convertInstagramImageUrl } from '../utils/labaApi';

// Assets
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

// МЕМОИЗИРОВАННЫЙ КОМПОНЕНТ - оптимизация рендеринга для экономии батареи
export const ReelCard: React.FC<ReelCardProps> = React.memo(({ 
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
  
  // Конвертируем Instagram URL в прокси URL
  const avatarUrl = React.useMemo(() => {
    return convertInstagramImageUrl(reel.accountProfilePicUrl);
  }, [reel.accountProfilePicUrl]);
  
  // Конвертируем обложку через прокси
  const coverUrl = React.useMemo(() => {
    return convertInstagramImageUrl(reel.coverImageUrl) || reel.coverImageUrl;
  }, [reel.coverImageUrl]);
  
  return (
    <div style={{
      position: 'absolute',
      left,
      top,
      width: '410px',
      height: '782px',
      contentVisibility: 'auto',
      containIntrinsicSize: '410px 782px',
    }}>
      <div className="blur-wave" style={{
        position: 'absolute',
        inset: 0,
        backdropFilter: 'blur(50px)',
        background: '#000',
        border: '4px solid rgba(255, 255, 255, 0.3)',
        borderRadius: '30px',
      }} />
      
      {/* Cover image - через прокси */}
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
          src={coverUrl}
          alt=""
          loading="lazy"
          crossOrigin="anonymous"
          onError={(e) => {
            console.error('[COVER] ❌ Ошибка загрузки обложки:', coverUrl);
          }}
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

      {/* Badge "новое" убрана */}

      {/* Like icon - с ярким свечением */}
      <div 
        onClick={() => onToggleFavorite(reel.id)}
        style={{
          position: 'absolute',
          left: '42px',
          top: '44px',
          width: '36px',
          height: '36px',
          cursor: 'pointer',
          filter: isFavorite 
            ? 'drop-shadow(0 0 8px #FF0000) drop-shadow(0 0 16px #FF0000)' 
            : 'none',
          transition: 'filter 0.2s ease-in-out',
          willChange: 'filter',
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

      {/* Statistics bar - ДИНАМИЧЕСКОЕ ПОЗИЦИОНИРОВАНИЕ с минимальным gap */}
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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '0 15px',
      }}>
        {/* Views: иконка + число */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0px',
        }}>
          <img src={viewsIcon} alt="" style={{ width: '46px', height: '39px', objectFit: 'contain', flexShrink: 0 }} />
          <div style={{
            fontFamily: 'Gotham Pro, sans-serif',
            fontWeight: 500,
            fontSize: '25px',
            color: 'white',
            whiteSpace: 'nowrap',
          }}>
            {formatCount(reel.viewsCount)}
          </div>
        </div>

        {/* Likes: иконка + число */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0px',
        }}>
          <img src={likesIcon} alt="" style={{ width: '40px', height: '39px', objectFit: 'contain', flexShrink: 0 }} />
          <div style={{
            fontFamily: 'Gotham Pro, sans-serif',
            fontWeight: 500,
            fontSize: '25px',
            color: 'white',
            whiteSpace: 'nowrap',
          }}>
            {formatCount(reel.likesCount)}
          </div>
        </div>

        {/* Comments: иконка + число */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0px',
        }}>
          <img src={commentsIcon} alt="" style={{ width: '40px', height: '39px', objectFit: 'contain', flexShrink: 0 }} />
          <div style={{
            fontFamily: 'Gotham Pro, sans-serif',
            fontWeight: 500,
            fontSize: '25px',
            color: 'white',
            whiteSpace: 'nowrap',
          }}>
            {formatCount(reel.commentsCount)}
          </div>
        </div>
      </div>

      {/* Аватарка убрана - она должна быть на карточке АККАУНТА, не reel */}

      {/* Instagram logo - ПО FIGMA: left 7.32%, right 77.07%, top 448px, aspect 42/51 */}
      <img 
        src={instaLogo}
        alt=""
        style={{
          position: 'absolute',
          left: '7.32%',
          right: '77.07%',
          top: '448px',
          height: 'auto',
          aspectRatio: '42/51',
          opacity: 0.6,
          objectFit: 'contain',
        }}
      />

      {/* Account username - ПО FIGMA: inset 67.26% 9.51% 27.37% 9.02%, fontSize 40px, БЕЗ center */}
      <div style={{
        position: 'absolute',
        left: '9.02%',
        right: '9.51%',
        top: '65%',
        bottom: '26%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 700,
        fontSize: '40px',
        color: 'white',
        lineHeight: 0,
        overflow: 'hidden',
      }}>
        <p style={{ 
          lineHeight: 'normal', 
          margin: 0,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          @{reel.accountUsername}
        </p>
      </div>

      {/* Account followers - ПО FIGMA: inset 74.55% 8.54% 22.12% 10.24%, fontSize 32px, БЕЗ center */}
      <div style={{
        position: 'absolute',
        left: '10.24%',
        right: '8.54%',
        top: '74.55%',
        bottom: '22.12%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        fontFamily: 'Gotham Pro, sans-serif',
        fontWeight: 300,
        fontSize: '32px',
        color: 'white',
        lineHeight: 0,
      }}>
        <p style={{ lineHeight: 'normal', whiteSpace: 'pre-wrap', margin: 0 }}>
          {formatCount(reel.accountFollowers)} подписчиков
        </p>
      </div>

      {/* Кнопка "следить" убрана - аккаунт уже отслеживается */}

      {/* Analysis button */}
      <img
        src={analysisButtonPNG}
        alt="анализ"
        className="button-inner-glow"
        onClick={(e) => {
          e.stopPropagation();
          navigate('/laba-analysis', { state: { reel } });
        }}
        style={{
          position: 'absolute',
          bottom: '63px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '248px',
          height: '79px',
          cursor: 'pointer',
          zIndex: 9999,
        }}
      />

      {/* Time ago badge */}
      <div className="blur-wave" style={{
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
}, (prevProps, nextProps) => {
  // Кастомная функция сравнения для мемоизации
  // Перерендериваем ТОЛЬКО если изменились эти поля
  return (
    prevProps.reel.id === nextProps.reel.id &&
    prevProps.index === nextProps.index &&
    prevProps.isFavorite === nextProps.isFavorite &&
    prevProps.reel.viewsCount === nextProps.reel.viewsCount &&
    prevProps.reel.likesCount === nextProps.reel.likesCount &&
    prevProps.reel.commentsCount === nextProps.reel.commentsCount
  );
});
