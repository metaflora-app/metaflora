import React from 'react';
import { useNavigate } from 'react-router-dom';

// Reused components assets (from laba-search)
import bgPattern from '../../assets/figma-welcome/pattern.png';
import logoSmall from '../../assets/figma-welcome/logo-small.png';
import logoFooter from '../../assets/figma-welcome/logo-footer.png';
import socialsIcons from '../../assets/welcome-elements/socials-icons.png';
import supportButton from '../../assets/tour-video/support-button.png';
import exitArrow from '../../assets/tour-video/exit-arrow.png';
import homeIcon from '../../assets/about-screens/домой.png';

// Metacoins specific assets
import bigMetacoin from '../../assets/metacoins/большой метакоин.png';
import cardBackground from '../../assets/metacoins/карточка с фоном.png';
import priceButton3990 from '../../assets/metacoins/кнопка цена 3990.png';
import priceButton14490 from '../../assets/metacoins/кнопка цена 14490.png';
import buyButton from '../../assets/metacoins/купить метакоины.png';

export const MetacoinsScreen: React.FC = () => {
  const navigate = useNavigate();

  // Calculate scale based on viewport width (DESKTOP design width: 1180px)
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;

  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      minHeight: '100vh',
      background: '#020101',
      overflow: 'hidden',
    }}>
      {/* Scaled container - DESKTOP format 1180x2550 */}
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

        {/* Header - REUSED from laba-search */}
        
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

        {/* Title (75:726) - "выберите количество метакоинов" - x=94, y=198, 1020x160 */}
        <div style={{
          position: 'absolute',
          left: '94px',
          top: '198px',
          width: '1020px',
          height: '160px',
          fontFamily: 'Inter',
          fontWeight: 800,
          fontSize: '64px',
          lineHeight: 1.25,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
        }}>
          <p style={{ margin: 0 }}>выберите количество<br/>метакоинов</p>
        </div>

        {/* Card 1 - тариф 1 месяц (75:653) - x=143, y=418, 892x603 */}
        <div style={{
          position: 'absolute',
          left: '143px',
          top: '418px',
          width: '892px',
          height: '603px',
          borderRadius: '30px',
          overflow: 'hidden',
        }}>
          {/* Background */}
          <img 
            src={cardBackground}
            alt=""
            style={{
              position: 'absolute',
              left: '4px',
              top: '3px',
              width: '888px',
              height: '348px',
              objectFit: 'fill',
            }}
          />

          {/* "5000" + metacoin icon wrapper */}
          <div style={{
            position: 'absolute',
            left: '52px',
            top: '34px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <div style={{
              fontFamily: 'Inter',
              fontWeight: 800,
              fontSize: '64px',
              lineHeight: 1,
              color: 'white',
            }}>
              5000
            </div>
            <img 
              src={bigMetacoin}
              alt=""
              style={{
                width: '60px',
                height: '60px',
              }}
            />
          </div>

          {/* Price button 3990 (75:682) - x=699, y=57, 176x57 */}
          <img 
            src={priceButton3990}
            alt="3990 руб."
            style={{
              position: 'absolute',
              left: '699px',
              top: '57px',
              width: '176px',
              height: '57px',
              cursor: 'pointer',
            }}
          />

          {/* Description text (75:679) - x=52, y=147, 801x280 */}
          <div style={{
            position: 'absolute',
            left: '52px',
            top: '147px',
            width: '801px',
            height: '280px',
            fontFamily: 'Gotham Pro',
            fontSize: '28px',
            lineHeight: 1.4,
            color: 'white',
          }}>
            <p style={{ margin: 0, fontWeight: 300 }}>
              <span style={{ fontWeight: 700 }}>200+</span> ИИ-анализа контента<br/>
              <span style={{ fontWeight: 700 }}>130+</span> генераций сценариев<br/>
              <span style={{ fontWeight: 700 }}>50+</span> поисковых запросов по ключам<br/>
              <span style={{ fontWeight: 700 }}>20</span> отслеживаемых аккаунтов<br/>
              <span style={{ fontWeight: 700 }}>а также:</span> доступ к новым функциям<br/>
              сервиса, эксклюзивы и бонусы<br/>
              каждый месяц
            </p>
          </div>
        </div>

        {/* Card 2 - тариф 3 месяца (75:692) - x=143, y=1082, 892x603 */}
        <div style={{
          position: 'absolute',
          left: '143px',
          top: '1082px',
          width: '892px',
          height: '603px',
          borderRadius: '30px',
          overflow: 'hidden',
        }}>
          {/* Background */}
          <img 
            src={cardBackground}
            alt=""
            style={{
              position: 'absolute',
              left: '0',
              top: '0',
              width: '888px',
              height: '348px',
              objectFit: 'fill',
            }}
          />

          {/* "25 000" + metacoin icon wrapper */}
          <div style={{
            position: 'absolute',
            left: '60px',
            top: '37px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <div style={{
              fontFamily: 'Inter',
              fontWeight: 800,
              fontSize: '64px',
              lineHeight: 1,
              color: 'white',
            }}>
              25 000
            </div>
            <img 
              src={bigMetacoin}
              alt=""
              style={{
                width: '60px',
                height: '60px',
              }}
            />
          </div>

          {/* Price button 14490 (75:704) - x=705.93, y=57, 168.8x57 */}
          <img 
            src={priceButton14490}
            alt="14990 руб."
            style={{
              position: 'absolute',
              left: '706px',
              top: '57px',
              width: '169px',
              height: '57px',
              cursor: 'pointer',
            }}
          />

          {/* Description text (75:696) - x=60, y=149, 787x280 */}
          <div style={{
            position: 'absolute',
            left: '60px',
            top: '149px',
            width: '787px',
            height: '280px',
            fontFamily: 'Gotham Pro',
            fontSize: '28px',
            lineHeight: 1.4,
            color: 'white',
          }}>
            <p style={{ margin: 0, fontWeight: 300 }}>
              <span style={{ fontWeight: 700 }}>500+</span> ИИ-анализа контента<br/>
              <span style={{ fontWeight: 700 }}>250+</span> генераций сценариев<br/>
              <span style={{ fontWeight: 700 }}>200+</span> поисковых запросов по ключам<br/>
              <span style={{ fontWeight: 700 }}>100</span> отслеживаемых аккаунтов<br/>
              <span style={{ fontWeight: 700 }}>а также:</span> доступ к новым функциям<br/>
              сервиса, эксклюзивы и бонусы<br/>
              каждый месяц
            </p>
          </div>
        </div>

        {/* Buy button "купить метакоины" (75:729) - x=143, y=1744, 892x140 */}
        <img 
          src={buyButton}
          alt="купить метакоины"
          style={{
            position: 'absolute',
            left: '143px',
            top: '1744px',
            width: '892px',
            height: '140px',
            cursor: 'pointer',
            objectFit: 'contain',
          }}
        />

        {/* Footer - REUSED from laba-search */}
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
            left: 'calc(50% - 442px)',
            top: '56px',
            width: '433px',
            fontFamily: 'Gotham Pro',
            fontWeight: 300,
            fontSize: '20px',
            color: 'white',
          }}>
            <p style={{ margin: 0, lineHeight: 'normal', whiteSpace: 'pre-wrap' }}>
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
