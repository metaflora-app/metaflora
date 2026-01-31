import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWorkshopPromptsWithCache } from '../../utils/contentApi';
import type { WorkshopPrompt } from '../../types/content';

// Local PNG assets
import smallLogo from '../../assets/figma-welcome/logo-small.png';
import searchIconPNG from '../../assets/иконка поиск.png';
import supportButtonPNG from '../../assets/tour-video/support-button.png';
import logoFooter from '../../assets/figma-welcome/logo-footer.png';
import socialsIconsFooter from '../../assets/welcome-elements/socials-icons.png';
import bgPattern from '../../assets/figma-welcome/pattern.png';
import openButton from '../../assets/кнопка перейти.png';
import likeIcon from '../../assets/лайк.png';
import likeEmptyIcon from '../../assets/лайк не поставлен.png';
import returnButton from '../../assets/кнопка вернуть не активная.png';
import favoriteButtonInactive from '../../assets/кнопка избранное.png';
import favoriteButtonActive from '../../assets/кнопка избранное активная.png';
import recentButtonInactive from '../../assets/кнопка недавние.png';
import recentButtonActive from '../../assets/кнопка недавние активная.png';
import topPickButtonInactive from '../../assets/кнопка топ-выбор.png';
import topPickButtonActive from '../../assets/кнопка топ-выбор активная.png';
import newButtonInactive from '../../assets/кнопка новое неактивная.png';
import newButtonActive from '../../assets/кнопка новое активная.png';

// New assets
import threePeopleBg from '../../assets/laba-icons/три человека на фон.png';
import houseImage from '../../assets/laba-icons/картинка в карточке промпта.png';


