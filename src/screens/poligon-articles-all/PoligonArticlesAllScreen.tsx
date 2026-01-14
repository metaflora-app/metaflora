import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// Images - REUSE FROM about-laba
import bgPattern from '../../assets/figma-welcome/pattern.png';
import logoSmall from '../../assets/figma-welcome/logo-small.png';
import logoFooter from '../../assets/figma-welcome/logo-footer.png';
import socialsIcons from '../../assets/welcome-elements/socials-icons.png';
import supportButton from '../../assets/tour-video/support-button.png';
import exitArrow from '../../assets/tour-video/exit-arrow.png';
import homeIcon from '../../assets/about-screens/домой.png';

// PNG FILES from desktop
import searchIcon from '../../assets/иконка поиск.png';
import readButton from '../../assets/кнопка читать.png';
import systemButton from '../../assets/кнопка система.png';
import artButton from '../../assets/кнопка искусство.png';
import promptButton from '../../assets/кнопка промптинг.png';
import newLabel from '../../assets/новое в академии.png';
import arrowRight from '../../assets/шторка вправо.png';

// Article background images 
import academyBg from '../../assets/main-dashboard/фон академия.png';
import labaBg from '../../assets/main-dashboard/фон лаба.png';
import tsekhBg from '../../assets/main-dashboard/фон цех.png';
import poligonBg from '../../assets/main-dashboard/фон полигон.png';

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

  const articles = [
    { id: 1, bgImage: poligonBg, isNew: true },
    { id: 2, bgImage: labaBg, isNew: false },
    { id: 3, bgImage: tsekhBg, isNew: false },
    { id: 4, bgImage: academyBg, isNew: false }
  ];

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
        {/* Background pattern (фон точки) - REUSED FROM about-laba */}
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

        {/* HEADER - EXACT COPY FROM about-laba */}
        <img 
          src={exitArrow}
          alt="назад"
          onClick={() => navigate('/about-poligon')}
          style={{
            position: 'absolute',
            left: 'calc(50% - 452px)',
            top: '75px',
            width: '100px',
            height: '100px',
            cursor: 'pointer',
          }}
        />

        <img 
          src={homeIcon}
          alt="домой"
          onClick={() => navigate('/main-dashboard-premium')}
          style={{
            position: 'absolute',
            left: 'calc(50% - 352px)',
            top: '75px',
            width: '100px',
            height: '100px',
            cursor: 'pointer',
          }}
        />

        <div style={{
          position: 'absolute',
          left: '500px',
          top: '61px',
          width: '186px',
          height: '131px',
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            pointerEvents: 'none',
          }}>
            <img 
              src={logoSmall}
              alt="МЕТАФЛОРА*"
              style={{
                position: 'absolute',
                height: '131.84%',
                left: '-21.84%',
                top: '-16.38%',
                width: '143.34%',
                maxWidth: 'none',
              }}
            />
          </div>
        </div>

        <img 
          src={supportButton}
          alt="написать в поддержку"
          style={{
            position: 'absolute',
            left: 'calc(50% + 281px)',
            top: '75px',
            width: '205px',
            height: '78px',
            cursor: 'pointer',
          }}
        />

        {/* TITLE */}
        <div style={{
          position: 'absolute',
          left: '50px',
          top: '250px',
          color: 'white',
          fontSize: '40px',
          fontWeight: 'bold',
          fontFamily: 'Inter, sans-serif'
        }}>
          статьи в полигоне
        </div>

        {/* SEARCH BAR - pixel perfect */}
        <div style={{
          position: 'absolute',
          left: '50px',
          top: '320px',
          width: '600px',
        }}>
          <div style={{
            position: 'relative',
            width: '100%',
            height: '60px',
            borderRadius: '30px',
            border: '2px solid rgba(255,255,255,0.3)',
            backgroundColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: '50px',
            paddingRight: '20px'
          }}>
            <img 
              src={searchIcon}
              alt="поиск"
              style={{
                position: 'absolute',
                left: '20px',
                width: '20px',
                height: '20px'
              }}
            />
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
                flex: 1,
                border: 'none',
                backgroundColor: 'transparent',
                color: 'white',
                fontSize: '16px',
                fontFamily: 'Inter, sans-serif',
                outline: 'none',
              }}
            />
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

        {/* FILTER BUTTONS - using PNG files */}
        <div style={{
          position: 'absolute',
          left: '50px',
          top: '420px',
          display: 'flex',
          gap: '15px',
          flexWrap: 'wrap'
        }}>
          {/* Кнопка "вернуть" */}
          <button
            onClick={() => handleFilterClick('вернуть')}
            style={{
              padding: '12px 24px',
              borderRadius: '25px',
              border: 'none',
              backgroundColor: 'rgba(255,255,255,0.9)',
              color: '#000',
              cursor: 'pointer',
              fontSize: '16px',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 'bold'
            }}
          >
            вернуть
          </button>

          {/* PNG кнопки */}
          <img 
            src={systemButton}
            alt="система"
            onClick={() => handleFilterClick('система')}
            style={{
              height: '45px',
              cursor: 'pointer',
              opacity: selectedFilters.includes('система') ? 1 : 0.7
            }}
          />

          <img 
            src={artButton}
            alt="искусство"
            onClick={() => handleFilterClick('искусство')}
            style={{
              height: '45px',
              cursor: 'pointer',
              opacity: selectedFilters.includes('искусство') ? 1 : 0.7
            }}
          />

          <img 
            src={promptButton}
            alt="промптинг"
            onClick={() => handleFilterClick('промптинг')}
            style={{
              height: '45px',
              cursor: 'pointer',
              opacity: selectedFilters.includes('промптинг') ? 1 : 0.7
            }}
          />

          <button
            onClick={() => handleFilterClick('автоматизация')}
            style={{
              padding: '12px 24px',
              borderRadius: '25px',
              border: 'none',
              backgroundColor: selectedFilters.includes('автоматизация') ? '#4285F4' : 'rgba(255,255,255,0.15)',
              color: 'white',
              cursor: 'pointer',
              fontSize: '16px',
              fontFamily: 'Inter, sans-serif'
            }}
          >
            автоматизация
          </button>
        </div>

        {/* ARTICLE CARDS - pixel perfect layout */}
        {articles.map((article, index) => (
          <div
            key={article.id}
            style={{
              position: 'absolute',
              left: '50px',
              top: `${520 + index * 160}px`,
              display: 'flex',
              gap: '20px',
              alignItems: 'flex-start'
            }}
          >
            {/* Article image with новое label and читать button */}
            <div style={{
              width: '240px',
              height: '150px',
              borderRadius: '15px',
              backgroundImage: `url(${article.bgImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              position: 'relative'
            }}>
              {/* "новое" label using PNG */}
              {article.isNew && (
                <img 
                  src={newLabel}
                  alt="новое"
                  style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    height: '20px'
                  }}
                />
              )}
              
              {/* Читать button using PNG */}
              <img 
                src={readButton}
                alt="читать"
                onClick={() => navigate('/article')}
                style={{
                  position: 'absolute',
                  bottom: '15px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  height: '35px',
                  cursor: 'pointer'
                }}
              />
            </div>

            {/* Article text */}
            <div style={{
              flex: 1,
              maxWidth: '400px',
              fontSize: '16px',
              color: 'white',
              lineHeight: '1.4',
              fontFamily: 'Inter, sans-serif'
            }}>
              Курс «Система» — про то, как выстраивать процессы, а не тушить пожары. Ты собираешь понятную логику: цель → действия → результат, без хаоса и лишних шагов. На выходе
            </div>

            {/* Arrow button using PNG */}
            <img 
              src={arrowRight}
              alt="перейти"
              onClick={() => navigate('/article')}
              style={{
                width: '60px',
                height: '40px',
                cursor: 'pointer',
                marginTop: '60px'
              }}
            />
          </div>
        ))}

        {/* FOOTER - EXACT COPY FROM about-laba */}
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