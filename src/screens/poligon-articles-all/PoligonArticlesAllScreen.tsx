import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPolygonArticles } from '../../utils/contentApi';
import type { PolygonArticle } from '../../types/content';

// Reused assets
import bgPattern from '../../assets/figma-welcome/pattern.png';
import logoSmall from '../../assets/figma-welcome/logo-small.png';
import logoFooter from '../../assets/figma-welcome/logo-footer.png';
import socialsIcons from '../../assets/welcome-elements/socials-icons.png';
import supportButton from '../../assets/tour-video/support-button.png';
import searchIconPNG from '../../assets/иконка поиск.png';
import returnButton from '../../assets/кнопка вернуть не активная.png';

// Poligon filter buttons
import systemActive from '../../assets/poligon-articles/кнопка система актив.png';
import systemInactive from '../../assets/poligon-articles/кнопка система неактив.png';
import artActive from '../../assets/poligon-articles/кнопка искусство актив.png';
import artInactive from '../../assets/poligon-articles/кнопка искусство неактив.png';
import promptingActive from '../../assets/poligon-articles/кнопка промптинг актив.png';
import promptingInactive from '../../assets/poligon-articles/кнопка промптинг неактив.png';
import automationActive from '../../assets/poligon-articles/кнопка автоматизация актив.png';
import automationInactive from '../../assets/poligon-articles/кнопка автоматизация неактив.png';

// Article assets
import bgAcademy from '../../assets/poligon-articles/фон академия.png';
import bgLaba from '../../assets/poligon-articles/фон лаба.png';
import bgWorkshop from '../../assets/poligon-articles/фон цех.png';
import bgPoligon from '../../assets/poligon-articles/фон полигон.png';
import readButton from '../../assets/poligon-articles/кнопка читать.png';
import peopleInCircle from '../../assets/poligon-articles/люди в круге.png';

const PoligonArticlesAllScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  
  // Загрузка статей из Supabase
  const [articles, setArticles] = useState<PolygonArticle[]>([]);
  const [allArticles, setAllArticles] = useState<PolygonArticle[]>([]); // Все статьи без поиска
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;

  // Загрузить статьи при монтировании И при изменении фильтров
  useEffect(() => {
    loadArticles();
  }, []); // Первая загрузка при монтировании
  
  useEffect(() => {
    loadArticles();
  }, [selectedFilters]); // Перезагрузка при изменении фильтров

  const loadArticles = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const activeFilters = selectedFilters.filter(f => f !== 'вернуть');
      
      // УБРАЛ КЭШ - теперь всегда свежие данные
      const result = await getPolygonArticles({
        tags: activeFilters.length > 0 ? activeFilters : undefined,
        isActive: true,
        limit: 20,
        offset: 0,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      setArticles(result.data);
      setAllArticles(result.data); // Сохраняем все статьи
    } catch (err) {
      console.error('Error loading articles:', err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  // Поиск по ключевым словам при нажатии Enter
  const handleSearch = () => {
    if (!searchValue.trim()) {
      setArticles(allArticles);
      return;
    }

    const searchWords = searchValue.toLowerCase().trim().split(/\s+/);
    const filtered = allArticles.filter(article => {
      const searchableText = [
        article.title,
        article.annotation || '',
        ...(article.keywords || [])
      ].join(' ').toLowerCase();

      return searchWords.every(word => searchableText.includes(word));
    });

    setArticles(filtered);

    // Показать алерт если ничего не найдено
    if (filtered.length === 0) {
      const telegram = (window as any).Telegram;
      if (telegram?.WebApp?.showPopup) {
        telegram.WebApp.showPopup({
          message: 'статья не найдена. проверьте корректность написания'
        });
      }
      // Очищаем поиск и возвращаем все статьи
      setSearchValue('');
      setArticles(allArticles);
    }
  };

  const toggleFilter = (filter: string) => {
    if (filter === 'вернуть') {
      setSelectedFilters([]);
    } else {
      // ТОЛЬКО ОДИН фильтр можно выбрать
      setSelectedFilters([filter]);
    }
  };

  const isFilterActive = (filter: string) => selectedFilters.includes(filter);

  // Функция рендера карточки статьи
  const renderArticleCard = (article: PolygonArticle, index: number, useScrollContainer: boolean) => {
    // Если контейнер - координаты относительно него, иначе - от страницы
    const yPosition = useScrollContainer 
      ? 70 + (index * 360)  // Контейнер 550px, карточки с 70px, шаг 360px (+30%)
      : 600 + (index * 280); // Оригинальные координаты
    const bgImages = [bgAcademy, bgLaba, bgWorkshop, bgPoligon];
    const bgImage = article.cover_image_url || bgImages[index % 4];

    return (
      <div key={article.id} style={{
        position: 'absolute',
        left: '141px',
        top: `${yPosition}px`,
        width: '894px',
        height: '249px',
        zIndex: 2,
      }}>
        {/* Background image */}
        <img 
          src={bgImage}
          alt=""
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '450px',
            height: '249px',
            borderRadius: '30px',
            objectFit: 'cover',
          }}
        />
        {/* New badge CSS - как в сервисе */}
        {article.filter_tags?.includes('новое') && (
          <div className="blur-wave button-inner-glow" style={{
            position: 'absolute',
            left: '336px',
            top: '19px',
            width: '101px',
            height: '36px',
            backdropFilter: 'blur(50px)',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '62px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 5,
          }}>
            <div style={{
              fontFamily: 'Gotham Pro',
              fontWeight: 500,
              fontSize: '20px',
              color: 'white',
              lineHeight: 0,
            }}>
              новое
            </div>
          </div>
        )}
        {/* Text block */}
        <div className="blur-wave" style={{
          position: 'absolute',
          left: '450px',
          top: 0,
          width: '444px',
          height: '249px',
          backdropFilter: 'blur(50px)',
          background: 'black',
          border: '4px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '30px',
        }}>
          <div style={{
            position: 'absolute',
            left: '27px',
            top: '30px',
            width: '390px',
            height: '189px',
            fontFamily: 'Gotham Pro',
            fontWeight: 300,
            fontSize: '27px',
            lineHeight: 0,
            color: 'white',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}>
            <p style={{ margin: 0, lineHeight: 'normal' }}>{article.annotation || article.title}</p>
          </div>
        </div>
        {/* Read button */}
        <img 
          src={readButton}
          alt="читать"
          onClick={() => navigate(`/article/${article.id}`)}
          className="button-inner-glow"
          style={{
            position: 'absolute',
            left: '102px',
            top: '85px',
            width: '247px',
            height: '80px',
            cursor: 'pointer',
            objectFit: 'contain',
            zIndex: 10,
          }}
        />
      </div>
    );
  };

  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      minHeight: '100vh',
      background: '#020101',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'relative',
        width: '1180px',
        minHeight: '2550px',
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
      }}>
        {/* Background pattern */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${bgPattern})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'repeat',
        }} />

        {/* People in circle background (34:953) - x=151, y=1280, 880x570 - BEHIND ALL */}
        <div style={{
          position: 'absolute',
          left: '151px',
          top: '1280px',
          width: '880px',
          height: '570px',
          zIndex: 1,
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            pointerEvents: 'none',
          }}>
            <img 
              src={peopleInCircle}
              alt=""
              style={{
                position: 'absolute',
                height: '174.12%',
                left: '-37.23%',
                top: '-32.93%',
                width: '169.48%',
                maxWidth: 'none',
              }}
            />
          </div>
        </div>

        {/* Header */}
        <div 
          onClick={() => navigate('/main-dashboard-premium')}
          style={{
            position: 'absolute',
            left: '500px',
            top: '61px',
            width: '186px',
            height: '131px',
            cursor: 'pointer',
            zIndex: 10,
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
            left: '829px',
            top: '97px',
            width: '205px',
            height: '78px',
            cursor: 'pointer',
            zIndex: 10,
          }}
        />

        {/* Title "статьи в полигоне" (7:2341) - x=85, y=193, 1020x80 */}
        <div style={{
          position: 'absolute',
          left: '85px',
          top: '193px',
          width: '1020px',
          height: '80px',
          fontFamily: 'Inter',
          fontWeight: 800,
          fontSize: '80px',
          lineHeight: 0,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          zIndex: 10,
        }}>
          <p style={{ margin: 0 }}>статьи в полигоне</p>
        </div>

        {/* Search bar (7:2408) - x=141, y=292, 894x72 */}
        <div style={{
          position: 'absolute',
          left: '141px',
          top: '292px',
          width: '894px',
          height: '72px',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '62px',
          display: 'flex',
          alignItems: 'center',
          paddingLeft: '30px',
          zIndex: 10,
        }}>
          <img 
            src={searchIconPNG}
            alt=""
            style={{
              width: '38px',
              height: '38px',
              marginRight: '15px',
            }}
          />
          <input
            ref={searchInputRef}
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                searchInputRef.current?.blur();
                handleSearch();
              }
            }}
            placeholder={isSearchFocused ? '' : 'найти по ключевым словам'}
            enterKeyHint="search"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontFamily: 'Gotham Pro',
              fontWeight: 300,
              fontSize: '32px',
              color: 'white',
              paddingRight: '20px',
            }}
          />
        </div>

        {/* Filter: вернуть (53:626) - x=220, y=394 */}
        <img
          src={returnButton}
          alt="вернуть"
          onClick={() => toggleFilter('вернуть')}
          style={{
            position: 'absolute',
            left: '220px',
            top: '394px',
            width: '247px',
            height: '80px',
            cursor: 'pointer',
            objectFit: 'contain',
            zIndex: 10,
          }}
        />

        {/* Filter: система (53:632) - x=467, y=394 */}
        <img
          src={isFilterActive('система') ? systemActive : systemInactive}
          alt="система"
          onClick={() => toggleFilter('система')}
          className="button-inner-glow"
          style={{
            position: 'absolute',
            left: '467px',
            top: '394px',
            width: '247px',
            height: '80px',
            cursor: 'pointer',
            objectFit: 'contain',
            zIndex: 10,
          }}
        />

        {/* Filter: искусство (53:639) - x=714, y=394 */}
        <img
          src={isFilterActive('искусство') ? artActive : artInactive}
          alt="искусство"
          onClick={() => toggleFilter('искусство')}
          className="button-inner-glow"
          style={{
            position: 'absolute',
            left: '714px',
            top: '394px',
            width: '247px',
            height: '80px',
            cursor: 'pointer',
            objectFit: 'contain',
            zIndex: 10,
          }}
        />

        {/* Filter: промптинг (53:642) - x=343, y=473 */}
        <img
          src={isFilterActive('промптинг') ? promptingActive : promptingInactive}
          alt="промптинг"
          onClick={() => toggleFilter('промптинг')}
          className="button-inner-glow"
          style={{
            position: 'absolute',
            left: '343px',
            top: '473px',
            width: '247px',
            height: '80px',
            cursor: 'pointer',
            objectFit: 'contain',
            zIndex: 10,
          }}
        />

        {/* Filter: автоматизация (53:644) - x=590, y=473 */}
        <img
          src={isFilterActive('автоматизация') ? automationActive : automationInactive}
          alt="автоматизация"
          onClick={() => toggleFilter('автоматизация')}
          className="button-inner-glow"
          style={{
            position: 'absolute',
            left: '590px',
            top: '473px',
            width: '247px',
            height: '80px',
            cursor: 'pointer',
            objectFit: 'contain',
            zIndex: 10,
          }}
        />

        {/* Loading/Error/Empty states */}
        {loading && (
          <div style={{
            position: 'absolute',
            left: '50%',
            top: '700px',
            transform: 'translateX(-50%)',
            color: 'white',
            fontSize: '24px',
            fontFamily: 'Gotham Pro',
            zIndex: 10,
          }}>
            Загрузка статей...
          </div>
        )}

        {error && !loading && (
          <div style={{
            position: 'absolute',
            left: '50%',
            top: '700px',
            transform: 'translateX(-50%)',
            color: '#ff4444',
            fontSize: '20px',
            fontFamily: 'Gotham Pro',
            textAlign: 'center',
            maxWidth: '600px',
            zIndex: 10,
          }}>
            Ошибка: {error}
          </div>
        )}

        {!loading && !error && articles.length === 0 && (
          <div style={{
            position: 'absolute',
            left: '50%',
            top: '700px',
            transform: 'translateX(-50%)',
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '20px',
            fontFamily: 'Gotham Pro',
            textAlign: 'center',
            zIndex: 10,
          }}>
            Статьи не найдены
          </div>
        )}

        {/* СКРОЛЛ КОНТЕЙНЕР ТОЛЬКО ЕСЛИ >4 */}
        {!loading && !error && articles.length > 4 ? (
          <div style={{
            position: 'absolute',
            left: 0,
            top: '550px',
            width: '1180px',
            height: '1450px',
            overflowY: 'auto',
            overflowX: 'hidden',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 20px, black calc(100% - 30px), transparent 100%)',
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 20px, black calc(100% - 30px), transparent 100%)',
            zIndex: 2,
          }}>
            <div style={{
              position: 'relative',
              width: '1180px',
              minHeight: `${articles.length * 380}px`,
            }}>
              {articles.map((article, index) => renderArticleCard(article, index, true))}
            </div>
          </div>
        ) : (
          !loading && !error && articles.map((article, index) => renderArticleCard(article, index, false))
        )}

        {/* Card 1 - Академия (53:685) - FALLBACK если нет данных */}
        {!loading && !error && articles.length === 0 && (
        <div style={{ display: 'none' }}>
        {/* Card 1 - Академия (53:685) - x=141, y=577, 894x249 */}
        <div style={{
          position: 'absolute',
          left: '141px',
          top: '577px',
          width: '894px',
          height: '249px',
          zIndex: 2,
        }}>
          {/* Background image (53:686) - x=0, y=5, 449x241 */}
          <img 
            src={bgAcademy}
            alt=""
            style={{
              position: 'absolute',
              left: 0,
              top: '5px',
              width: '449px',
              height: '241px',
              borderRadius: '30px',
              objectFit: 'cover',
            }}
          />
          {/* New badge (411:766) - x=336, y=19, 101x36 */}
          <div className="blur-wave button-inner-glow" style={{
            position: 'absolute',
            left: '336px',
            top: '19px',
            width: '101px',
            height: '36px',
            backdropFilter: 'blur(50px)',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '62px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{
              fontFamily: 'Gotham Pro',
              fontWeight: 500,
              fontSize: '20px',
              color: 'white',
              lineHeight: 0,
            }}>
              новое
            </div>
          </div>
          {/* Black text block (53:694) - x=449, y=0, 445x249 */}
          <div className="blur-wave" style={{
            position: 'absolute',
            left: '449px',
            top: 0,
            width: '445px',
            height: '249px',
            backdropFilter: 'blur(50px)',
            background: 'black',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '30px',
          }}>
            {/* Text (53:773) - x=27, y=30, 390x189 */}
            <div style={{
              position: 'absolute',
              left: '27px',
              top: '30px',
              width: '390px',
              height: '189px',
              fontFamily: 'Gotham Pro',
              fontWeight: 300,
              fontSize: '27px',
              lineHeight: 0,
              color: 'white',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}>
              <p style={{ margin: 0, lineHeight: 'normal' }}>Курс «Система» — про то, как выстраивать процессы, а не тушить пожары. Ты собираешь понятную логику: цель → действия → результат, без хаоса и лишних шагов. На выходе</p>
            </div>
          </div>
          {/* Read button (53:711) - x=101, y=86, 247x80 */}
          <img 
            src={readButton}
            alt="читать"
            onClick={() => navigate('/article')}
            className="button-inner-glow"
            style={{
              position: 'absolute',
              left: '101px',
              top: '86px',
              width: '247px',
              height: '80px',
              cursor: 'pointer',
              objectFit: 'contain',
              zIndex: 10,
            }}
          />
        </div>

        {/* Card 2 - Лаба (53:744) - x=141, y=890, 894x250 */}
        <div style={{
          position: 'absolute',
          left: '141px',
          top: '890px',
          width: '894px',
          height: '250px',
          zIndex: 2,
        }}>
          {/* Background image (53:749) - x=0, y=0, 449x249 */}
          <img 
            src={bgLaba}
            alt=""
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '449px',
              height: '249px',
              borderRadius: '30px',
              objectFit: 'cover',
            }}
          />
          {/* Black text block (53:745) - x=449, y=1, 445x249 */}
          <div className="blur-wave" style={{
            position: 'absolute',
            left: '449px',
            top: '1px',
            width: '445px',
            height: '249px',
            backdropFilter: 'blur(50px)',
            background: 'black',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '30px',
          }}>
            {/* Text (53:771) - x=27, y=30, 390x189 */}
            <div style={{
              position: 'absolute',
              left: '27px',
              top: '30px',
              width: '390px',
              height: '189px',
              fontFamily: 'Gotham Pro',
              fontWeight: 300,
              fontSize: '27px',
              lineHeight: 0,
              color: 'white',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}>
              <p style={{ margin: 0, lineHeight: 'normal' }}>Курс «Система» — про то, как выстраивать процессы, а не тушить пожары. Ты собираешь понятную логику: цель → действия → результат, без хаоса и лишних шагов. На выходе</p>
            </div>
          </div>
          {/* Read button (53:725) - x=102, y=85, 247x80 */}
          <img 
            src={readButton}
            alt="читать"
            onClick={() => navigate('/article')}
            className="button-inner-glow"
            style={{
              position: 'absolute',
              left: '102px',
              top: '85px',
              width: '247px',
              height: '80px',
              cursor: 'pointer',
              objectFit: 'contain',
              zIndex: 10,
            }}
          />
        </div>

        {/* Card 3 - Цех (53:701) - x=141, y=1205, 894x249 */}
        <div style={{
          position: 'absolute',
          left: '141px',
          top: '1205px',
          width: '894px',
          height: '249px',
          zIndex: 2,
        }}>
          {/* Background image (53:702) - x=0, y=0, 450x249 */}
          <img 
            src={bgWorkshop}
            alt=""
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '450px',
              height: '249px',
              borderRadius: '30px',
              objectFit: 'cover',
            }}
          />
          {/* Black text block (53:703) - x=450, y=0, 444x249 */}
          <div className="blur-wave" style={{
            position: 'absolute',
            left: '450px',
            top: 0,
            width: '444px',
            height: '249px',
            backdropFilter: 'blur(50px)',
            background: 'black',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '30px',
          }}>
            {/* Text (53:704) - x=27, y=30, 390x189 */}
            <div style={{
              position: 'absolute',
              left: '27px',
              top: '30px',
              width: '390px',
              height: '189px',
              fontFamily: 'Gotham Pro',
              fontWeight: 300,
              fontSize: '27px',
              lineHeight: 0,
              color: 'white',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}>
              <p style={{ margin: 0, lineHeight: 'normal' }}>Курс «Система» — про то, как выстраивать процессы, а не тушить пожары. Ты собираешь понятную логику: цель → действия → результат, без хаоса и лишних шагов. На выходе</p>
            </div>
          </div>
          {/* Read button (53:718) - x=102, y=85, 247x80 */}
          <img 
            src={readButton}
            alt="читать"
            onClick={() => navigate('/article')}
            className="button-inner-glow"
            style={{
              position: 'absolute',
              left: '102px',
              top: '85px',
              width: '247px',
              height: '80px',
              cursor: 'pointer',
              objectFit: 'contain',
              zIndex: 10,
            }}
          />
        </div>

        {/* Card 4 - Полигон (53:761) - x=141, y=1519, 894x249 */}
        <div style={{
          position: 'absolute',
          left: '141px',
          top: '1519px',
          width: '894px',
          height: '249px',
          zIndex: 2,
        }}>
          {/* Background image (53:764) - x=0, y=0, 447x249 */}
          <img 
            src={bgPoligon}
            alt=""
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '447px',
              height: '249px',
              borderRadius: '30px',
              objectFit: 'cover',
            }}
          />
          {/* Black text block (53:762) - x=447, y=0, 447x249 */}
          <div className="blur-wave" style={{
            position: 'absolute',
            left: '447px',
            top: 0,
            width: '447px',
            height: '249px',
            backdropFilter: 'blur(50px)',
            background: 'black',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '30px',
          }}>
            {/* Text (53:775) - x=27, y=30, 390x189 */}
            <div style={{
              position: 'absolute',
              left: '27px',
              top: '30px',
              width: '390px',
              height: '189px',
              fontFamily: 'Gotham Pro',
              fontWeight: 300,
              fontSize: '27px',
              lineHeight: 0,
              color: 'white',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}>
              <p style={{ margin: 0, lineHeight: 'normal' }}>Курс «Система» — про то, как выстраивать процессы, а не тушить пожары. Ты собираешь понятную логику: цель → действия → результат, без хаоса и лишних шагов. На выходе</p>
            </div>
          </div>
          {/* Read button (53:732) - x=241, y=1604 - ABSOLUTE TO SCREEN */}
          <img 
            src={readButton}
            alt="читать"
            onClick={() => navigate('/article')}
            className="button-inner-glow"
            style={{
              position: 'absolute',
              left: '100px',
              top: '85px',
              width: '247px',
              height: '80px',
              cursor: 'pointer',
              objectFit: 'contain',
              zIndex: 10,
            }}
          />
        </div>
        </div>
        )}

        {/* Footer */}
        <div style={{
          position: 'absolute',
          left: '141px',
          top: '2071px',
          width: '888px',
          height: '124px',
          zIndex: 10,
        }}>
          <div style={{
            position: 'absolute',
            width: '380px',
            height: '83px',
            left: '2px',
            top: '-16px',
          }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              overflow: 'hidden',
              pointerEvents: 'none',
            }}>
              <img 
                src={logoFooter}
                alt="МЕТАФЛОРА*"
                style={{
                  position: 'absolute',
                  height: '526.54%',
                  left: '-37.89%',
                  top: '-202.47%',
                  width: '170.37%',
                  maxWidth: 'none',
                }}
              />
            </div>
          </div>
          
          <div style={{
            position: 'absolute',
            left: '2px',
            top: '56px',
            width: '433px',
            fontFamily: 'Gotham Pro',
            fontWeight: 300,
            fontSize: '20px',
            color: 'white',
          }}>
            <p style={{ margin: 0, lineHeight: 'normal' }}>
              Copyright © Все права защищены.
            </p>
          </div>
          
          <div className="blur-wave" style={{
            position: 'absolute',
            left: '664px',
            top: '-2px',
            backdropFilter: 'blur(50px)',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '62px',
            height: '78px',
            width: '230px',
          }} />
          
          <div style={{
            position: 'absolute',
            left: '681px',
            top: '13px',
            width: '196px',
            height: '51px',
          }}>
            <div style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '50px',
              height: '51px',
            }}>
              <div style={{
                position: 'absolute',
                inset: 0,
                opacity: 0.6,
                overflow: 'hidden',
                pointerEvents: 'none',
              }}>
                <img 
                  src={socialsIcons}
                  alt="Telegram"
                  style={{
                    position: 'absolute',
                    height: '339.84%',
                    left: '-377.92%',
                    top: '-118.33%',
                    width: '517.92%',
                    maxWidth: 'none',
                  }}
                />
              </div>
            </div>
            
            <div style={{
              position: 'absolute',
              left: '54px',
              top: 0,
              width: '142px',
              height: '51px',
            }}>
              <div style={{
                position: 'absolute',
                inset: 0,
                opacity: 0.6,
                overflow: 'hidden',
                pointerEvents: 'none',
              }}>
                <img 
                  src={socialsIcons}
                  alt="Соцсети"
                  style={{
                    position: 'absolute',
                    height: '339.84%',
                    left: '-16.64%',
                    top: '-118.33%',
                    width: '183.64%',
                    maxWidth: 'none',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoligonArticlesAllScreen;