export const PromptFirstScreen: React.FC = () => {
  const navigate = useNavigate();
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const [searchValue, setSearchValue] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [likedCards, setLikedCards] = useState<string[]>(() => {
    // Загружаем лайки из localStorage
    try {
      const saved = localStorage.getItem('metaflora_liked_prompts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  // Новые состояния для загрузки из Supabase
  const [prompts, setPrompts] = useState<WorkshopPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;

  // Сохраняем лайки в localStorage при изменении
  useEffect(() => {
    localStorage.setItem('metaflora_liked_prompts', JSON.stringify(likedCards));
  }, [likedCards]);

  // Загрузка промптов из Supabase
  useEffect(() => {
    loadPrompts();
  }, [selectedFilters]);

  // ПРИНУДИТЕЛЬНАЯ ОЧИСТКА ВСЕГО КЕША ПРОМПТОВ ПРИ ЗАГРУЗКЕ
  useEffect(() => {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.includes('workshop_prompts') || key.includes('metaflora_content')) {
        localStorage.removeItem(key);
        console.log('Удален кеш:', key);
      }
    });
  }, []);

  const loadPrompts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Загружаем ВСЕ активные промпты (фильтрация на фронте)
      const result = await getWorkshopPromptsWithCache({
        isActive: true,
        limit: 100,
        offset: 0,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      // Фильтруем на фронте
      let filtered = result.data;

      // Фильтр "недавние"
      if (selectedFilters.includes('недавние')) {
        const recentIds = JSON.parse(localStorage.getItem('metaflora_recent_prompts') || '[]');
        filtered = filtered.filter(p => recentIds.includes(p.id));
      }
      // Остальные фильтры (новое, топ-выбор)
      else {
        const activeTagFilters = selectedFilters.filter(f => 
          !['избранное', 'вернуть', 'недавние'].includes(f)
        );
        
        if (activeTagFilters.length > 0) {
          filtered = filtered.filter(p => 
            p.filter_tags?.some(tag => activeTagFilters.includes(tag))
          );
        }
      }

      setPrompts(filtered);
    } catch (err) {
      console.error('Error loading prompts:', err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const toggleFilter = (filter: string) => {
    if (filter === 'вернуть') {
      setSelectedFilters([]);
    } else if (filter === 'избранное') {
      // Избранное - тоггл
      setSelectedFilters(prev => 
        prev.includes(filter) ? [] : [filter]
      );
    } else {
      // Остальные фильтры - только один активный
      setSelectedFilters(prev => 
        prev.includes(filter) ? [] : [filter]
      );
    }
  };

  const toggleLike = (cardId: string) => {
    setLikedCards(prev =>
      prev.includes(cardId)
        ? prev.filter(id => id !== cardId)
        : [...prev, cardId]
    );
  };

  const isFilterActive = (filter: string) => {
    return selectedFilters.includes(filter);
  };

  const showOnlyFavorites = selectedFilters.includes('избранное');

  // Фильтруем промпты по избранному и поиску
  let visiblePrompts = showOnlyFavorites 
    ? prompts.filter(prompt => likedCards.includes(prompt.id))
    : prompts;

  // Фильтрация по поисковой строке (без алерта)
  if (searchValue.trim()) {
    const searchWords = searchValue.toLowerCase().trim().split(/\s+/);
    visiblePrompts = visiblePrompts.filter(prompt => {
      const searchableText = [
        prompt.title,
        prompt.description || '',
        prompt.prompt_text || '',
        ...(prompt.search_keywords || [])
      ].join(' ').toLowerCase();

      return searchWords.every(word => searchableText.includes(word));
    });
  }

  // Позиции карточек в сетке (2x2)
  const getCardPosition = (index: number) => {
    const row = Math.floor(index / 2);
    const col = index % 2;
    return {
      left: col === 0 ? '26px' : '448px',
      top: `${27 + row * 812}px`,
    };
  };

  // Рендер одной карточки с данными из Supabase
  const renderCard = (prompt: WorkshopPrompt, index: number) => {
    const position = getCardPosition(index);
    const filterTag = prompt.filter_tags?.[0];

    return (
      <div key={prompt.id} style={{
        position: 'absolute',
        ...position,
        width: '410px',
        height: '782px',
      }}>
        {/* Черный фон */}
        <div className="blur-wave" style={{
          position: 'absolute',
          inset: 0,
          backdropFilter: 'blur(50px)',
          background: '#000',
          border: '4px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '30px',
        }} />

        {/* Обложка промпта */}
        <div style={{
          position: 'absolute',
          top: '3.45%',
          right: '6.59%',
          bottom: '50.64%',
          left: '6.59%',
          border: '2px solid rgba(0, 0, 0, 0.3)',
          borderRadius: '25px',
        }}>
          <img 
            src={prompt.cover_image_url || houseImage}
            alt={prompt.title}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src !== houseImage) {
                target.src = houseImage;
              }
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

        {/* Сердечко (лайк) */}
        <img 
          src={likedCards.includes(prompt.id) ? likeIcon : likeEmptyIcon}
          alt="лайк"
          onClick={() => toggleLike(prompt.id)}
          style={{
            position: 'absolute',
            left: '42px',
            top: '44px',
            width: '36px',
            height: '36px',
            cursor: 'pointer',
          }}
        />

        {/* Плашка с фильтром - только для "новое" (проверяем и "новые" для обратной совместимости) */}
        {(filterTag === 'новое' || filterTag === 'новые') && (
          <div className="blur-wave button-inner-glow" style={{
            position: 'absolute',
            right: '41px',
            top: '44px',
            minWidth: '101px',
            height: '36px',
            paddingLeft: '15px',
            paddingRight: '15px',
            backdropFilter: 'blur(50px)',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '62px',
            overflow: 'clip',
          }}>
            <div style={{
              position: 'absolute',
              left: '50%',
              top: 'calc(50% - 0.5px)',
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              height: '19px',
              fontFamily: 'Gotham Pro',
              fontWeight: 500,
              fontSize: '20px',
              color: 'white',
              textAlign: 'center',
              lineHeight: 0,
              whiteSpace: 'nowrap',
            }}>
              <p style={{ lineHeight: 'normal', whiteSpace: 'nowrap', margin: 0 }}>новое</p>
            </div>
          </div>
        )}

        {/* Заголовок */}
        <div style={{
          position: 'absolute',
          top: '54.48%',
          right: '10%',
          bottom: '38.11%',
          left: '9.76%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          fontFamily: 'Gotham Pro, sans-serif',
          fontWeight: 700,
          fontSize: '40px',
          color: 'white',
          lineHeight: 0,
        }}>
          <p style={{ lineHeight: 'normal', whiteSpace: 'pre-wrap', margin: 0 }}>{prompt.title}</p>
        </div>

        {/* Описание */}
        <div style={{
          position: 'absolute',
          top: '64.58%',
          right: '10%',
          bottom: '23.27%',
          left: '9.76%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          fontFamily: 'Gotham Pro, sans-serif',
          fontWeight: 300,
          fontSize: '32px',
          color: 'white',
          lineHeight: 0,
        }}>
          <p style={{ lineHeight: 'normal', whiteSpace: 'pre-wrap', margin: 0 }}>{prompt.description || ''}</p>
        </div>

        {/* Кнопка "перейти" */}
        <img 
          src={openButton}
          alt="перейти"
          onClick={() => navigate(`/prompt-card/${prompt.id}`)}
          className="button-inner-glow"
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            bottom: '63px',
            width: '247px',
            height: '80px',
            cursor: 'pointer',
            objectFit: 'contain',
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
      {/* Background pattern - full screen */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${bgPattern})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'repeat',
        }}
      />

      <div style={{
        position: 'relative',
        width: '1180px',
        minHeight: '2550px',
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
      }}>        {/* Header - Logo */}
        <div 
          onClick={() => navigate('/main-dashboard-premium')}
          style={{
            position: 'absolute',
            height: '131px',
            left: '500px',
            top: '61px',
            width: '186px',
            cursor: 'pointer',
          }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            pointerEvents: 'none',
          }}>
            <img 
              src={smallLogo}
              alt="МЕТАФЛОРА*"
              style={{
                position: 'absolute',
                height: '131.84%',
                left: '-21.84%',
                maxWidth: 'none',
                top: '-16.38%',
                width: '143.34%',
              }}
            />
          </div>
        </div>

        {/* Кнопка "написать в поддержку" */}
        <img 
          src={supportButtonPNG}
          alt="написать в поддержку"
          style={{
            position: 'absolute',
            left: '829px',
            top: '97px',
            width: '205px',
            height: '78px',
            cursor: 'pointer',
          }}
        />

        {/* Hero Image */}
        <div style={{
          position: 'absolute',
          border: '4px solid rgba(255, 255, 255, 0.3)',
          height: '377px',
          left: '155px',
          borderRadius: '30px',
          top: '224px',
          width: '880px',
        }}>
          <img 
            src={houseImage}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '30px',
            }}
          />
        </div>

        {/* Search bar */}
        <div className="blur-wave" style={{
          position: 'absolute',
          backdropFilter: 'blur(50px)',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          height: '72px',
          left: 'calc(50% + 3px)',
          borderRadius: '62px',
          top: '631px',
          transform: 'translateX(-50%)',
          width: '876px',
          display: 'flex',
          alignItems: 'center',
          paddingLeft: '30px',
        }}>
          <img 
            src={searchIconPNG}
            alt=""
            style={{
              width: '24px',
              height: '24px',
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
                // Показываем алерт если ничего не найдено
                if (visiblePrompts.length === 0 && prompts.length > 0) {
                  const telegram = (window as any).Telegram;
                  if (telegram?.WebApp?.showPopup) {
                    telegram.WebApp.showPopup({
                      message: 'промпт не найден. проверьте корректность написания'
                    });
                  }
                  // Очищаем поисковую строку
                  setSearchValue('');
                }
              }
            }}
            placeholder={isSearchFocused ? '' : 'промпт для ИИ-копирайтера любых текстов'}
            enterKeyHint="search"
            style={{
              fontFamily: 'Gotham Pro, sans-serif',
              fontWeight: 300,
              color: '#848484',
              fontSize: '32px',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              width: '100%',
            }}
          />
        </div>

        {/* Filter: вернуть */}
        <img
          src={returnButton}
          alt="вернуть"
          onClick={() => toggleFilter('вернуть')}
          style={{
            position: 'absolute',
            left: '220px',
            top: '733px',
            width: '247px',
            height: '80px',
            cursor: 'pointer',
            objectFit: 'contain',
          }}
        />

        {/* Filter: избранное */}
        <img
          src={isFilterActive('избранное') ? favoriteButtonActive : favoriteButtonInactive}
          alt="избранное"
          onClick={() => toggleFilter('избранное')}
          className="button-inner-glow"
          style={{
            position: 'absolute',
            left: '467px',
            top: '733px',
            width: '247px',
            height: '80px',
            cursor: 'pointer',
            objectFit: 'contain',
          }}
        />

        {/* Filter: недавние */}
        <img
          src={isFilterActive('недавние') ? recentButtonActive : recentButtonInactive}
          alt="недавние"
          onClick={() => toggleFilter('недавние')}
          className="button-inner-glow"
          style={{
            position: 'absolute',
            left: '714px',
            top: '733px',
            width: '247px',
            height: '80px',
            cursor: 'pointer',
            objectFit: 'contain',
          }}
        />

        {/* Filter: топ-выбор */}
        <img
          src={isFilterActive('топ-выбор') ? topPickButtonActive : topPickButtonInactive}
          alt="топ-выбор"
          onClick={() => toggleFilter('топ-выбор')}
          className="button-inner-glow"
          style={{
            position: 'absolute',
            left: '343px',
            top: '812px',
            width: '247px',
            height: '80px',
            cursor: 'pointer',
            objectFit: 'contain',
          }}
        />

        {/* Filter: новое */}
        <img
          src={isFilterActive('новое') ? newButtonActive : newButtonInactive}
          alt="новое"
          onClick={() => toggleFilter('новое')}
          className="button-inner-glow"
          style={{
            position: 'absolute',
            left: '590px',
            top: '812px',
            width: '247px',
            height: '80px',
            cursor: 'pointer',
            objectFit: 'contain',
          }}
        />

        {/* Empty Cards window - exact Figma coordinates */}
        <div className="blur-wave" style={{
          position: 'absolute',
          backdropFilter: 'blur(50px)',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '4px solid rgba(255, 255, 255, 0.3)',
          height: '1121px',
          left: 'calc(50% + 3px)',
          borderRadius: '30px',
          top: '921px',
          transform: 'translateX(-50%)',
          width: '884px',
          overflow: 'auto',
          zIndex: 10,
          padding: '22px',
        }}>
          {/* Рендерим отфильтрованные карточки */}

          {/* Error state */}
          {error && !loading && (
            <div style={{
              position: 'absolute',
              left: '50%',
              top: '400px',
              transform: 'translateX(-50%)',
              color: '#ff4444',
              fontSize: '20px',
              fontFamily: 'Gotham Pro',
              textAlign: 'center',
              maxWidth: '600px',
            }}>
              Ошибка загрузки: {error}
            </div>
          )}

          {/* Empty state - только для избранного */}
          {!loading && !error && visiblePrompts.length === 0 && showOnlyFavorites && (
            <div style={{
              position: 'absolute',
              left: '50%',
              top: '400px',
              transform: 'translateX(-50%)',
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '20px',
              fontFamily: 'Gotham Pro',
              textAlign: 'center',
            }}>
              Нет избранных промптов
            </div>
          )}

          {/* Render prompts */}
          {!loading && !error && visiblePrompts.map((prompt, index) => renderCard(prompt, index))}
        </div>

        {/* Три человека на фоне ПОД блюр-фреймом */}
        <div style={{
          position: 'absolute',
          height: '474px',
          left: '147px',
          top: '1450px',
          width: '886px',
          zIndex: 0,
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            pointerEvents: 'none',
          }}>
            <img 
              src={threePeopleBg}
              alt=""
              style={{
                position: 'absolute',
                height: '222.88%',
                left: '-39.72%',
                maxWidth: 'none',
                top: '-55.58%',
                width: '179.18%',
              }}
            />
          </div>
        </div>

        {/* Футер - ТОЧНАЯ КОПИЯ из about-prompt */}
        <div style={{
          position: 'absolute',
          left: 'calc(50% - 5px)',
          top: '2071px',
          transform: 'translateX(-50%)',
          width: '888px',
          height: '124px',
        }}>
          {/* Логотип в подвале */}
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
          
          {/* Copyright текст */}
          <div style={{
            position: 'absolute',
            left: '2px',
            top: '56px',
            width: '433px',
            height: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            fontFamily: 'Gotham Pro',
            fontWeight: 300,
            fontSize: '20px',
            lineHeight: '0',
            color: 'white',
          }}>
            <p style={{ 
              margin: 0,
              lineHeight: 'normal',
              whiteSpace: 'pre-wrap',
            }}>
              Copyright © Все права защищены.
            </p>
          </div>
          
          {/* Подложка под соцсети */}
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
          
          {/* Иконки соцсетей */}
          <div style={{
            position: 'absolute',
            left: '681px',
            top: '13px',
            width: '196px',
            height: '51px',
          }}>
            {/* Первая иконка */}
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
                  src={socialsIconsFooter}
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
            
            {/* Группа иконок */}
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
                  src={socialsIconsFooter}
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