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
    setSelectedFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  const filteredArticles = mockArticles.filter(article => {
    const matchesSearch = !searchQuery || 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = selectedFilters.length === 0 || 
      selectedFilters.some(filter => filter === 'вернуть' || article.category === filter);
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div style={{ 
      backgroundColor: '#020101',
      minHeight: '100vh',
      color: 'white',
      position: 'relative',
      padding: '0 24px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '75px 0 60px',
        gap: '20px'
      }}>
        {/* Back button */}
        <div style={{
          width: '100px',
          height: '100px',
          borderRadius: '62px',
          backgroundColor: 'rgba(255,255,255,0.1)',
          border: '4px solid rgba(255,255,255,0.3)',
          backdropFilter: 'blur(50px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer'
        }}
        onClick={() => navigate(-1)}
        >
          <div style={{ transform: 'rotate(270deg)', fontSize: '24px' }}>←</div>
        </div>

        {/* Logo */}
        <div style={{
          height: '131px',
          width: '186px',
          backgroundImage: 'url(/src/assets/figma-welcome/splash-logo.png)',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center'
        }} />

        {/* Support button */}
        <div style={{
          width: '205px',
          height: '78px',
          borderRadius: '62px',
          backgroundColor: 'rgba(255,255,255,0.1)',
          border: '4px solid rgba(255,255,255,0.3)',
          backdropFilter: 'blur(50px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: '20px',
          textAlign: 'center',
          lineHeight: '1.2'
        }}>
          написать<br/>
          <strong>в поддержку</strong>
        </div>
      </div>

      {/* Title */}
      <h1 style={{
        fontSize: '80px',
        fontWeight: 800,
        textAlign: 'left',
        margin: '0 0 40px',
        fontFamily: 'Inter, sans-serif'
      }}>
        статьи в полигоне
      </h1>

      {/* Search */}
      <div style={{
        position: 'relative',
        maxWidth: '894px',
        margin: '0 auto 40px',
        height: '72px'
      }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={!isFocused ? "найти по ключевым словам" : ""}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '62px',
            backgroundColor: 'transparent',
            border: '4px solid rgba(255,255,255,0.3)',
            backdropFilter: 'blur(50px)',
            padding: '0 23px 0 70px',
            fontSize: '27px',
            color: 'white',
            outline: 'none',
            fontFamily: 'Gotham Pro, sans-serif',
            fontWeight: 300
          }}
        />
        <div style={{
          position: 'absolute',
          left: '23px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '38px',
          height: '38px',
          backgroundImage: 'url(/src/assets/иконка поиск.png)',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat'
        }} />
      </div>

      {/* Filter tags */}
      <div style={{
        display: 'flex',
        gap: '16px',
        margin: '0 auto 60px',
        maxWidth: '894px',
        flexWrap: 'wrap'
      }}>
        {filterTags.map(tag => (
          <button
            key={tag}
            onClick={() => toggleFilter(tag)}
            style={{
              padding: '16px 32px',
              borderRadius: '62px',
              backgroundColor: selectedFilters.includes(tag) ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.9)',
              border: '4px solid rgba(255,255,255,0.3)',
              backdropFilter: 'blur(50px)',
              color: 'white',
              fontSize: '27px',
              fontFamily: 'Gotham Pro, sans-serif',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {selectedFilters.includes(tag) && (
              <div style={{
                position: 'absolute',
                top: '-44px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: '8px'
              }}>
                <div style={{
                  width: '102px',
                  height: '107px',
                  borderRadius: '1568px',
                  backgroundColor: tag === 'вернуть' ? 'white' : '#37ecf7'
                }} />
                <div style={{
                  width: '51px',
                  height: '76px',
                  borderRadius: '1568px',
                  backgroundColor: '#f0d825',
                  transform: 'rotate(17deg) skewX(-15deg)'
                }} />
                <div style={{
                  width: '56px',
                  height: '73px',
                  borderRadius: '1568px',
                  backgroundColor: '#d5fc44'
                }} />
              </div>
            )}
            {tag}
          </button>
        ))}
      </div>

      {/* Articles Grid */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '64px',
        maxWidth: '894px',
        margin: '0 auto',
        paddingBottom: '200px'
      }}>
        {filteredArticles.map((article, index) => (
          <div key={article.id} style={{
            display: 'flex',
            height: '249px',
            borderRadius: '26px',
            overflow: 'hidden',
            flexDirection: index % 2 === 0 ? 'row' : 'row-reverse'
          }}>
            {/* Image */}
            <div style={{
              flex: '0 0 50%',
              backgroundImage: `url(${article.imageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              position: 'relative'
            }}>
              {index === 0 && (
                <div style={{
                  position: 'absolute',
                  top: '19px',
                  right: '40px',
                  padding: '8px 24px',
                  borderRadius: '62px',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  border: '2px solid rgba(255,255,255,0.3)',
                  backdropFilter: 'blur(50px)',
                  fontSize: '18px',
                  color: 'white',
                  fontFamily: 'Gotham Pro, sans-serif',
                  fontWeight: 500
                }}>
                  новое
                </div>
              )}
            </div>

            {/* Content */}
            <div style={{
              flex: '0 0 50%',
              backgroundColor: 'black',
              border: '4px solid rgba(255,255,255,0.3)',
              position: 'relative',
              padding: '30px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <p style={{
                fontSize: '27px',
                color: 'white',
                fontFamily: 'Gotham Pro, sans-serif',
                fontWeight: 300,
                lineHeight: '1.2',
                margin: 0,
                textAlign: 'center'
              }}>
                {article.description}
              </p>

              <button 
                onClick={() => navigate('/article')}
                style={{
                position: 'absolute',
                bottom: '32px',
                left: '32px',
                width: '150px',
                height: '78px',
                borderRadius: '62px',
                backgroundColor: 'rgba(0,0,0,0.9)',
                border: '4px solid rgba(255,255,255,0.3)',
                backdropFilter: 'blur(50px)',
                color: 'white',
                fontSize: '27px',
                fontFamily: 'Gotham Pro, sans-serif',
                fontWeight: 500,
                cursor: 'pointer',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-44px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  gap: '8px'
                }}>
                  <div style={{
                    width: '102px',
                    height: '107px',
                    borderRadius: '1568px',
                    backgroundColor: '#37ecf7'
                  }} />
                  <div style={{
                    width: '51px',
                    height: '76px',
                    borderRadius: '1568px',
                    backgroundColor: '#f0d825',
                    transform: 'rotate(17deg) skewX(-15deg)'
                  }} />
                  <div style={{
                    width: '56px',
                    height: '73px',
                    borderRadius: '1568px',
                    backgroundColor: '#d5fc44'
                  }} />
                </div>
                читать
              </button>
            </div>

            {/* Arrow overlay */}
            <div style={{
              position: 'absolute',
              right: index % 2 === 0 ? '36.5%' : 'auto',
              left: index % 2 === 0 ? 'auto' : '36.5%',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '80px',
              height: '80px',
              backgroundColor: 'rgba(255,255,255,0.1)',
              border: '4px solid rgba(255,255,255,0.3)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              backdropFilter: 'blur(50px)'
            }}>
              {index % 2 === 0 ? '→' : '←'}
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
        height: '124px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 50px',
        backgroundColor: 'rgba(2,1,1,0.8)',
        backdropFilter: 'blur(20px)'
      }}>
        <div style={{
          width: '380px',
          height: '83px',
          backgroundImage: 'url(/src/assets/figma-welcome/footer-logo.png)',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat'
        }} />
        
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
          border: '4px solid rgba(255,255,255,0.3)',
          backdropFilter: 'blur(50px)'
        }}>
          <div style={{ 
            width: '50px', 
            height: '51px', 
            opacity: 0.6,
            backgroundImage: 'url(/src/assets/figma-welcome/socials.png)',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat'
          }} />
        </div>
      </div>
    </div>
  );
};