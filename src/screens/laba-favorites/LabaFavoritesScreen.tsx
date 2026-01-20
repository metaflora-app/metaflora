import React from 'react';
import { useNavigate } from 'react-router-dom';

// REUSED from prompt-first screen
import smallLogo from '../../assets/figma-welcome/logo-small.png';
import supportButtonPNG from '../../assets/tour-video/support-button.png';
import socialsIconsFooter from '../../assets/welcome-elements/socials-icons.png';
import bgPattern from '../../assets/figma-welcome/pattern.png';

// Laba-main PNG assets
import analysisButtonPNG from '../../assets/laba-main/кнопка анализ.png';
import cardImage from '../../assets/laba-main/картинка в карточке промпта.png';
import newBadgePNG from '../../assets/laba-main/плашка новое.png';

// Filter buttons PNG
import buttonReturn from '../../assets/laba-main-buttons/кнопка вернуть.png';
import buttonSort from '../../assets/laba-main-buttons/кнопка сортировка неактив.png';
import buttonSortActive from '../../assets/laba-main-buttons/кнопка сортировка.png';
import buttonDate from '../../assets/laba-main-buttons/кнопка дата неактив.png';
import buttonDateActive from '../../assets/laba-main-buttons/кнопка дата.png';
import buttonLanguage from '../../assets/laba-main-buttons/кнопка язык неактив.png';
import buttonLanguageActive from '../../assets/laba-main-buttons/кнопка язык.png';
import buttonVirality from '../../assets/laba-main-buttons/кнопка виральность неактив.png';
import buttonViralityActive from '../../assets/laba-main-buttons/кнопка виральность.png';
import buttonAccount from '../../assets/laba-main-buttons/кнопка аккаунт неактив.png';
import buttonAccountActive from '../../assets/laba-main-buttons/кнопка аккаунт.png';
import buttonFormat from '../../assets/laba-main-buttons/кнопка формат.png';
import badgeLikes from '../../assets/laba-main-buttons/плашка лайки неактив.png';
import badgeLikesActive from '../../assets/laba-main-buttons/плашка лайки.png';
import badgeTimeslot from '../../assets/laba-main-buttons/плашка таймслот неактив.png';
import badgeTimeslotActive from '../../assets/laba-main-buttons/плашка таймслот.png';
import badgeRussian from '../../assets/laba-main-buttons/плашка русский неактив.png';
import badgeRussianActive from '../../assets/laba-main-buttons/плашка русский.png';
import badgeScores from '../../assets/laba-main-buttons/плашка баллы неактив.png';
import badgeScoresActive from '../../assets/laba-main-buttons/плашка баллы.png';
import badgeAccount from '../../assets/laba-main-buttons/плашка аккаунт неактив.png';
import badgeAccountActive from '../../assets/laba-main-buttons/плашка аккаунт.png';
import badgeReels from '../../assets/laba-main-buttons/плашка рилс.png';
import badgeSearchCost from '../../assets/laba-main-buttons/плашка сколько стоит поиск.png';

// REUSED: heart icon from prompt-first
// REUSED: footer and header components from prompt-first

// Figma MCP assets  
const footerLogo = "https://www.figma.com/api/mcp/asset/3bd9d147-154a-4929-aab7-9df5b0793789";
const backArrow = "https://www.figma.com/api/mcp/asset/df23cbdc-6a1c-47c3-8b9f-97ecb4397784";
const searchIconMCP = "https://www.figma.com/api/mcp/asset/746ea58b-0e0f-40b8-8aa4-d0be923dbe39";
const homeVector1 = "https://www.figma.com/api/mcp/asset/8f6661d8-2d62-49c8-ae88-5e19d118e967";
const homeVector2 = "https://www.figma.com/api/mcp/asset/4a9951a6-1fa4-45c0-a766-090a909e4bed";
const playIcon = "https://www.figma.com/api/mcp/asset/8ca3a30c-2ba8-4c9b-839c-86a31fd5d54e";
const statusBarIcons = "https://www.figma.com/api/mcp/asset/3f2b218f-ce7e-4476-801e-c4f2c0cb134c";

