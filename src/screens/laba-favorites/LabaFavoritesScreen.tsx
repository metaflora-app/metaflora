import React from 'react';
import { useNavigate } from 'react-router-dom';

// REUSED from prompt-first screen
import smallLogo from '../../assets/figma-welcome/logo-small.png';
import supportButtonPNG from '../../assets/tour-video/support-button.png';
import socialsIconsFooter from '../../assets/welcome-elements/socials-icons.png';
import logoFooter from '../../assets/figma-welcome/logo-footer.png';
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
import badgeStartSearch from '../../assets/laba-main-buttons/плашка начать поиск.png';
import peopleBackground from '../../assets/laba-no-tracked/люди друг на друге.png';

// REUSED: heart icon from prompt-first
// REUSED: footer and header components from prompt-first

// Laba icons
import searchIcon from '../../assets/laba-icons/иконка поиска.png';
import playIcon from '../../assets/tour-video/play-icon.png';
import viewsIcon from '../../assets/laba-icons/иконка просмотры.png';
import likesIcon from '../../assets/laba-icons/иконка лайки.png';
import commentsIcon from '../../assets/laba-icons/иконка комментарии.png';
import instaLogo from '../../assets/laba-icons/лого инста.png';

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
        {/* Header - Logo - REUSED */}
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
        <div className="blur-wave" style={{
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
              <img src={searchIcon} alt="" style={{ width: '100%', height: '100%' }} />
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

          {/* Badge "начать поиск" - PNG из Desktop */}
          <img 
            src={badgeStartSearch}
            alt="начать поиск"
            className="button-inner-glow"
            style={{
              position: 'absolute',
              left: 'calc(50% + 373px)',
              top: '-2px',
              transform: 'translateX(-50%)',
              width: '130px',
              height: '72px',
              cursor: 'pointer',
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
          className="button-inner-glow"
          style={{ position: 'absolute', left: '346px', top: '327px', width: '247px', height: '79px', cursor: 'pointer' }} 
        />
        <img 
          src={selectedDate ? buttonDateActive : buttonDate} 
          alt="дата" 
          onClick={() => handleFilterClick('date')}
          className="button-inner-glow"
          style={{ position: 'absolute', left: '593px', top: '327px', width: '247px', height: '79px', cursor: 'pointer' }} 
        />
        <img 
          src={selectedLanguage ? buttonLanguageActive : buttonLanguage} 
          alt="язык" 
          onClick={() => handleFilterClick('language')}
          className="button-inner-glow"
          style={{ position: 'absolute', left: '840px', top: '327px', width: '247px', height: '79px', cursor: 'pointer' }} 
        />

        {/* Filter buttons - Row 2 - EXACT Figma coordinates */}
        <img 
          src={selectedVirality ? buttonViralityActive : buttonVirality}
          alt="виральность"
          onClick={() => handleFilterClick('virality')}
          className="button-inner-glow"
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
          className="button-inner-glow"
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
          className="button-inner-glow"
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

        {/* Люди друг на друге - ПОД фреймом */}
        <img 
          src={peopleBackground}
          alt=""
          style={{
            position: 'absolute',
            left: '143px',
            top: '898px',
            width: '892px',
            height: '1050px',
            objectFit: 'contain',
            zIndex: 0,
            pointerEvents: 'none',
          }}
        />

        {/* Main content window - с СКРОЛЛОМ */}
        <div className="blur-wave" style={{
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
            <div className="blur-wave" style={{
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
              className="button-inner-glow"
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
            <div className="blur-wave" style={{
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
            <div className="blur-wave" style={{
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
                    src={viewsIcon}
                    alt=""
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
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
                    src={likesIcon}
                    alt=""
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
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
                    src={commentsIcon}
                    alt=""
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
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
                  src={instaLogo}
                  alt=""
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
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
              className="button-inner-glow"
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
            <div className="blur-wave button-inner-glow" style={{
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
            <div className="blur-wave" style={{
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
              className="button-inner-glow"
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

            <div className="blur-wave" style={{
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

            <div className="blur-wave" style={{
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
                    src={viewsIcon}
                    alt=""
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
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
                    src={likesIcon}
                    alt=""
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
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
                    src={commentsIcon}
                    alt=""
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
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
                  src={instaLogo}
                  alt=""
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
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
              className="button-inner-glow"
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

            <div className="blur-wave button-inner-glow" style={{
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
            <div className="blur-wave" style={{
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
              className="button-inner-glow"
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

            <div className="blur-wave" style={{
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

            <div className="blur-wave" style={{
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
                    src={viewsIcon}
                    alt=""
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
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
                    src={likesIcon}
                    alt=""
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
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
                    src={commentsIcon}
                    alt=""
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
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
                  src={instaLogo}
                  alt=""
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
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
              className="button-inner-glow"
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

            <div className="blur-wave button-inner-glow" style={{
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
            <div className="blur-wave" style={{
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
              className="button-inner-glow"
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

            <div className="blur-wave" style={{
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

            <div className="blur-wave" style={{
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
                    src={viewsIcon}
                    alt=""
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
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
                    src={likesIcon}
                    alt=""
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
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
                    src={commentsIcon}
                    alt=""
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
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
                  src={instaLogo}
                  alt=""
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
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
              className="button-inner-glow"
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

            <div className="blur-wave button-inner-glow" style={{
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

        {/* Footer */}
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