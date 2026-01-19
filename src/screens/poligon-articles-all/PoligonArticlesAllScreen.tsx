import React from 'react';
import { useNavigate } from 'react-router-dom';

// Reused assets
import bgPattern from '../../assets/figma-welcome/pattern.png';
import logoSmall from '../../assets/figma-welcome/logo-small.png';
import logoFooter from '../../assets/figma-welcome/logo-footer.png';
import socialsIcons from '../../assets/welcome-elements/socials-icons.png';
import supportButton from '../../assets/tour-video/support-button.png';
import exitArrow from '../../assets/tour-video/exit-arrow.png';
import homeIcon from '../../assets/about-screens/домой.png';
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

const PoligonArticlesAllScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = React.useState('');
  const [selectedFilters, setSelectedFilters] = React.useState<string[]>([]);
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

  const isFilterActive = (filter: string) => selectedFilters.includes(filter);

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
          left: 0,
          top: 0,
          width: '1180px',
          height: '2550px',
          backgroundImage: `url(${bgPattern})`,
          backgroundRepeat: 'repeat',
          backgroundSize: 'auto',
        }} />

        {/* Header */}
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

        <div style={{
          position: 'absolute',
          left: '500px',
          top: '61px',
          width: '186px',
          height: '131px',
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
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            placeholder={isSearchFocused ? '' : 'найти по ключевым словам'}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontFamily: 'Gotham Pro',
              fontWeight: 300,
              fontSize: '27px',
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
          }}
        />

        {/* Filter: система (53:632) - x=467, y=394 */}
        <img
          src={isFilterActive('система') ? systemActive : systemInactive}
          alt="система"
          onClick={() => toggleFilter('система')}
          style={{
            position: 'absolute',
            left: '467px',
            top: '394px',
            width: '247px',
            height: '80px',
            cursor: 'pointer',
            objectFit: 'contain',
          }}
        />

        {/* Filter: искусство (53:639) - x=714, y=394 */}
        <img
          src={isFilterActive('искусство') ? artActive : artInactive}
          alt="искусство"
          onClick={() => toggleFilter('искусство')}
          style={{
            position: 'absolute',
            left: '714px',
            top: '394px',
            width: '247px',
            height: '80px',
            cursor: 'pointer',
            objectFit: 'contain',
          }}
        />

        {/* Filter: промптинг (53:642) - x=343, y=473 */}
        <img
          src={isFilterActive('промптинг') ? promptingActive : promptingInactive}
          alt="промптинг"
          onClick={() => toggleFilter('промптинг')}
          style={{
            position: 'absolute',
            left: '343px',
            top: '473px',
            width: '247px',
            height: '80px',
            cursor: 'pointer',
            objectFit: 'contain',
          }}
        />

        {/* Filter: автоматизация (53:644) - x=590, y=473 */}
        <img
          src={isFilterActive('автоматизация') ? automationActive : automationInactive}
          alt="автоматизация"
          onClick={() => toggleFilter('автоматизация')}
          style={{
            position: 'absolute',
            left: '590px',
            top: '473px',
            width: '247px',
            height: '80px',
            cursor: 'pointer',
            objectFit: 'contain',
          }}
        />

        {/* Footer */}
        <div style={{
          position: 'absolute',
          left: '141px',
          top: '2071px',
          width: '888px',
          height: '124px',
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