export const LabaFavoritesScreen: React.FC = () => {
  const navigate = useNavigate();
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;
  
  const [selectedSort, setSelectedSort] = React.useState<string | null>(null);
  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = React.useState<string | null>(null);
  const [selectedVirality, setSelectedVirality] = React.useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = React.useState<string | null>(null);
  const [likedCards, setLikedCards] = React.useState<Set<number>>(new Set([1, 2, 3, 4]));
  const [searchValue, setSearchValue] = React.useState('');
  const [isSearchFocused, setIsSearchFocused] = React.useState(false);

  const handleSortClick = () => {
    if (window.Telegram?.WebApp?.showPopup) {
      window.Telegram.WebApp.showPopup({
        message: 'сортировка\n\n>просмотров\n<просмотров\n>лайков\n<лайков\n>комментариев\n<комментариев'
      });
      setSelectedSort('selected');
    }
  };

  const handleFilterClick = (filterType: string) => {
    if (window.Telegram?.WebApp?.showPopup) {
      let message = '';
      
      switch(filterType) {
        case 'date':
          message = 'дата публикации\n\nпоследние 7 дней\nпоследние 14 дней\nпоследние 30 дней\nпоследние 6 месяцев\nпоследний год';
          setSelectedDate('selected');
          break;
        case 'language':
          message = 'язык\n\nрусский\nанглийский\nиспанский\nтурецкий\nфранцузский';
          setSelectedLanguage('selected');
          break;
        case 'virality':
          message = 'виральность\n\n0-2 балла\n3-5 баллов\n6-8 баллов\n9-10 баллов';
          setSelectedVirality('selected');
          break;
        case 'account':
          message = 'размер аккаунта\n\n0-10к\n10к-100к\n100к-300к\n300к-1млн\nбольше 1млн';
          setSelectedAccount('selected');
          break;
      }
      
      window.Telegram.WebApp.showPopup({ message });
    }
  };

  const handleReturnClick = () => {
    setSelectedSort(null);
    setSelectedDate(null);
    setSelectedLanguage(null);
    setSelectedVirality(null);
    setSelectedAccount(null);
    setLikedCards(new Set());
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
      }}>
        {/* Header - REUSED from prompt-first */}
        {/* Header - Back button */}
        <div 
          onClick={() => navigate(-1)}
          style={{
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            left: 'calc(50% - 452px)',
            width: '100px',
            height: '100px',
            top: '75px',
            transform: 'translateX(-50%)',
            cursor: 'pointer',
          }}
        >
          <div style={{ transform: 'rotate(270deg)' }}>
            <div style={{
              backdropFilter: 'blur(50px)',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '4px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '62px',
              overflow: 'hidden',
              width: '100px',
              height: '100px',
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                left: '11px',
                width: '71px',
                height: '71px',
                top: '10px',
              }}>
                <div style={{ transform: 'rotate(90deg)', width: '71px', height: '71px', position: 'relative' }}>
                  <div style={{ position: 'absolute', inset: '3.13%' }}>
                    <img src={backArrow} alt="" style={{ width: '100%', height: '100%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Header - Home button - REUSED */}
        <div 
          onClick={() => navigate('/main-dashboard-premium')}
          style={{
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            left: 'calc(50% - 352px)',
            width: '100px',
            height: '100px',
            top: '75px',
            transform: 'translateX(-50%)',
            cursor: 'pointer',
          }}
        >
          <div style={{ transform: 'rotate(270deg)' }}>
            <div style={{
              backdropFilter: 'blur(50px)',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '4px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '62px',
              overflow: 'hidden',
              width: '100px',
              height: '100px',
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                left: '24px',
                width: '65px',
                height: '65px',
                top: '13px',
              }}>
                <div style={{ transform: 'rotate(90deg)', width: '65px', height: '65px', position: 'relative' }}>
                  <div style={{ position: 'absolute', inset: '19.15% 15.36% -12.9% 12.77%' }}>
                    <img src={homeVector1} alt="" style={{ width: '100%', height: '100%' }} />
                  </div>
                  <div style={{ position: 'absolute', inset: '27.81% 42.67% 33.98% 19.82%' }}>
                    <img src={homeVector2} alt="" style={{ width: '100%', height: '100%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Header - Logo - REUSED */}
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

        {/* Header - Support button - REUSED */}
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

        {/* Search bar + 25 badge - EXACT Figma coordinates */}
        <div style={{
          position: 'absolute',
          backdropFilter: 'blur(50px)',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          height: '72px',
          left: 'calc(50% + 3px)',
          borderRadius: '62px',
          top: '223px',
          transform: 'translateX(-50%)',
          width: '876px',
          overflow: 'clip',
        }}>
          {/* Search icon */}
          <div style={{
            position: 'absolute',
            left: '22px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '38px',
            height: '38px',
          }}>
            <div style={{
              position: 'absolute',
              top: '3.12%',
              right: '3.12%',
              bottom: '3.13%',
              left: '3.12%',
            }}>
              <img src={searchIconMCP} alt="" style={{ width: '100%', height: '100%' }} />
            </div>
          </div>

          {/* Search input */}
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
onBlur={() => {
              setTimeout(() => {
                setIsSearchFocused(false);
                setSearchValue('');
              }, 100);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (searchValue.trim() === '') {
                  if (window.Telegram?.WebApp?.showPopup) {
                    window.Telegram.WebApp.showPopup({
                      message: 'ничего не найдено. проверьте корректность ключа'
                    });
                  }
                }
              }
            }}
            placeholder={isSearchFocused ? '' : 'найти видео по ключевым словам'}
            enterKeyHint="search"
            style={{
              position: 'absolute',
              left: '70px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '612px',
              fontFamily: 'Gotham Pro, sans-serif',
              fontWeight: 300,
              fontSize: '32px',
              color: '#848484',
              background: 'transparent',
              border: 'none',
              outline: 'none',
            }}
          />

          {/* Badge "25" - PNG из Desktop */}
          <img 
            src={badgeSearchCost}
            alt="25"
            style={{
              position: 'absolute',
              left: 'calc(50% + 373px)',
              top: '-2px',
              transform: 'translateX(-50%)',
              width: '130px',
              height: '72px',
            }}
          />
        </div>

        {/* Filter buttons - Row 1 - EXACT Figma coordinates */}
        <img 
          src={buttonReturn} 
          alt="вернуть" 
          onClick={handleReturnClick}
          style={{ position: 'absolute', left: '99px', top: '327px', width: '247px', height: '79px', cursor: 'pointer' }} 
        />
        <img 
          src={selectedSort ? buttonSortActive : buttonSort} 
          alt="сортировка" 
          onClick={handleSortClick}
          style={{ position: 'absolute', left: '346px', top: '327px', width: '247px', height: '79px', cursor: 'pointer' }} 
        />
        <img 
          src={selectedDate ? buttonDateActive : buttonDate} 
          alt="дата" 
          onClick={() => handleFilterClick('date')}
          style={{ position: 'absolute', left: '593px', top: '327px', width: '247px', height: '79px', cursor: 'pointer' }} 
        />
        <img 
          src={selectedLanguage ? buttonLanguageActive : buttonLanguage} 
          alt="язык" 
          onClick={() => handleFilterClick('language')}
          style={{ position: 'absolute', left: '840px', top: '327px', width: '247px', height: '79px', cursor: 'pointer' }} 
        />

        {/* Filter buttons - Row 2 - EXACT Figma coordinates */}
        <img 
          src={selectedVirality ? buttonViralityActive : buttonVirality}
          alt="виральность"
          onClick={() => handleFilterClick('virality')}
          style={{
            position: 'absolute',
            left: '220px',
            top: '485px',
            width: '247px',
            height: '79px',
            cursor: 'pointer',
          }}
        />

        <img 
          src={selectedAccount ? buttonAccountActive : buttonAccount}
          alt="аккаунт"
          onClick={() => handleFilterClick('account')}
          style={{
            position: 'absolute',
            left: '464px',
            top: '485px',
            width: '247px',
            height: '79px',
            cursor: 'pointer',
          }}
        />

        <img 
          src={buttonFormat}
          alt="формат"
          style={{
            position: 'absolute',
            left: '711px',
            top: '485px',
            width: '247px',
            height: '79px',
          }}
        />

        {/* Filter badges - Row 2 - EXACT Figma coordinates */}
        <img 
          src={selectedSort ? badgeLikesActive : badgeLikes}
          alt=">лайков"
          style={{
            position: 'absolute',
            left: '407px',
            top: '406px',
            width: '186px',
            height: '79px',
          }}
        />

        <img 
          src={selectedDate ? badgeTimeslotActive : badgeTimeslot}
          alt="14 дней"
          style={{
            position: 'absolute',
            left: '654px',
            top: '406px',
            width: '186px',
            height: '79px',
          }}
        />

        <img 
          src={selectedLanguage ? badgeRussianActive : badgeRussian}
          alt="русский"
          style={{
            position: 'absolute',
            left: '901px',
            top: '406px',
            width: '186px',
            height: '79px',
          }}
        />

        {/* Filter badges - Row 3 - активные плашки с Desktop */}
        <img 
          src={selectedVirality ? badgeScoresActive : badgeScores}
          alt="9-10 баллов"
          style={{
            position: 'absolute',
            left: '278px',
            top: '564px',
            width: '186px',
            height: '79px',
          }}
        />

        <img 
          src={selectedAccount ? badgeAccountActive : badgeAccount}
          alt="0-10к"
          style={{
            position: 'absolute',
            left: '516px',
            top: '564px',
            width: '186px',
            height: '79px',
          }}
        />

        <img 
          src={badgeReels}
          alt="IG reels"
          style={{
            position: 'absolute',
            left: '754px',
            top: '564px',
            width: '186px',
            height: '79px',
          }}
        />

        {/* Люди друг на друге - ПОД фреймом, ТОЧНО из Figma node 164:1101 */}
        <div style={{
          position: 'absolute',
          height: '1050px',
          left: '143px',
          top: '898px',
          width: '892px',
          zIndex: 0,
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            pointerEvents: 'none',
          }}>
            <img 
              src="https://www.figma.com/api/mcp/asset/882d0069-a777-43bb-8d98-35cdf5b184ca"
              alt=""
              style={{
                position: 'absolute',
                height: '162.05%',
                left: '-92.74%',
                maxWidth: 'none',
                top: '-20.87%',
                width: '286.41%',
              }}
            />
          </div>
        </div>

        {/* Main content window - с СКРОЛЛОМ */}
        <div style={{
          position: 'absolute',
          backdropFilter: 'blur(50px)',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '4px solid rgba(255, 255, 255, 0.3)',
          height: '1369px',
          left: 'calc(50% + 3px)',
          borderRadius: '30px',
          top: '673px',
          width: '884px',
          transform: 'translateX(-50%)',
          overflow: 'auto',
          zIndex: 10,
        }}>
          {/* Карточка 1 - Верхняя левая - EXACT Figma coordinates */}
          <div style={{
            position: 'absolute',
            left: '22px',
            top: '23px',
            width: '410px',
            height: '782px',
          }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              backdropFilter: 'blur(50px)',
              background: '#000',
              border: '4px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '30px',
            }} />
            
            {/* Картинка в карточке промпта PNG */}
            <div style={{
              position: 'absolute',
              top: '3.45%',
              right: '6.59%',
              bottom: '45.4%',
              left: '6.59%',
              border: '2px solid rgba(0, 0, 0, 0.3)',
              borderRadius: '25px',
            }}>
              <img 
                src={cardImage}
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

            {/* Badge "новое" - x=269, y=44 relative to card */}
            <img
              src={newBadgePNG}
              alt="новое"
              style={{
                position: 'absolute',
                left: '269px',
                top: '44px',
                width: '101px',
                height: '36px',
                objectFit: 'contain',
              }}
            />

            {/* Like icon - x=42, y=44 relative to card */}
            <div 
              onClick={() => {
                setLikedCards(prev => {
                  const newSet = new Set(prev);
                  if (newSet.has(1)) {
                    newSet.delete(1);
                  } else {
                    newSet.add(1);
                  }
                  return newSet;
                });
              }}
              style={{
                position: 'absolute',
                left: '42px',
                top: '44px',
                width: '36px',
                height: '36px',
                cursor: 'pointer',
              }}
            >
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <path d="M18 30L6 18C3 15 3 9 6 6C9 3 15 3 18 6C21 3 27 3 30 6C33 9 33 15 30 18L18 30Z" 
                  stroke={likedCards.has(1) ? '#FF0000' : 'white'} 
                  strokeWidth="2" 
                  fill={likedCards.has(1) ? '#FF0000' : 'none'} />
              </svg>
            </div>

            {/* Play кнопка - EXACT position */}
            <div style={{
              position: 'absolute',
              top: '22.76%',
              right: '38.78%',
              bottom: '64.71%', 
              left: '37.32%',
              backdropFilter: 'blur(50px)',
              background: 'rgba(0, 0, 0, 0.1)',
              border: '4px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '62px',
              overflow: 'clip',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <div style={{
                transform: 'rotate(90deg)',
                width: '60px',
                height: '60px',
                position: 'relative',
              }}>
                <img src={playIcon} alt="" style={{ width: '100%', height: '100%', maxWidth: 'none' }} />
              </div>
            </div>

            {/* Статистика бар с иконками - ТОЧНО из Figma */}
            <div style={{
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
            }}>
              {/* Иконка просмотров - crop из общего PNG */}
              <div style={{
                position: 'absolute',
                height: '39px',
                left: '21px',
                top: '5px',
                width: '46px',
              }}>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  overflow: 'hidden',
                  pointerEvents: 'none',
                }}>
                  <img 
                    src={statusBarIcons}
                    alt=""
                    style={{
                      position: 'absolute',
                      height: '339.22%',
                      left: '-69.53%',
                      maxWidth: 'none',
                      top: '-115.69%',
                      width: '426.73%',
                    }}
                  />
                </div>
              </div>

              {/* Иконка лайков - crop из общего PNG */}
              <div style={{
                position: 'absolute',
                height: '39px',
                left: '132px',
                top: '4px',
                width: '40px',
              }}>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  overflow: 'hidden',
                  pointerEvents: 'none',
                }}>
                  <img 
                    src={statusBarIcons}
                    alt=""
                    style={{
                      position: 'absolute',
                      height: '339.22%',
                      left: '-193.75%',
                      maxWidth: 'none',
                      top: '-115.69%',
                      width: '487.69%',
                    }}
                  />
                </div>
              </div>

              {/* Иконка комментариев - crop из общего PNG */}
              <div style={{
                position: 'absolute',
                height: '39px',
                left: '228px',
                top: '5px',
                width: '40px',
              }}>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  overflow: 'hidden',
                  pointerEvents: 'none',
                }}>
                  <img 
                    src={statusBarIcons}
                    alt=""
                    style={{
                      position: 'absolute',
                      height: '339.22%',
                      left: '-304.47%',
                      maxWidth: 'none',
                      top: '-115.69%',
                      width: '487.69%',
                    }}
                  />
                </div>
              </div>

              {/* Статистика текст */}
              <div style={{
                position: 'absolute',
                bottom: 'calc(30.77% - 2px)',
                display: 'flex',
                flexDirection: 'column',
                fontFamily: 'Gotham Pro, sans-serif',
                fontWeight: 500,
                justifyContent: 'center',
                left: 'calc(50% - 68px)',
                lineHeight: 0,
                fontSize: '27px',
                textAlign: 'center',
                color: 'white',
                top: 'calc(30.77% - 2px)',
                transform: 'translateX(-50%)',
                width: '73px',
              }}>
                <p style={{ lineHeight: 'normal', whiteSpace: 'pre-wrap', margin: 0 }}>227к</p>
              </div>

              <div style={{
                position: 'absolute',
                bottom: 'calc(31.39% - 2px)',
                display: 'flex',
                flexDirection: 'column',
                fontFamily: 'Gotham Pro, sans-serif',
                fontWeight: 500,
                justifyContent: 'center',
                left: 'calc(50% + 33px)',
                lineHeight: 0,
                fontSize: '27px',
                textAlign: 'center',
                color: 'white',
                top: 'calc(30.77% - 2px)',
                transform: 'translateX(-50%)',
                width: '55px',
              }}>
                <p style={{ lineHeight: 'normal', whiteSpace: 'pre-wrap', margin: 0 }}>40к</p>
              </div>

              <div style={{
                position: 'absolute',
                bottom: 'calc(31.39% - 2px)',
                display: 'flex',
                flexDirection: 'column',
                fontFamily: 'Gotham Pro, sans-serif',
                fontWeight: 500,
                justifyContent: 'center',
                left: 'calc(50% + 120px)',
                lineHeight: 0,
                fontSize: '27px',
                textAlign: 'center',
                color: 'white',
                top: 'calc(30.77% - 2px)',
                transform: 'translateX(-50%)',
                width: '35px',
              }}>
                <p style={{ lineHeight: 'normal', whiteSpace: 'pre-wrap', margin: 0 }}>2к</p>
              </div>
            </div>

            {/* Instagram лого PNG - ТОЧНО из Figma node 164:861 */}
            <div style={{
              position: 'absolute',
              left: '7.32%',
              right: '77.07%',
              top: '448px',
              aspectRatio: '42/51',
            }}>
              <div style={{
                position: 'absolute',
                inset: 0,
                opacity: 0.6,
                overflow: 'hidden',
                pointerEvents: 'none',
              }}>
                <img 
                  src="https://www.figma.com/api/mcp/asset/939902d8-304e-4ab2-a982-2eb9c0274c17"
                  alt=""
                  style={{
                    position: 'absolute',
                    height: '339.84%',
                    left: '-56.27%',
                    maxWidth: 'none',
                    top: '-118.33%',
                    width: '620.89%',
                  }}
                />
              </div>
            </div>

            <div style={{
              position: 'absolute',
              top: '67.26%',
              right: '11.22%',
              bottom: '27.37%',
              left: '7.32%',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 700,
              fontSize: '40px',
              color: 'white',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}>
              @mishchenko.is
            </div>

            <div style={{
              position: 'absolute',
              top: '74.55%',
              right: '8.05%',
              bottom: '22.12%',
              left: '6.59%',
              fontFamily: 'Gotham Pro, sans-serif',
              fontWeight: 300,
              fontSize: '32px',
              color: 'white',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}>
              275,5к подписчиков
            </div>

            {/* Кнопка "анализ" PNG */}
            <img
              src={analysisButtonPNG}
              alt="анализ" 
              onClick={() => navigate('/laba-analysis')}
              style={{
                position: 'absolute',
                bottom: '63px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '248px',
                height: '79px',
                cursor: 'pointer',
              }}
            />

            {/* Временная плашка */}
            <div style={{
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
                2 месяца назад
              </div>
            </div>
          </div>

          {/* Карточка 2 - Верхняя правая */}
          <div style={{
            position: 'absolute',
            left: '444px',
            top: '23px',
            width: '410px',
            height: '782px',
          }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              backdropFilter: 'blur(50px)',
              background: '#000',
              border: '4px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '30px',
            }} />
            
            <div style={{
              position: 'absolute',
              top: '3.45%',
              right: '6.59%',
              bottom: '45.4%',
              left: '6.59%',
              border: '2px solid rgba(0, 0, 0, 0.3)',
              borderRadius: '25px',
            }}>
              <img 
                src={cardImage}
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

            {/* Badge "новое" - x=269, y=44 relative to card */}
            <img
              src={newBadgePNG}
              alt="новое"
              style={{
                position: 'absolute',
                left: '269px',
                top: '44px',
                width: '101px',
                height: '36px',
                objectFit: 'contain',
              }}
            />

            <div 
              onClick={() => {
                setLikedCards(prev => {
                  const newSet = new Set(prev);
                  if (newSet.has(2)) {
                    newSet.delete(2);
                  } else {
                    newSet.add(2);
                  }
                  return newSet;
                });
              }}
              style={{
                position: 'absolute',
                left: '42px',
                top: '44px',
                width: '36px',
                height: '36px',
                cursor: 'pointer',
              }}
            >
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <path d="M18 30L6 18C3 15 3 9 6 6C9 3 15 3 18 6C21 3 27 3 30 6C33 9 33 15 30 18L18 30Z" 
                  stroke={likedCards.has(2) ? '#FF0000' : 'white'} 
                  strokeWidth="2" 
                  fill={likedCards.has(2) ? '#FF0000' : 'none'} />
              </svg>
            </div>

            <div style={{
              position: 'absolute',
              top: '22.76%',
              right: '38.78%',
              bottom: '64.71%', 
              left: '37.32%',
              backdropFilter: 'blur(50px)',
              background: 'rgba(0, 0, 0, 0.1)',
              border: '4px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '62px',
              overflow: 'clip',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <div style={{
                transform: 'rotate(90deg)',
                width: '60px',
                height: '60px',
                position: 'relative',
              }}>
                <img src={playIcon} alt="" style={{ width: '100%', height: '100%', maxWidth: 'none' }} />
              </div>
            </div>

            <div style={{
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
            }}>
              <div style={{
                position: 'absolute',
                height: '39px',
                left: '21px',
                top: '5px',
                width: '46px',
              }}>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  overflow: 'hidden',
                  pointerEvents: 'none',
                }}>
                  <img 
                    src={statusBarIcons}
                    alt=""
                    style={{
                      position: 'absolute',
                      height: '339.22%',
                      left: '-69.53%',
                      maxWidth: 'none',
                      top: '-115.69%',
                      width: '426.73%',
                    }}
                  />
                </div>
              </div>

              <div style={{
                position: 'absolute',
                height: '39px',
                left: '132px',
                top: '4px',
                width: '40px',
              }}>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  overflow: 'hidden',
                  pointerEvents: 'none',
                }}>
                  <img 
                    src={statusBarIcons}
                    alt=""
                    style={{
                      position: 'absolute',
                      height: '339.22%',
                      left: '-193.75%',
                      maxWidth: 'none',
                      top: '-115.69%',
                      width: '487.69%',
                    }}
                  />
                </div>
              </div>

              <div style={{
                position: 'absolute',
                height: '39px',
                left: '228px',
                top: '5px',
                width: '40px',
              }}>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  overflow: 'hidden',
                  pointerEvents: 'none',
                }}>
                  <img 
                    src={statusBarIcons}
                    alt=""
                    style={{
                      position: 'absolute',
                      height: '339.22%',
                      left: '-304.47%',
                      maxWidth: 'none',
                      top: '-115.69%',
                      width: '487.69%',
                    }}
                  />
                </div>
              </div>

              <div style={{
                position: 'absolute',
                bottom: 'calc(30.77% - 2px)',
                display: 'flex',
                flexDirection: 'column',
                fontFamily: 'Gotham Pro, sans-serif',
                fontWeight: 500,
                justifyContent: 'center',
                left: 'calc(50% - 68px)',
                lineHeight: 0,
                fontSize: '27px',
                textAlign: 'center',
                color: 'white',
                top: 'calc(30.77% - 2px)',
                transform: 'translateX(-50%)',
                width: '73px',
              }}>
                <p style={{ lineHeight: 'normal', whiteSpace: 'pre-wrap', margin: 0 }}>227к</p>
              </div>

              <div style={{
                position: 'absolute',
                bottom: 'calc(31.39% - 2px)',
                display: 'flex',
                flexDirection: 'column',
                fontFamily: 'Gotham Pro, sans-serif',
                fontWeight: 500,
                justifyContent: 'center',
                left: 'calc(50% + 33px)',
                lineHeight: 0,
                fontSize: '27px',
                textAlign: 'center',
                color: 'white',
                top: 'calc(30.77% - 2px)',
                transform: 'translateX(-50%)',
                width: '55px',
              }}>
                <p style={{ lineHeight: 'normal', whiteSpace: 'pre-wrap', margin: 0 }}>40к</p>
              </div>

              <div style={{
                position: 'absolute',
                bottom: 'calc(31.39% - 2px)',
                display: 'flex',
                flexDirection: 'column',
                fontFamily: 'Gotham Pro, sans-serif',
                fontWeight: 500,
                justifyContent: 'center',
                left: 'calc(50% + 120px)',
                lineHeight: 0,
                fontSize: '27px',
                textAlign: 'center',
                color: 'white',
                top: 'calc(30.77% - 2px)',
                transform: 'translateX(-50%)',
                width: '35px',
              }}>
                <p style={{ lineHeight: 'normal', whiteSpace: 'pre-wrap', margin: 0 }}>2к</p>
              </div>
            </div>

            <div style={{
              position: 'absolute',
              left: '7.32%',
              right: '77.07%',
              top: '448px',
              aspectRatio: '42/51',
            }}>
              <div style={{
                position: 'absolute',
                inset: 0,
                opacity: 0.6,
                overflow: 'hidden',
                pointerEvents: 'none',
              }}>
                <img 
                  src="https://www.figma.com/api/mcp/asset/939902d8-304e-4ab2-a982-2eb9c0274c17"
                  alt=""
                  style={{
                    position: 'absolute',
                    height: '339.84%',
                    left: '-56.27%',
                    maxWidth: 'none',
                    top: '-118.33%',
                    width: '620.89%',
                  }}
                />
              </div>
            </div>

            <div style={{
              position: 'absolute',
              top: '67.26%',
              right: '11.22%',
              bottom: '27.37%',
              left: '7.32%',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 700,
              fontSize: '40px',
              color: 'white',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}>
              @mishchenko.is
            </div>

            <div style={{
              position: 'absolute',
              top: '74.55%',
              right: '8.05%',
              bottom: '22.12%',
              left: '6.59%',
              fontFamily: 'Gotham Pro, sans-serif',
              fontWeight: 300,
              fontSize: '32px',
              color: 'white',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}>
              275,5к подписчиков
            </div>

            <img
              src={analysisButtonPNG}
              alt="анализ" 
              onClick={() => navigate('/laba-analysis')}
              style={{
                position: 'absolute',
                bottom: '63px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '248px',
                height: '79px',
                cursor: 'pointer',
              }}
            />

            <div style={{
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
                2 месяца назад
              </div>
            </div>
          </div>

          {/* Карточка 3 - Нижняя левая */}
          <div style={{
            position: 'absolute',
            left: '22px',
            top: '828px',
            width: '410px',
            height: '782px',
          }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              backdropFilter: 'blur(50px)',
              background: '#000',
              border: '4px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '30px',
            }} />
            
            <div style={{
              position: 'absolute',
              top: '3.45%',
              right: '6.59%',
              bottom: '45.4%',
              left: '6.59%',
              border: '2px solid rgba(0, 0, 0, 0.3)',
              borderRadius: '25px',
            }}>
              <img 
                src={cardImage}
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

            {/* Badge "новое" - x=269, y=44 relative to card */}
            <img
              src={newBadgePNG}
              alt="новое"
              style={{
                position: 'absolute',
                left: '269px',
                top: '44px',
                width: '101px',
                height: '36px',
                objectFit: 'contain',
              }}
            />

            <div 
              onClick={() => {
                setLikedCards(prev => {
                  const newSet = new Set(prev);
                  if (newSet.has(3)) {
                    newSet.delete(3);
                  } else {
                    newSet.add(3);
                  }
                  return newSet;
                });
              }}
              style={{
                position: 'absolute',
                left: '42px',
                top: '44px',
                width: '36px',
                height: '36px',
                cursor: 'pointer',
              }}
            >
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <path d="M18 30L6 18C3 15 3 9 6 6C9 3 15 3 18 6C21 3 27 3 30 6C33 9 33 15 30 18L18 30Z" 
                  stroke={likedCards.has(3) ? '#FF0000' : 'white'} 
                  strokeWidth="2" 
                  fill={likedCards.has(3) ? '#FF0000' : 'none'} />
              </svg>
            </div>

            <div style={{
              position: 'absolute',
              top: '22.76%',
              right: '38.78%',
              bottom: '64.71%', 
              left: '37.32%',
              backdropFilter: 'blur(50px)',
              background: 'rgba(0, 0, 0, 0.1)',
              border: '4px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '62px',
              overflow: 'clip',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <div style={{
                transform: 'rotate(90deg)',
                width: '60px',
                height: '60px',
                position: 'relative',
              }}>
                <img src={playIcon} alt="" style={{ width: '100%', height: '100%', maxWidth: 'none' }} />
              </div>
            </div>

            <div style={{
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
            }}>
              <div style={{
                position: 'absolute',
                height: '39px',
                left: '21px',
                top: '5px',
                width: '46px',
              }}>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  overflow: 'hidden',
                  pointerEvents: 'none',
                }}>
                  <img 
                    src={statusBarIcons}
                    alt=""
                    style={{
                      position: 'absolute',
                      height: '339.22%',
                      left: '-69.53%',
                      maxWidth: 'none',
                      top: '-115.69%',
                      width: '426.73%',
                    }}
                  />
                </div>
              </div>

              <div style={{
                position: 'absolute',
                height: '39px',
                left: '132px',
                top: '4px',
                width: '40px',
              }}>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  overflow: 'hidden',
                  pointerEvents: 'none',
                }}>
                  <img 
                    src={statusBarIcons}
                    alt=""
                    style={{
                      position: 'absolute',
                      height: '339.22%',
                      left: '-193.75%',
                      maxWidth: 'none',
                      top: '-115.69%',
                      width: '487.69%',
                    }}
                  />
                </div>
              </div>

              <div style={{
                position: 'absolute',
                height: '39px',
                left: '228px',
                top: '5px',
                width: '40px',
              }}>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  overflow: 'hidden',
                  pointerEvents: 'none',
                }}>
                  <img 
                    src={statusBarIcons}
                    alt=""
                    style={{
                      position: 'absolute',
                      height: '339.22%',
                      left: '-304.47%',
                      maxWidth: 'none',
                      top: '-115.69%',
                      width: '487.69%',
                    }}
                  />
                </div>
              </div>

              <div style={{
                position: 'absolute',
                bottom: 'calc(30.77% - 2px)',
                display: 'flex',
                flexDirection: 'column',
                fontFamily: 'Gotham Pro, sans-serif',
                fontWeight: 500,
                justifyContent: 'center',
                left: 'calc(50% - 68px)',
                lineHeight: 0,
                fontSize: '27px',
                textAlign: 'center',
                color: 'white',
                top: 'calc(30.77% - 2px)',
                transform: 'translateX(-50%)',
                width: '73px',
              }}>
                <p style={{ lineHeight: 'normal', whiteSpace: 'pre-wrap', margin: 0 }}>227к</p>
              </div>

              <div style={{
                position: 'absolute',
                bottom: 'calc(31.39% - 2px)',
                display: 'flex',
                flexDirection: 'column',
                fontFamily: 'Gotham Pro, sans-serif',
                fontWeight: 500,
                justifyContent: 'center',
                left: 'calc(50% + 33px)',
                lineHeight: 0,
                fontSize: '27px',
                textAlign: 'center',
                color: 'white',
                top: 'calc(30.77% - 2px)',
                transform: 'translateX(-50%)',
                width: '55px',
              }}>
                <p style={{ lineHeight: 'normal', whiteSpace: 'pre-wrap', margin: 0 }}>40к</p>
              </div>

              <div style={{
                position: 'absolute',
                bottom: 'calc(31.39% - 2px)',
                display: 'flex',
                flexDirection: 'column',
                fontFamily: 'Gotham Pro, sans-serif',
                fontWeight: 500,
                justifyContent: 'center',
                left: 'calc(50% + 120px)',
                lineHeight: 0,
                fontSize: '27px',
                textAlign: 'center',
                color: 'white',
                top: 'calc(30.77% - 2px)',
                transform: 'translateX(-50%)',
                width: '35px',
              }}>
                <p style={{ lineHeight: 'normal', whiteSpace: 'pre-wrap', margin: 0 }}>2к</p>
              </div>
            </div>

            <div style={{
              position: 'absolute',
              left: '7.32%',
              right: '77.07%',
              top: '448px',
              aspectRatio: '42/51',
            }}>
              <div style={{
                position: 'absolute',
                inset: 0,
                opacity: 0.6,
                overflow: 'hidden',
                pointerEvents: 'none',
              }}>
                <img 
                  src="https://www.figma.com/api/mcp/asset/939902d8-304e-4ab2-a982-2eb9c0274c17"
                  alt=""
                  style={{
                    position: 'absolute',
                    height: '339.84%',
                    left: '-56.27%',
                    maxWidth: 'none',
                    top: '-118.33%',
                    width: '620.89%',
                  }}
                />
              </div>
            </div>

            <div style={{
              position: 'absolute',
              top: '67.26%',
              right: '11.22%',
              bottom: '27.37%',
              left: '7.32%',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 700,
              fontSize: '40px',
              color: 'white',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}>
              @mishchenko.is
            </div>

            <div style={{
              position: 'absolute',
              top: '74.55%',
              right: '8.05%',
              bottom: '22.12%',
              left: '6.59%',
              fontFamily: 'Gotham Pro, sans-serif',
              fontWeight: 300,
              fontSize: '32px',
              color: 'white',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}>
              275,5к подписчиков
            </div>

            <img
              src={analysisButtonPNG}
              alt="анализ" 
              onClick={() => navigate('/laba-analysis')}
              style={{
                position: 'absolute',
                bottom: '63px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '248px',
                height: '79px',
                cursor: 'pointer',
              }}
            />

            <div style={{
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
                2 месяца назад
              </div>
            </div>
          </div>

          {/* Карточка 4 - Нижняя правая */}
          <div style={{
            position: 'absolute',
            left: '444px',
            top: '828px',
            width: '410px',
            height: '782px',
          }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              backdropFilter: 'blur(50px)',
              background: '#000',
              border: '4px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '30px',
            }} />
            
            <div style={{
              position: 'absolute',
              top: '3.45%',
              right: '6.59%',
              bottom: '45.4%',
              left: '6.59%',
              border: '2px solid rgba(0, 0, 0, 0.3)',
              borderRadius: '25px',
            }}>
              <img 
                src={cardImage}
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

            {/* Badge "новое" - x=269, y=44 relative to card */}
            <img
              src={newBadgePNG}
              alt="новое"
              style={{
                position: 'absolute',
                left: '269px',
                top: '44px',
                width: '101px',
                height: '36px',
                objectFit: 'contain',
              }}
            />

            <div 
              onClick={() => {
                setLikedCards(prev => {
                  const newSet = new Set(prev);
                  if (newSet.has(4)) {
                    newSet.delete(4);
                  } else {
                    newSet.add(4);
                  }
                  return newSet;
                });
              }}
              style={{
                position: 'absolute',
                left: '42px',
                top: '44px',
                width: '36px',
                height: '36px',
                cursor: 'pointer',
              }}
            >
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <path d="M18 30L6 18C3 15 3 9 6 6C9 3 15 3 18 6C21 3 27 3 30 6C33 9 33 15 30 18L18 30Z" 
                  stroke={likedCards.has(4) ? '#FF0000' : 'white'} 
                  strokeWidth="2" 
                  fill={likedCards.has(4) ? '#FF0000' : 'none'} />
              </svg>
            </div>

            <div style={{
              position: 'absolute',
              top: '22.76%',
              right: '38.78%',
              bottom: '64.71%', 
              left: '37.32%',
              backdropFilter: 'blur(50px)',
              background: 'rgba(0, 0, 0, 0.1)',
              border: '4px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '62px',
              overflow: 'clip',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <div style={{
                transform: 'rotate(90deg)',
                width: '60px',
                height: '60px',
                position: 'relative',
              }}>
                <img src={playIcon} alt="" style={{ width: '100%', height: '100%', maxWidth: 'none' }} />
              </div>
            </div>

            <div style={{
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
            }}>
              <div style={{
                position: 'absolute',
                height: '39px',
                left: '21px',
                top: '5px',
                width: '46px',
              }}>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  overflow: 'hidden',
                  pointerEvents: 'none',
                }}>
                  <img 
                    src={statusBarIcons}
                    alt=""
                    style={{
                      position: 'absolute',
                      height: '339.22%',
                      left: '-69.53%',
                      maxWidth: 'none',
                      top: '-115.69%',
                      width: '426.73%',
                    }}
                  />
                </div>
              </div>

              <div style={{
                position: 'absolute',
                height: '39px',
                left: '132px',
                top: '4px',
                width: '40px',
              }}>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  overflow: 'hidden',
                  pointerEvents: 'none',
                }}>
                  <img 
                    src={statusBarIcons}
                    alt=""
                    style={{
                      position: 'absolute',
                      height: '339.22%',
                      left: '-193.75%',
                      maxWidth: 'none',
                      top: '-115.69%',
                      width: '487.69%',
                    }}
                  />
                </div>
              </div>

              <div style={{
                position: 'absolute',
                height: '39px',
                left: '228px',
                top: '5px',
                width: '40px',
              }}>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  overflow: 'hidden',
                  pointerEvents: 'none',
                }}>
                  <img 
                    src={statusBarIcons}
                    alt=""
                    style={{
                      position: 'absolute',
                      height: '339.22%',
                      left: '-304.47%',
                      maxWidth: 'none',
                      top: '-115.69%',
                      width: '487.69%',
                    }}
                  />
                </div>
              </div>

              <div style={{
                position: 'absolute',
                bottom: 'calc(30.77% - 2px)',
                display: 'flex',
                flexDirection: 'column',
                fontFamily: 'Gotham Pro, sans-serif',
                fontWeight: 500,
                justifyContent: 'center',
                left: 'calc(50% - 68px)',
                lineHeight: 0,
                fontSize: '27px',
                textAlign: 'center',
                color: 'white',
                top: 'calc(30.77% - 2px)',
                transform: 'translateX(-50%)',
                width: '73px',
              }}>
                <p style={{ lineHeight: 'normal', whiteSpace: 'pre-wrap', margin: 0 }}>227к</p>
              </div>

              <div style={{
                position: 'absolute',
                bottom: 'calc(31.39% - 2px)',
                display: 'flex',
                flexDirection: 'column',
                fontFamily: 'Gotham Pro, sans-serif',
                fontWeight: 500,
                justifyContent: 'center',
                left: 'calc(50% + 33px)',
                lineHeight: 0,
                fontSize: '27px',
                textAlign: 'center',
                color: 'white',
                top: 'calc(30.77% - 2px)',
                transform: 'translateX(-50%)',
                width: '55px',
              }}>
                <p style={{ lineHeight: 'normal', whiteSpace: 'pre-wrap', margin: 0 }}>40к</p>
              </div>

              <div style={{
                position: 'absolute',
                bottom: 'calc(31.39% - 2px)',
                display: 'flex',
                flexDirection: 'column',
                fontFamily: 'Gotham Pro, sans-serif',
                fontWeight: 500,
                justifyContent: 'center',
                left: 'calc(50% + 120px)',
                lineHeight: 0,
                fontSize: '27px',
                textAlign: 'center',
                color: 'white',
                top: 'calc(30.77% - 2px)',
                transform: 'translateX(-50%)',
                width: '35px',
              }}>
                <p style={{ lineHeight: 'normal', whiteSpace: 'pre-wrap', margin: 0 }}>2к</p>
              </div>
            </div>

            <div style={{
              position: 'absolute',
              left: '7.32%',
              right: '77.07%',
              top: '448px',
              aspectRatio: '42/51',
            }}>
              <div style={{
                position: 'absolute',
                inset: 0,
                opacity: 0.6,
                overflow: 'hidden',
                pointerEvents: 'none',
              }}>
                <img 
                  src="https://www.figma.com/api/mcp/asset/939902d8-304e-4ab2-a982-2eb9c0274c17"
                  alt=""
                  style={{
                    position: 'absolute',
                    height: '339.84%',
                    left: '-56.27%',
                    maxWidth: 'none',
                    top: '-118.33%',
                    width: '620.89%',
                  }}
                />
              </div>
            </div>

            <div style={{
              position: 'absolute',
              top: '67.26%',
              right: '11.22%',
              bottom: '27.37%',
              left: '7.32%',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 700,
              fontSize: '40px',
              color: 'white',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}>
              @mishchenko.is
            </div>

            <div style={{
              position: 'absolute',
              top: '74.55%',
              right: '8.05%',
              bottom: '22.12%',
              left: '6.59%',
              fontFamily: 'Gotham Pro, sans-serif',
              fontWeight: 300,
              fontSize: '32px',
              color: 'white',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}>
              275,5к подписчиков
            </div>

            <img
              src={analysisButtonPNG}
              alt="анализ" 
              onClick={() => navigate('/laba-analysis')}
              style={{
                position: 'absolute',
                bottom: '63px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '248px',
                height: '79px',
                cursor: 'pointer',
              }}
            />

            <div style={{
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
                2 месяца назад
              </div>
            </div>
          </div>
        </div>

        {/* Footer - ТОЧНО из Figma 7:908 */}
        <div style={{
          position: 'absolute',
          height: '124px',
          left: 'calc(50% - 5px)',
          top: 'calc(50% + 858px)',
          transform: 'translate(-50%, -50%)',
          width: '888px',
        }}>
          <div style={{
            position: 'absolute',
            height: '83px',
            left: '2px',
            top: '-16px',
            width: '380px',
          }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              overflow: 'hidden',
              pointerEvents: 'none',
            }}>
              <img 
                src={footerLogo}
                alt=""
                style={{
                  position: 'absolute',
                  height: '526.54%',
                  left: '-37.89%',
                  maxWidth: 'none',
                  top: '-202.47%',
                  width: '170.37%',
                }}
              />
            </div>
          </div>
          
          <div style={{
            position: 'absolute',
            bottom: '38.71%',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'Gotham Pro, sans-serif',
            fontWeight: 300,
            justifyContent: 'center',
            left: 'calc(50% - 442px)',
            lineHeight: 0,
            fontSize: '20px',
            color: 'white',
            top: '45.16%',
            width: '433px',
          }}>
            <p style={{ lineHeight: 'normal', whiteSpace: 'pre-wrap', margin: 0 }}>Copyright © Все права защищены.</p>
          </div>
          
          <div style={{
            position: 'absolute',
            height: '51px',
            left: 'calc(50% + 335px)',
            top: 'calc(50% - 23.5px)',
            transform: 'translate(-50%, -50%)',
            width: '196px',
          }}>
            <div style={{
              position: 'absolute',
              backdropFilter: 'blur(50px)',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '4px solid rgba(255, 255, 255, 0.3)',
              height: '78px',
              left: '-17px',
              borderRadius: '62px',
              top: '-15px',
              width: '230px',
            }} />
            {/* Telegram */}
            <div style={{
              position: 'absolute',
              height: '51px',
              left: 0,
              top: 0,
              width: '50px',
              opacity: 0.6,
              overflow: 'hidden',
              pointerEvents: 'none',
            }}>
              <img 
                src={socialsIconsFooter}
                alt=""
                style={{
                  position: 'absolute',
                  height: '339.84%',
                  left: '-377.92%',
                  maxWidth: 'none',
                  top: '-118.33%',
                  width: '517.92%',
                }}
              />
            </div>
            {/* Instagram */}
            <div style={{
              position: 'absolute',
              height: '51px',
              left: '54px',
              top: 0,
              width: '142px',
              opacity: 0.6,
              overflow: 'hidden',
              pointerEvents: 'none',
            }}>
              <img 
                src={socialsIconsFooter}
                alt=""
                style={{
                  position: 'absolute',
                  height: '339.84%',
                  left: '-16.64%',
                  maxWidth: 'none',
                  top: '-118.33%',
                  width: '183.64%',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};