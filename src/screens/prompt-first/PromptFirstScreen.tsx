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

// Figma MCP assets
const threePeopleBg = "https://www.figma.com/api/mcp/asset/1f6ef230-2b81-4e04-8d67-9a5cf1485327";
const houseImage = "https://www.figma.com/api/mcp/asset/561dab05-4ef7-4239-862d-adee28216da3";
const heartIcon = "https://www.figma.com/api/mcp/asset/8e6e8e5e-eec6-4e7c-bbbd-f7a5c6a56c4c";


export const PromptFirstScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = React.useState('');

  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;

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

        {/* Filter: вернуть (PNG) */}
        <img 
          src={returnButton}
          alt="вернуть"
          style={{
            position: 'absolute',
            inset: '28.75% 60.43% 68.15% 18.64%',
            width: 'auto',
            height: 'auto',
            objectFit: 'contain',
            cursor: 'pointer',
          }}
        />

        {/* Filter: избранное */}
        <img 
          src={favoriteButton}
          alt="избранное"
          style={{
            position: 'absolute',
            inset: '28.75% 39.5% 68.15% 39.58%',
            objectFit: 'contain',
            cursor: 'pointer',
          }}
        />

        {/* Filter: недавние */}
        <img 
          src={recentButton}
          alt="недавние"
          style={{
            position: 'absolute',
            inset: '28.75% 18.57% 68.15% 60.51%',
            objectFit: 'contain',
            cursor: 'pointer',
          }}
        />

        {/* Filter: топ-выбор */}
        <img 
          src={topPickButton}
          alt="топ-выбор"
          style={{
            position: 'absolute',
            inset: '31.84% 50.01% 65.05% 29.07%',
            objectFit: 'contain',
            cursor: 'pointer',
          }}
        />

        {/* Filter: новые */}
        <img 
          src={newButton}
          alt="новые"
          style={{
            position: 'absolute',
            bottom: '65.05%',
            left: '50%',
            right: '29.07%',
            top: '31.84%',
            objectFit: 'contain',
            cursor: 'pointer',
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
          overflow: 'clip',
          zIndex: 10,
          padding: '40px',
          display: 'flex',
          gap: '30px',
        }}>
          {/* Карточка 1 - ТОЧНАЯ КОПИЯ из Figma 160-637 */}
          <div style={{
            position: 'relative',
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
            <div style={{
              position: 'absolute',
              top: '5.63%',
              right: '80.98%',
              bottom: '89.77%',
              left: '10.24%',
            }}>
              <img 
                src={heartIcon}
                alt=""
                style={{
                  width: '100%',
                  height: '100%',
                  maxWidth: 'none',
                }}
              />
            </div>

            {/* Плашка "новое" */}
            <div style={{
              position: 'absolute',
              top: '5.63%',
              right: '9.95%',
              bottom: '89.77%',
              left: '57.32%',
              backdropFilter: 'blur(50px)',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '62px',
              overflow: 'clip',
            }}>
              <div style={{
                position: 'absolute',
                left: 'calc(50% - 0.6px)',
                top: 'calc(50% - 0.5px)',
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                height: '19px',
                width: '111px',
                fontFamily: 'Gotham Pro, sans-serif',
                fontWeight: 500,
                fontSize: '18px',
                color: 'white',
                textAlign: 'center',
                lineHeight: 0,
              }}>
                <p style={{ lineHeight: 'normal', whiteSpace: 'pre-wrap', margin: 0 }}>новое</p>
              </div>
            </div>

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

            {/* Кнопка "перейти" - DIV с цветными кругами */}
            <div 
              onClick={() => navigate('/prompt-card')}
              style={{
                position: 'absolute',
                top: '81.84%',
                right: '19.77%',
                bottom: '8.02%',
                left: '20%',
                backdropFilter: 'blur(50px)',
                background: 'rgba(0, 0, 0, 0.9)',
                border: '4px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '62px',
                overflow: 'clip',
                cursor: 'pointer',
              }}
            >
              {/* Цветные круги */}
              <div style={{ position: 'absolute', left: '73px', top: '-44px' }}>
                <div style={{
                  position: 'absolute',
                  left: '77px',
                  top: '-36.46px',
                  width: '101.963px',
                  height: '107.431px',
                  background: '#37ecf7',
                  borderRadius: '1568.563px',
                }} />
                <div style={{
                  position: 'absolute',
                  left: '102.5px',
                  top: '-40px',
                  width: '90.498px',
                  height: '78.548px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <div style={{
                    width: '51.243px',
                    height: '75.957px',
                    background: '#f0d825',
                    borderRadius: '1568.563px',
                    transform: 'rotate(16.918deg) skewX(-15.566deg)',
                    flexShrink: 0,
                  }} />
                </div>
                <div style={{
                  position: 'absolute',
                  left: '122.8px',
                  top: '30.18px',
                  width: '56.152px',
                  height: '72.822px',
                  background: '#d5fc44',
                  borderRadius: '1568.563px',
                }} />
              </div>
              
              {/* Текст кнопки */}
              <div style={{
                position: 'absolute',
                left: 'calc(50% + 0.03px)',
                top: 'calc(50% - 0.12px)',
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                height: '29px',
                width: '119px',
                fontFamily: 'Gotham Pro, sans-serif',
                fontWeight: 500,
                fontSize: '27px',
                color: 'white',
                textAlign: 'center',
                lineHeight: 0,
              }}>
                <p style={{ lineHeight: 'normal', whiteSpace: 'pre-wrap', margin: 0 }}>перейти</p>
              </div>
            </div>
          </div>
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