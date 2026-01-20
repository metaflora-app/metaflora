import React from 'react';
import { useNavigate } from 'react-router-dom';

// Local PNG assets
import smallLogo from '../../assets/figma-welcome/logo-small.png';
import searchIconPNG from '../../assets/иконка поиск.png';
import supportButtonPNG from '../../assets/tour-video/support-button.png';
import exitArrow from '../../assets/tour-video/exit-arrow.png';
import homeIcon from '../../assets/about-screens/домой.png';
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
import newButtonInactive from '../../assets/кнопка новые.png';
import newButtonActive from '../../assets/кнопка новые активная.png';

// Figma MCP assets
const threePeopleBg = "https://www.figma.com/api/mcp/asset/1f6ef230-2b81-4e04-8d67-9a5cf1485327";
const houseImage = "https://www.figma.com/api/mcp/asset/561dab05-4ef7-4239-862d-adee28216da3";


export const PromptFirstScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = React.useState('');
  const [selectedFilters, setSelectedFilters] = React.useState<string[]>([]);
  const [likedCards, setLikedCards] = React.useState<number[]>([]);
  const [isSearchFocused, setIsSearchFocused] = React.useState(false);

  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;

  const toggleFilter = (filter: string) => {
    if (filter === 'вернуть') {
      setSelectedFilters([]);
    } else {
      setSelectedFilters(prev => 
        prev.includes(filter) 
          ? prev.filter(f => f !== filter)
          : [...prev, filter]
      );
    }
  };

  const toggleLike = (cardId: number) => {
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

  // Массив всех карточек
  const allCards = [1, 2, 3, 4];
  
  // Фильтруем карточки по избранному
  const visibleCards = showOnlyFavorites 
    ? allCards.filter(cardId => likedCards.includes(cardId))
    : allCards;

  // Позиции карточек в сетке (2x2)
  const getCardPosition = (index: number) => {
    const row = Math.floor(index / 2);
    const col = index % 2;
    return {
      left: col === 0 ? '26px' : '448px',
      top: `${27 + row * 812}px`,
    };
  };

  // Рендер одной карточки
  const renderCard = (cardId: number, index: number) => {
    const position = getCardPosition(index);
    const isFirstCard = cardId === 1;

    return (
      <div key={cardId} style={{
        position: 'absolute',
        ...position,
        width: '410px',
        height: '782px',
      }}>
        {/* Черный фон */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backdropFilter: 'blur(50px)',
          background: '#000',
          border: '4px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '30px',
        }} />

        {/* Фото дома */}
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
            src={houseImage}
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

        {/* Сердечко (лайк) */}
        <img 
          src={likedCards.includes(cardId) ? likeIcon : likeEmptyIcon}
          alt="лайк"
          onClick={() => toggleLike(cardId)}
          style={{
            position: 'absolute',
            left: '42px',
            top: '44px',
            width: '36px',
            height: '36px',
            cursor: 'pointer',
          }}
        />

        {/* Плашка "новое" - только на первой карточке */}
        {isFirstCard && (
          <div style={{
            position: 'absolute',
            right: '41px',
            top: '44px',
            width: '101px',
            height: '36px',
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
              width: '111px',
              fontFamily: 'Gotham Pro',
              fontWeight: 500,
              fontSize: '20px',
              color: 'white',
              textAlign: 'center',
              lineHeight: 0,
            }}>
              <p style={{ lineHeight: 'normal', whiteSpace: 'pre-wrap', margin: 0 }}>новые</p>
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
          <p style={{ lineHeight: 'normal', whiteSpace: 'pre-wrap', margin: 0 }}>ИИ-копирайтер для блога</p>
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
          <p style={{ lineHeight: 'normal', whiteSpace: 'pre-wrap', margin: 0 }}>настройте ИИ-копирайтера за один промпт</p>
        </div>

        {/* Кнопка "перейти" */}
        <img 
          src={openButton}
          alt="перейти"
          onClick={() => navigate('/prompt-card')}
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
      {/* Background pattern */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `url(${bgPattern})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'repeat',
      }} />

      <div style={{
        position: 'relative',
        width: '1180px',
        minHeight: '2550px',
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
      }}>
        {/* Кнопка "выход" (стрелка назад) */}
        <img 
          src={exitArrow}
          alt="назад"
          onClick={() => navigate(-1)}
          style={{
            position: 'absolute',
            left: 'calc(50% - 452px)',
            top: '75px',
            width: '100px',
            height: '100px',
            cursor: 'pointer',
          }}
        />

        {/* Иконка "домой" */}
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

        {/* Header - Logo */}
        <div style={{
          position: 'absolute',
          height: '131px',
          left: '500px',
          top: '61px',
          width: '186px',
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
        <div style={{
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
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            placeholder={isSearchFocused ? '' : 'промпт для ИИ-копирайтера любых текстов'}
            style={{
              fontFamily: 'Gotham Pro, sans-serif',
              fontWeight: 300,
              color: '#848484',
              fontSize: '27px',
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

        {/* Filter: новые */}
        <img
          src={isFilterActive('новые') ? newButtonActive : newButtonInactive}
          alt="новые"
          onClick={() => toggleFilter('новые')}
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
        <div style={{
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
          {visibleCards.map((cardId, index) => renderCard(cardId, index))}
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
          <div style={{
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