import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// Images - reuse from academy screen
import bgPattern from '../../assets/figma-welcome/pattern.png';
import logoSmall from '../../assets/figma-welcome/logo-small.png';
import logoFooter from '../../assets/figma-welcome/logo-footer.png';
import socialsIcons from '../../assets/welcome-elements/socials-icons.png';
import exitArrow from '../../assets/tour-video/exit-arrow.png';
import supportButton from '../../assets/tour-video/support-button.png';

// Article background images from desktop
import academyBg from '../../assets/main-dashboard/фон академия.png';
import labaBg from '../../assets/main-dashboard/фон лаба.png';
import tsekhBg from '../../assets/main-dashboard/фон цех.png';
import poligonBg from '../../assets/main-dashboard/фон полигон.png';

interface Article {
  id: number;
  title: string;
  description: string;
  bgImage: string;
  isNew: boolean;
}

const articles: Article[] = [
  {
    id: 1,
    title: 'Курс «Система»',
    description: 'Курс «Система» — про то, как выстраивать процессы, а не тушить пожары. Ты собираешь понятную логику: цель → действия → результат, без хаоса и лишних шагов. На выходе',
    bgImage: academyBg,
    isNew: true
  },
  {
    id: 2,
    title: 'Курс «Система»',
    description: 'Курс «Система» — про то, как выстраивать процессы, а не тушить пожары. Ты собираешь понятную логику: цель → действия → результат, без хаоса и лишних шагов. На выходе',
    bgImage: labaBg,
    isNew: false
  },
  {
    id: 3,
    title: 'Курс «Система»',
    description: 'Курс «Система» — про то, как выстраивать процессы, а не тушить пожары. Ты собираешь понятную логику: цель → действия → результат, без хаоса и лишних шагов. На выходе',
    bgImage: tsekhBg,
    isNew: false
  },
  {
    id: 4,
    title: 'Курс «Система»',
    description: 'Курс «Система» — про то, как выстраивать процессы, а не тушить пожары. Ты собираешь понятную логику: цель → действия → результат, без хаоса и лишних шагов. На выходе',
    bgImage: poligonBg,
    isNew: false
  }
];

const filters = ['вернуть', 'система', 'искусство', 'промптинг', 'автоматизация'];

