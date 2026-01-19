import React from 'react';
import { useNavigate } from 'react-router-dom';

// Local PNG assets
import smallLogo from '../../assets/figma-welcome/logo-small.png';
import returnButton from '../../assets/кнопка вернуть.png';
import searchIconPNG from '../../assets/иконка поиск.png';
import supportButtonPNG from '../../assets/tour-video/support-button.png';
import exitArrow from '../../assets/tour-video/exit-arrow.png';
import homeIcon from '../../assets/about-screens/домой.png';
import logoFooter from '../../assets/figma-welcome/logo-footer.png';
import socialsIconsFooter from '../../assets/welcome-elements/socials-icons.png';
import favoriteButton from '../../assets/кнопка избранное.png';
import recentButton from '../../assets/кнопка недавние.png';
import topPickButton from '../../assets/кнопка топ-выбор.png';
import newButton from '../../assets/кнопка новые.png';
import bgPattern from '../../assets/figma-welcome/pattern.png';
import openButton from '../../assets/кнопка открыть цех.png';
import newBadge from '../../assets/новое в академии.png';
import likeIcon from '../../assets/лайк.png';
import likeEmptyIcon from '../../assets/лайк не поставлен.png';

// Figma MCP assets
const threePeopleBg = "https://www.figma.com/api/mcp/asset/1f6ef230-2b81-4e04-8d67-9a5cf1485327";
const houseImage = "https://www.figma.com/api/mcp/asset/561dab05-4ef7-4239-862d-adee28216da3";
const heartIcon = "https://www.figma.com/api/mcp/asset/8e6e8e5e-eec6-4e7c-bbbd-f7a5c6a56c4c";


