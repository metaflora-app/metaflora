import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import bgPattern from '../../assets/figma-welcome/pattern.png';

export const PoligonArticlesAllScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filters = ['лаба', 'академия', 'полигон', 'цех'];

  const toggleFilter = (filter: string) => {
    setSelectedFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  const handleSearchSubmit = () => {
    if (searchValue.trim() && !searchHistory.includes(searchValue.trim())) {
      setSearchHistory(prev => [searchValue.trim(), ...prev.slice(0, 4)]);
    }
  };

  // Mock articles data
  const articles = [
    {
      id: 1,
      title: 'Курс "Система" — про то, как выстраивать процессы, а не тушить пожары.',
      description: 'Ты собираешь понятную логику: цель → действия → результат, без хаоса и лишних шагов. На выходе',
      isNew: true,
      bgImage: '/src/assets/фон полигон.png'
    },
    {
      id: 2, 
      title: 'Курс "Система" — про то, как выстраивать процессы, а не тушить пожары.',
      description: 'Ты собираешь понятную логику: цель → действия → результат, без хаоса и лишних шагов. На выходе',
      isNew: false,
      bgImage: '/src/assets/фон полигон.png'
    },
    {
      id: 3,
      title: 'Курс "Система" — про то, как выстраивать процессы, а не тушить пожары.',
      description: 'Ты собираешь понятную логику: цель → действия → результат, без хаоса и лишних шагов. На выходе',
      isNew: false,
      bgImage: '/src/assets/фон полигон.png'
    },
    {
      id: 4,
      title: 'Курс "Система" — про то, как выстраивать процессы, а не тушить пожары.',
      description: 'Ты собираешь понятную логику: цель → действия → результат, без хаоса и лишних шагов. На выходе',
      isNew: false,
      bgImage: '/src/assets/фон полигон.png'
    }
  ];

  return (
    <div style={{ 
      backgroundColor: '#020101',
      minHeight: '100vh',
      color: 'white',
      position: 'relative',
      padding: '0'
    }}>
      {/* Background Pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${bgPattern})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'repeat',
          opacity: 0.3
        }}
      />

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '50px 40px 40px',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Back button */}
        <div style={{
          width: '54px',
          height: '54px',
          borderRadius: '50%',
          backgroundColor: '#1a1a1a',
          border: '2px solid #333',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer'
        }}
        onClick={() => navigate(-1)}
        >
          <div style={{ transform: 'rotate(180deg)', fontSize: '20px', color: 'white' }}>→</div>
        </div>

        {/* User icon */}
        <div style={{
          width: '54px',
          height: '54px',
          borderRadius: '50%',
          backgroundColor: '#1a1a1a',
          border: '2px solid #333',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer'
        }}>
          <div style={{ fontSize: '20px' }}>👤</div>
        </div>

        {/* Logo */}
        <div style={{
          height: '54px',
          width: '150px',
          backgroundImage: 'url(/src/assets/figma-welcome/splash-logo.png)',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center'
        }} />

        {/* Support button */}
        <div style={{
          padding: '12px 20px',
          borderRadius: '30px',
          backgroundColor: '#1a1a1a',
          border: '2px solid #333',
          cursor: 'pointer',
          fontSize: '14px',
          fontFamily: 'Inter, sans-serif'
        }}>
          написать в поддержку
        </div>
      </div>

      {/* Title */}
      <div style={{
        textAlign: 'left',
        padding: '0 40px',
        marginBottom: '30px',
        position: 'relative',
        zIndex: 1
      }}>
        <h1 style={{
          fontSize: '36px',
          fontWeight: 'bold',
          margin: 0,
          fontFamily: 'Inter, sans-serif'
        }}>
          статьи в полигоне
        </h1>
      </div>

      {/* Search Section */}
      <div style={{
        padding: '0 40px',
        marginBottom: '30px',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          position: 'relative',
          maxWidth: '600px'
        }}>
          <input
            ref={searchInputRef}
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit()}
            placeholder={!isFocused ? "найти по ключевому слову" : ""}
            style={{
              width: '100%',
              padding: '15px 50px 15px 20px',
              borderRadius: '25px',
              border: '1px solid #333',
              backgroundColor: 'transparent',
              backgroundImage: 'url(/src/assets/обводка поисковик.png)',
              backgroundSize: '100% 100%',
              color: 'white',
              fontSize: '16px',
              fontFamily: 'Inter, sans-serif',
              outline: 'none'
            }}
          />
          <div style={{
            position: 'absolute',
            right: '20px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '20px',
            height: '20px',
            backgroundImage: 'url(/src/assets/иконка поиск.png)',
            backgroundSize: 'contain',
            cursor: 'pointer'
          }}
          onClick={() => searchInputRef.current?.focus()}
          />
        </div>

        {/* Search History */}
        {searchHistory.length > 0 && (
          <div style={{
            marginTop: '15px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            {searchHistory.map((term, index) => (
              <div
                key={index}
                style={{
                  padding: '8px 15px',
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '20px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  opacity: 0.8
                }}
                onClick={() => setSearchValue(term)}
              >
                {term}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filter Section */}
      <div style={{
        padding: '0 40px',
        marginBottom: '40px',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          display: 'flex',
          gap: '15px',
          flexWrap: 'wrap'
        }}>
          {/* Return button */}
          <div
            style={{
              backgroundImage: 'url(/src/assets/кнопка вернуть.png)',
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              width: '120px',
              height: '40px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '16px',
              fontFamily: 'Inter, sans-serif'
            }}
            onClick={() => {
              setSelectedFilters([]);
              setSearchValue('');
              setSearchHistory([]);
            }}
          />

          {filters.map((filter) => (
            <div
              key={filter}
              style={{
                padding: '10px 25px',
                borderRadius: '25px',
                backgroundColor: selectedFilters.includes(filter) ? '#4a90e2' : '#1a1a1a',
                border: selectedFilters.includes(filter) ? '2px solid #4a90e2' : '2px solid #333',
                color: 'white',
                fontSize: '16px',
                fontFamily: 'Inter, sans-serif',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onClick={() => toggleFilter(filter)}
            >
              {filter}
            </div>
          ))}
        </div>
      </div>

      {/* Articles Grid */}
      <div style={{
        padding: '0 40px 150px',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '30px'
        }}>
          {articles.map((article) => (
            <div
              key={article.id}
              style={{
                display: 'flex',
                gap: '20px',
                alignItems: 'stretch'
              }}
            >
              {/* Article Image */}
              <div style={{
                width: '240px',
                height: '150px',
                borderRadius: '15px',
                backgroundImage: `url(${article.bgImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative',
                flexShrink: 0
              }}>
                {article.isNew && (
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    backgroundColor: '#ff4444',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    новое
                  </div>
                )}
                
                <div style={{
                  position: 'absolute',
                  bottom: '15px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'linear-gradient(90deg, #00ff88, #00ccff)',
                  padding: '8px 20px',
                  borderRadius: '20px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
                onClick={() => navigate('/article')}
                >
                  читать
                </div>
              </div>

              {/* Article Content */}
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '150px'
              }}>
                <div>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '500',
                    margin: '0 0 10px 0',
                    lineHeight: '1.4',
                    fontFamily: 'Inter, sans-serif',
                    color: 'white'
                  }}>
                    {article.title}
                  </h3>
                  
                  <p style={{
                    fontSize: '14px',
                    opacity: 0.8,
                    margin: 0,
                    lineHeight: '1.5',
                    fontFamily: 'Inter, sans-serif'
                  }}>
                    {article.description}
                  </p>
                </div>

                <div style={{
                  marginTop: '10px',
                  alignSelf: 'flex-end'
                }}>
                  <div style={{
                    width: '60px',
                    height: '40px',
                    backgroundColor: '#333',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                  onClick={() => navigate('/article')}
                  >
                    <div style={{ color: 'white', fontSize: '20px' }}>→</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '100px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 40px',
        backgroundColor: 'rgba(2,1,1,0.95)',
        backdropFilter: 'blur(20px)',
        zIndex: 10,
        borderTop: '1px solid #333'
      }}>
        <div style={{
          width: '200px',
          height: '40px',
          backgroundImage: 'url(/src/assets/figma-welcome/footer-logo.png)',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat'
        }} />
        
        <div style={{
          fontSize: '14px',
          color: 'white',
          fontFamily: 'Inter, sans-serif',
          opacity: 0.8
        }}>
          Copyright © Все права защищены.
        </div>

        <div style={{
          display: 'flex',
          gap: '15px'
        }}>
          <div style={{ 
            width: '30px', 
            height: '30px', 
            opacity: 0.6,
            backgroundImage: 'url(/src/assets/figma-welcome/socials.png)',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            cursor: 'pointer'
          }} />
          <div style={{ 
            width: '30px', 
            height: '30px', 
            opacity: 0.6,
            backgroundImage: 'url(/src/assets/figma-welcome/socials.png)',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            cursor: 'pointer'
          }} />
          <div style={{ 
            width: '30px', 
            height: '30px', 
            opacity: 0.6,
            backgroundImage: 'url(/src/assets/figma-welcome/socials.png)',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            cursor: 'pointer'
          }} />
        </div>
      </div>
    </div>
  );
};

export default PoligonArticlesAllScreen;