export const PoligonArticlesAllScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Calculate scale based on viewport width (design width: 1180px)
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;

  const handleFilterClick = (filter: string) => {
    if (filter === 'вернуть') {
      // Reset all filters and search
      setSelectedFilters([]);
      setSearchQuery('');
      return;
    }

    setSelectedFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim() && !searchHistory.includes(searchQuery.trim())) {
      setSearchHistory(prev => [searchQuery.trim(), ...prev.slice(0, 4)]);
    }
  };

  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      minHeight: '100vh',
      background: '#020101',
      overflow: 'hidden',
    }}>
      {/* Scaled container */}
      <div style={{
        position: 'relative',
        width: '1180px',
        minHeight: '2550px',
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
      }}>
        {/* Background pattern (фон точки) */}
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '1180px',
          height: '2550px',
          backgroundImage: `url(${bgPattern})`,
          backgroundRepeat: 'repeat',
          backgroundSize: 'auto',
        }} />

        {/* Header - Pixel perfect for poligon articles screen */}
        {/* Кнопка назад - круглая */}
        <div
          onClick={() => navigate('/about-poligon')}
          style={{
            position: 'absolute',
            left: '50px',
            top: '50px',
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            backgroundColor: 'transparent',
            border: '2px solid rgba(255,255,255,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'white',
            fontSize: '24px',
            fontWeight: 'bold'
          }}
        >
          ←
        </div>

        {/* Кнопка пользователь - круглая */}
        <div style={{
          position: 'absolute',
          left: '120px',
          top: '50px',
          width: '54px',
          height: '54px',
          borderRadius: '50%',
          backgroundColor: 'transparent',
          border: '2px solid rgba(255,255,255,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '20px'
        }}>
          👤
        </div>

        {/* Логотип центрированный */}
        <div style={{
          position: 'absolute',
          left: '50%',
          top: '45px',
          transform: 'translateX(-50%)',
          width: '150px',
          height: '64px',
          backgroundImage: `url(${logoSmall})`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center'
        }} />

        {/* Кнопка поддержки */}
        <div style={{
          position: 'absolute',
          right: '50px',
          top: '50px',
          padding: '12px 20px',
          borderRadius: '25px',
          backgroundColor: 'transparent',
          border: '2px solid rgba(255,255,255,0.3)',
          color: 'white',
          cursor: 'pointer',
          fontSize: '14px',
          fontFamily: 'Inter, sans-serif',
          whiteSpace: 'nowrap'
        }}>
          написать в поддержку
        </div>

        {/* Title */}
        <div style={{
          position: 'absolute',
          left: '50px',
          top: '150px',
          fontSize: '40px',
          fontWeight: 'bold',
          color: 'white',
          fontFamily: 'Inter, sans-serif',
        }}>
          статьи в полигоне
        </div>

        {/* Search bar */}
        <div style={{
          position: 'absolute',
          left: '50px',
          top: '220px',
          width: '600px'
        }}>
          <div style={{
            position: 'relative'
          }}>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit()}
              placeholder={!isFocused ? "найти по ключевым словам" : ""}
              style={{
                width: '100%',
                height: '60px',
                padding: '0 60px 0 25px',
                borderRadius: '30px',
                border: '2px solid rgba(255,255,255,0.3)',
                backgroundColor: 'transparent',
                color: 'white',
                fontSize: '18px',
                fontFamily: 'Inter, sans-serif',
                outline: 'none',
              }}
            />
            {/* Search icon */}
            <div style={{
              position: 'absolute',
              left: '20px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '24px',
              height: '24px',
              backgroundImage: 'url(/src/assets/иконка поиск.png)',
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
            }} />
          </div>

          {/* Search History */}
          {searchHistory.length > 0 && isFocused && (
            <div style={{
              position: 'absolute',
              top: '70px',
              left: 0,
              right: 0,
              backgroundColor: 'rgba(0,0,0,0.9)',
              borderRadius: '20px',
              padding: '15px',
              border: '1px solid rgba(255,255,255,0.2)',
              zIndex: 10
            }}>
              {searchHistory.map((term, index) => (
                <div
                  key={index}
                  onClick={() => setSearchQuery(term)}
                  style={{
                    padding: '8px 15px',
                    color: 'rgba(255,255,255,0.8)',
                    cursor: 'pointer',
                    fontSize: '16px',
                    borderRadius: '10px',
                    marginBottom: '5px',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  {term}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Filter buttons */}
        <div style={{
          position: 'absolute',
          left: '50px',
          top: '310px',
          display: 'flex',
          gap: '15px',
          flexWrap: 'wrap'
        }}>
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => handleFilterClick(filter)}
              style={{
                padding: '12px 24px',
                borderRadius: '25px',
                border: 'none',
                backgroundColor: filter === 'вернуть' 
                  ? 'rgba(255,255,255,0.9)' 
                  : selectedFilters.includes(filter)
                    ? '#4285F4'
                    : 'rgba(255,255,255,0.15)',
                color: filter === 'вернуть' 
                  ? '#000' 
                  : selectedFilters.includes(filter)
                    ? '#fff'
                    : '#fff',
                cursor: 'pointer',
                fontSize: '16px',
                fontFamily: 'Inter, sans-serif',
                fontWeight: filter === 'вернуть' ? 'bold' : 'normal',
                transition: 'all 0.2s ease'
              }}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Articles */}
        {articles.map((article, index) => (
          <div
            key={article.id}
            style={{
              position: 'absolute',
              left: '50px',
              top: `${400 + index * 160}px`,
              display: 'flex',
              gap: '20px',
              alignItems: 'flex-start'
            }}
          >
            {/* Article image */}
            <div style={{
              width: '240px',
              height: '150px',
              borderRadius: '15px',
              backgroundImage: `url(${article.bgImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              position: 'relative'
            }}>
              {/* "новое" label */}
              {article.isNew && (
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  left: '10px',
                  backgroundColor: '#FF4444',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  новое
                </div>
              )}
              
              {/* Читать button */}
              <button
                onClick={() => navigate('/article')}
                style={{
                  position: 'absolute',
                  bottom: '15px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'linear-gradient(90deg, #00FF88 0%, #00CCFF 100%)',
                  padding: '8px 20px',
                  borderRadius: '20px',
                  border: 'none',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif'
                }}
              >
                читать
              </button>
            </div>

            {/* Article content */}
            <div style={{
              flex: 1,
              maxWidth: '400px'
            }}>
              <div style={{
                fontSize: '16px',
                color: 'white',
                lineHeight: '1.4',
                fontFamily: 'Inter, sans-serif',
                marginBottom: '20px'
              }}>
                {article.description}
              </div>
            </div>

            {/* Arrow button */}
            <button
              onClick={() => navigate('/article')}
              style={{
                width: '60px',
                height: '40px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'white',
                fontSize: '20px',
                marginTop: '80px'
              }}
            >
              →
            </button>
          </div>
        ))}

        {/* Footer - reused from academy */}
        <div style={{
          position: 'absolute',
          bottom: '0px',
          left: '0px',
          right: '0px',
          height: '124px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 50px',
          backgroundColor: 'rgba(2,1,1,0.95)',
        }}>
          <img 
            src={logoFooter}
            alt="МЕТАФЛОРА*"
            style={{
              width: '380px',
              height: '83px',
            }}
          />
          
          <div style={{
            fontSize: '20px',
            color: 'white',
            fontFamily: 'Gotham Pro, sans-serif',
            fontWeight: 300
          }}>
            Copyright © Все права защищены.
          </div>

          <div style={{
            display: 'flex',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '62px',
            backgroundColor: 'rgba(255,255,255,0.1)',
            border: '4px solid rgba(255,255,255,0.3)'
          }}>
            <img
              src={socialsIcons}
              alt="социальные сети"
              style={{
                width: '50px', 
                height: '51px', 
                opacity: 0.6
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoligonArticlesAllScreen;