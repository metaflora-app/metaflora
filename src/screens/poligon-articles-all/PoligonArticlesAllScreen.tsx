import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface ArticleCard {
  id: number;
  title: string;
  description: string;
  category: string;
  imageUrl: string;
}

const mockArticles: ArticleCard[] = [
  {
    id: 1,
    title: "Курс «Система»",
    description: "Курс «Система» — про то, как выстраивать процессы, а не тушить пожары. Ты собираешь понятную логику: цель → действия → результат, без хаоса и лишних шагов. На выходе",
    category: "система",
    imageUrl: "/src/assets/фон академия.png"
  },
  {
    id: 2,
    title: "Курс «Система»",
    description: "Курс «Система» — про то, как выстраивать процессы, а не тушить пожары. Ты собираешь понятную логику: цель → действия → результат, без хаоса и лишних шагов. На выходе",
    category: "автоматизация",
    imageUrl: "/src/assets/фон лаба.png"
  },
  {
    id: 3,
    title: "Курс «Система»",
    description: "Курс «Система» — про то, как выстраивать процессы, а не тушить пожары. Ты собираешь понятную логику: цель → действия → результат, без хаоса и лишних шагов. На выходе",
    category: "промптинг",
    imageUrl: "/src/assets/фон цех.png"
  },
  {
    id: 4,
    title: "Курс «Система»",
    description: "Курс «Система» — про то, как выстраивать процессы, а не тушить пожары. Ты собираешь понятную логику: цель → действия → результат, без хаоса и лишних шагов. На выходе",
    category: "искусство",
    imageUrl: "/src/assets/фон полигон.png"
  }
];

const filterTags = ['вернуть', 'система', 'искусство', 'промптинг', 'автоматизация'];

export const PoligonArticlesAllScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>(['вернуть']);
  const [isFocused, setIsFocused] = useState(false);
  const navigate = useNavigate();

  const toggleFilter = (filter: string) => {
    if (filter === 'вернуть') {
      // Reset all filters
      setSelectedFilters(['вернуть']);
      setSearchQuery('');
      return;
    }
    
    setSelectedFilters(prev => {
      const withoutReturn = prev.filter(f => f !== 'вернуть');
      if (withoutReturn.includes(filter)) {
        const newFilters = withoutReturn.filter(f => f !== filter);
        return newFilters.length > 0 ? newFilters : ['вернуть'];
      } else {
        return [...withoutReturn, filter];
      }
    });
  };

  const filteredArticles = mockArticles.filter(article => {
    if (selectedFilters.includes('вернуть')) return true;
    return selectedFilters.some(filter => 
      article.category.toLowerCase().includes(filter.toLowerCase())
    );
  });

  const handleBack = () => {
    navigate(-1);
  };

  const handleHome = () => {
    navigate('/main-dashboard-premium');
  };

  return (
    <div style={{
      backgroundColor: '#020101',
      minHeight: '100vh',
      color: 'white',
      position: 'relative',
      fontFamily: 'Inter, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '50px 40px 30px',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Back button */}
        <button
          onClick={handleBack}
          style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            backgroundColor: 'transparent',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'white',
            fontSize: '20px'
          }}
        >
          ←
        </button>

        {/* User button */}
        <button
          style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            backgroundColor: 'transparent',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'white',
            fontSize: '20px'
          }}
        >
          👤
        </button>

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
        <button
          style={{
            padding: '12px 20px',
            borderRadius: '30px',
            backgroundColor: 'transparent',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            color: 'white',
            cursor: 'pointer',
            fontSize: '14px',
            whiteSpace: 'nowrap'
          }}
        >
          написать в поддержку
        </button>
      </div>

      {/* Title */}
      <div style={{
        padding: '0 40px',
        marginBottom: '40px'
      }}>
        <h1 style={{
          fontSize: '36px',
          fontWeight: 'bold',
          margin: 0,
          color: 'white'
        }}>
          статьи в полигоне
        </h1>
      </div>

      {/* Search bar */}
      <div style={{
        padding: '0 40px',
        marginBottom: '30px'
      }}>
        <div style={{
          position: 'relative',
          maxWidth: '600px'
        }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={!isFocused ? "найти по ключевому слову" : ""}
            style={{
              width: '100%',
              padding: '15px 50px 15px 20px',
              borderRadius: '25px',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              backgroundColor: 'transparent',
              color: 'white',
              fontSize: '16px',
              outline: 'none',
              fontFamily: 'Inter, sans-serif'
            }}
          />
          <div style={{
            position: 'absolute',
            right: '20px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: '20px'
          }}>
            🔍
          </div>
        </div>
      </div>

      {/* Filter tags */}
      <div style={{
        padding: '0 40px',
        marginBottom: '40px'
      }}>
        <div style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          {filterTags.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleFilter(tag)}
              style={{
                padding: '10px 20px',
                borderRadius: '25px',
                border: 'none',
                backgroundColor: selectedFilters.includes(tag) 
                  ? (tag === 'вернуть' ? 'rgba(255, 255, 255, 0.9)' : '#4285F4') 
                  : 'rgba(255, 255, 255, 0.1)',
                color: selectedFilters.includes(tag) 
                  ? (tag === 'вернуть' ? '#000' : '#fff')
                  : '#fff',
                cursor: 'pointer',
                fontSize: '16px',
                fontFamily: 'Inter, sans-serif',
                transition: 'all 0.2s ease'
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Articles list */}
      <div style={{
        padding: '0 40px 150px'
      }}>
        {filteredArticles.map((article) => (
          <div
            key={article.id}
            style={{
              display: 'flex',
              marginBottom: '30px',
              gap: '20px',
              alignItems: 'flex-start'
            }}
          >
            {/* Article image */}
            <div style={{
              width: '240px',
              height: '150px',
              borderRadius: '15px',
              backgroundImage: `url(${article.imageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              position: 'relative',
              flexShrink: 0
            }}>
              {article.id === 1 && (
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  left: '10px',
                  backgroundColor: '#FF4444',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  новое
                </div>
              )}
              
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
                  color: 'white'
                }}>
                  {article.description}
                </h3>
              </div>

              <div style={{
                alignSelf: 'flex-end'
              }}>
                <button
                  onClick={() => navigate('/article')}
                  style={{
                    width: '60px',
                    height: '40px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'white',
                    fontSize: '20px'
                  }}
                >
                  →
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '100px',
        backgroundColor: 'rgba(2, 1, 1, 0.95)',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 40px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
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
          color: 'rgba(255, 255, 255, 0.8)'
        }}>
          Copyright © Все права защищены.
        </div>

        <div style={{
          display: 'flex',
          gap: '15px'
        }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{ 
                width: '30px', 
                height: '30px', 
                opacity: 0.6,
                backgroundImage: 'url(/src/assets/figma-welcome/socials.png)',
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                cursor: 'pointer'
              }} 
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PoligonArticlesAllScreen;