export const PromptFirstScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = React.useState('');
  const [selectedFilters, setSelectedFilters] = React.useState<string[]>([]);
  const [likedCards, setLikedCards] = React.useState<number[]>([]);

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
    return filter === 'вернуть' ? selectedFilters.length === 0 : selectedFilters.includes(filter);
  };

  const showOnlyFavorites = selectedFilters.includes('избранное');

  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      minHeight: '100vh',
      background: '#020101',
      backgroundImage: `url(${bgPattern})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'repeat',
      overflow: 'hidden',
    }}>
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
            placeholder="промпт для ИИ-копирайтера любых текстов"
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
        <div
          onClick={() => toggleFilter('вернуть')}
          style={{
            position: 'absolute',
            left: '220px',
            top: '733px',
            width: '247px',
            height: '79px',
            backdropFilter: 'blur(50px)',
            background: isFilterActive('вернуть') ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '62px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Gotham Pro',
            fontWeight: 500,
            fontSize: '27px',
            color: 'white',
            cursor: 'pointer',
          }}
        >
          вернуть
        </div>

        {/* Filter: избранное */}
        <div
          onClick={() => toggleFilter('избранное')}
          style={{
            position: 'absolute',
            left: '467px',
            top: '733px',
            width: '247px',
            height: '79px',
            backdropFilter: 'blur(50px)',
            background: isFilterActive('избранное') ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '62px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Gotham Pro',
            fontWeight: 500,
            fontSize: '27px',
            color: 'white',
            cursor: 'pointer',
          }}
        >
          избранное
        </div>

        {/* Filter: недавние */}
        <div
          onClick={() => toggleFilter('недавние')}
          style={{
            position: 'absolute',
            left: '714px',
            top: '733px',
            width: '247px',
            height: '79px',
            backdropFilter: 'blur(50px)',
            background: isFilterActive('недавние') ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '62px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Gotham Pro',
            fontWeight: 500,
            fontSize: '27px',
            color: 'white',
            cursor: 'pointer',
          }}
        >
          недавние
        </div>

        {/* Filter: топ-выбор */}
        <div
          onClick={() => toggleFilter('топ-выбор')}
          style={{
            position: 'absolute',
            left: '343px',
            top: '812px',
            width: '247px',
            height: '79px',
            backdropFilter: 'blur(50px)',
            background: isFilterActive('топ-выбор') ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '62px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Gotham Pro',
            fontWeight: 500,
            fontSize: '27px',
            color: 'white',
            cursor: 'pointer',
          }}
        >
          топ-выбор
        </div>

        {/* Filter: новые */}
        <div
          onClick={() => toggleFilter('новые')}
          style={{
            position: 'absolute',
            left: '590px',
            top: '812px',
            width: '247px',
            height: '79px',
            backdropFilter: 'blur(50px)',
            background: isFilterActive('новые') ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '62px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Gotham Pro',
            fontWeight: 500,
            fontSize: '27px',
            color: 'white',
            cursor: 'pointer',
          }}
        >
          новые
        </div>

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
          {/* Карточка 1 - Верхняя ЛЕВАЯ */}
          {(!showOnlyFavorites || likedCards.includes(1)) && (
          <div style={{
            position: 'absolute',
            top: '22px',
            left: '22px',
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
              src={likedCards.includes(1) ? likeIcon : likeEmptyIcon}
              alt="лайк"
              onClick={() => toggleLike(1)}
              style={{
                position: 'absolute',
                left: '42px',
                top: '44px',
                width: '36px',
                height: '36px',
                cursor: 'pointer',
              }}
            />

            {/* Плашка "новое" */}
            <img 
              src={newBadge}
              alt="новое"
              style={{
                position: 'absolute',
                left: '294px',
                top: '71px',
                width: '135px',
                height: '36px',
                objectFit: 'contain',
              }}
            />

            {/* Заголовок - БЕЗ <br/>, текст сам переносится */}
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
                bottom: '31px',
                width: '257px',
                height: '73px',
                cursor: 'pointer',
              }}
            />
          </div>
          )}

          {/* Карточка 2 - Верхняя ПРАВАЯ */}
          {(!showOnlyFavorites || likedCards.includes(2)) && (
          <div style={{
            position: 'absolute',
            top: '22px',
            right: '22px',
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
              src={likedCards.includes(2) ? likeIcon : likeEmptyIcon}
              alt="лайк"
              onClick={() => toggleLike(2)}
              style={{
                position: 'absolute',
                left: '42px',
                top: '44px',
                width: '36px',
                height: '36px',
                cursor: 'pointer',
              }}
            />

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
                bottom: '31px',
                width: '257px',
                height: '73px',
                cursor: 'pointer',
              }}
            />
          </div>
          )}

          {/* Карточка 3 - Нижняя ЛЕВАЯ */}
          {(!showOnlyFavorites || likedCards.includes(3)) && (
          <div style={{
            position: 'absolute',
            top: '834px',
            left: '22px',
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
              src={likedCards.includes(3) ? likeIcon : likeEmptyIcon}
              alt="лайк"
              onClick={() => toggleLike(3)}
              style={{
                position: 'absolute',
                left: '42px',
                top: '44px',
                width: '36px',
                height: '36px',
                cursor: 'pointer',
              }}
            />

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
                bottom: '31px',
                width: '257px',
                height: '73px',
                cursor: 'pointer',
              }}
            />
          </div>
          )}

          {/* Карточка 4 - Нижняя ПРАВАЯ */}
          {(!showOnlyFavorites || likedCards.includes(4)) && (
          <div style={{
            position: 'absolute',
            top: '834px',
            right: '22px',
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
              src={likedCards.includes(4) ? likeIcon : likeEmptyIcon}
              alt="лайк"
              onClick={() => toggleLike(4)}
              style={{
                position: 'absolute',
                left: '42px',
                top: '44px',
                width: '36px',
                height: '36px',
                cursor: 'pointer',
              }}
            />

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
                bottom: '31px',
                width: '257px',
                height: '73px',
                cursor: 'pointer',
              }}
            />
          </div>
          )}
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