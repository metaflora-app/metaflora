import React from 'react';
import { useNavigate } from 'react-router-dom';

// Reused components assets (REUSE from other screens)
import bgPattern from '../../assets/figma-welcome/pattern.png';
import logoSmall from '../../assets/figma-welcome/logo-small.png';
import logoFooter from '../../assets/figma-welcome/logo-footer.png';
import socialsIcons from '../../assets/welcome-elements/socials-icons.png';
import supportButton from '../../assets/welcome-elements/написать в поддержку подложка.png';
import exitArrow from '../../assets/tour-elements/выход.png';
import homeIcon from '../../assets/about-screens/домой.png';

// Metacoins specific assets
import bigMetacoin from '../../assets/metacoins/большой метакоин.png';
import cardBackground from '../../assets/metacoins/карточка с фоном.png';

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
        
        {/* Back button */}
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

        {/* Home button */}
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

        {/* Logo */}
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

        {/* Support button */}
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
          fontSize: '80px',
          lineHeight: 1,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
        }}>
          <p style={{ margin: 0, lineHeight: 1, whiteSpace: 'pre-wrap' }}>выберите количество<br/>метакоинов</p>
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
          {/* Background image */}
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
              borderRadius: '21px',
            }}
          />

          {/* Card overlay with blur effect (75:654) */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backdropFilter: 'blur(50px)',
            background: 'rgba(255,255,255,0.1)',
            border: '4px solid rgba(255,255,255,0.3)',
            borderRadius: '30px',
          }} />

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
              fontSize: '80px',
              lineHeight: 1,
              color: 'white',
            }}>
              5000
            </div>
            {/* Placeholder for big metacoin icon */}
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              border: '2px solid rgba(255,255,255,0.3)',
            }} />
          </div>

          {/* Price button 3990 - styled based on Figma design */}
          <div style={{
            position: 'absolute',
            left: '699px',
            top: '57px',
            width: '176px',
            height: '57px',
            backdropFilter: 'blur(50px)',
            background: 'rgba(0,0,0,0.9)',
            border: '4px solid rgba(255,255,255,0.3)',
            borderRadius: '62px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            overflow: 'hidden',
          }}>
            {/* White gradient shapes */}
            <div style={{
              position: 'absolute',
              left: '52px',
              top: '-77px',
            }}>
              <div style={{
                position: 'absolute',
                background: 'white',
                height: '147.81px',
                left: '56px',
                borderRadius: '1568.563px',
                top: '-68.13px',
                width: '70.322px',
              }} />
              <div style={{
                position: 'absolute',
                display: 'flex',
                height: '108.071px',
                alignItems: 'center',
                justifyContent: 'center',
                left: '73.59px',
                top: '-73px',
                width: '62.414px',
              }}>
                <div style={{
                  transform: 'rotate(31.249deg) skewX(12.824deg)',
                  background: 'white',
                  height: '92.108px',
                  borderRadius: '1568.563px',
                  width: '39.549px',
                }} />
              </div>
              <div style={{
                position: 'absolute',
                background: 'white',
                height: '100.192px',
                left: '87.59px',
                borderRadius: '1568.563px',
                top: '23.56px',
                width: '38.727px',
              }} />
            </div>
            <div style={{
              fontFamily: 'Gotham Pro',
              fontWeight: 500,
              fontSize: '23px',
              lineHeight: 1,
              color: 'white',
              textAlign: 'center',
              zIndex: 10,
            }}>
              3990 руб.
            </div>
          </div>

          {/* Description text (75:679) */}
          <div style={{
            position: 'absolute',
            left: '52px',
            top: '147px',
            width: '801px',
            height: '280px',
            color: 'white',
          }}>
            <p style={{ margin: 0, fontSize: '40px', lineHeight: 1, whiteSpace: 'pre-wrap' }}>
              <span style={{ fontFamily: 'Gotham Pro', fontWeight: 700 }}>200+ </span>
              <span style={{ fontFamily: 'Gotham Pro', fontWeight: 300 }}>ИИ-анализа контента</span><br/>
              <span style={{ fontFamily: 'Gotham Pro', fontWeight: 700 }}>130+ </span>
              <span style={{ fontFamily: 'Gotham Pro', fontWeight: 300 }}>генераций сценариев </span><br/>
              <span style={{ fontFamily: 'Gotham Pro', fontWeight: 700 }}>50+ </span>
              <span style={{ fontFamily: 'Gotham Pro', fontWeight: 300 }}>поисковых запросов по ключам</span><br/>
              <span style={{ fontFamily: 'Gotham Pro', fontWeight: 700 }}>20</span>
              <span style={{ fontFamily: 'Gotham Pro', fontWeight: 300 }}> отслеживаемых аккаунтов</span><br/>
              <span style={{ fontFamily: 'Gotham Pro', fontWeight: 700 }}>а также: доступ к новым функциям сервиса, эксклюзивы и бонусы каждый месяц</span>
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
          {/* Background image */}
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
              borderRadius: '24px',
            }}
          />

          {/* Card overlay with blur effect (75:654) */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backdropFilter: 'blur(50px)',
            background: 'rgba(255,255,255,0.1)',
            border: '4px solid rgba(255,255,255,0.3)',
            borderRadius: '30px',
          }} />

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
              fontSize: '80px',
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

          {/* Price button 14490 - styled based on Figma design */}
          <div style={{
            position: 'absolute',
            left: '706px',
            top: '57px',
            width: '169px',
            height: '57px',
            backdropFilter: 'blur(50px)',
            background: 'rgba(0,0,0,0.9)',
            border: '4px solid rgba(255,255,255,0.3)',
            borderRadius: '62px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            overflow: 'hidden',
          }}>
            {/* White gradient shapes */}
            <div style={{
              position: 'absolute',
              left: '52px',
              top: '-77px',
            }}>
              <div style={{
                position: 'absolute',
                background: 'white',
                height: '147.81px',
                left: '56px',
                borderRadius: '1568.563px',
                top: '-68.13px',
                width: '70.322px',
              }} />
              <div style={{
                position: 'absolute',
                display: 'flex',
                height: '108.071px',
                alignItems: 'center',
                justifyContent: 'center',
                left: '73.59px',
                top: '-73px',
                width: '62.414px',
              }}>
                <div style={{
                  transform: 'rotate(31.249deg) skewX(12.824deg)',
                  background: 'white',
                  height: '92.108px',
                  borderRadius: '1568.563px',
                  width: '39.549px',
                }} />
              </div>
              <div style={{
                position: 'absolute',
                background: 'white',
                height: '100.192px',
                left: '87.59px',
                borderRadius: '1568.563px',
                top: '23.56px',
                width: '38.727px',
              }} />
            </div>
            <div style={{
              fontFamily: 'Gotham Pro',
              fontWeight: 500,
              fontSize: '23px',
              lineHeight: 1,
              color: 'white',
              textAlign: 'center',
              zIndex: 10,
            }}>
              14990 руб.
            </div>
          </div>

          {/* Description text (75:696) */}
          <div style={{
            position: 'absolute',
            left: '60px',
            top: '149px',
            width: '787px',
            height: '280px',
            color: 'white',
          }}>
            <p style={{ margin: 0, fontSize: '40px', lineHeight: 1, whiteSpace: 'pre-wrap' }}>
              <span style={{ fontFamily: 'Gotham Pro', fontWeight: 700 }}>500+ </span>
              <span style={{ fontFamily: 'Gotham Pro', fontWeight: 300 }}>ИИ-анализа контента</span><br/>
              <span style={{ fontFamily: 'Gotham Pro', fontWeight: 700 }}>250+ </span>
              <span style={{ fontFamily: 'Gotham Pro', fontWeight: 300 }}>генераций сценариев </span><br/>
              <span style={{ fontFamily: 'Gotham Pro', fontWeight: 700 }}>200+ </span>
              <span style={{ fontFamily: 'Gotham Pro', fontWeight: 300 }}>поисковых запросов по ключам</span><br/>
              <span style={{ fontFamily: 'Gotham Pro', fontWeight: 700 }}>100</span>
              <span style={{ fontFamily: 'Gotham Pro', fontWeight: 300 }}> отслеживаемых аккаунтов</span><br/>
              <span style={{ fontFamily: 'Gotham Pro', fontWeight: 700 }}>а также: доступ к новым функциям сервиса, эксклюзивы и бонусы каждый месяц</span>
            </p>
          </div>
        </div>

        {/* Buy button "купить метакоины" (75:729) - x=143, y=1744, 892x140 */}
        <div style={{
          position: 'absolute',
          left: '143px',
          top: '1744px',
          width: '892px',
          height: '140px',
          backdropFilter: 'blur(50px)',
          background: 'rgba(0,0,0,0.9)',
          border: '4px solid rgba(255,255,255,0.3)',
          borderRadius: '62px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          overflow: 'hidden',
        }}>
          {/* Gradient background */}
          <div style={{
            position: 'absolute',
            left: '141px',
            top: '-207.51px',
          }}>
            <div style={{
              position: 'absolute',
              background: '#fa002d',
              height: '423.343px',
              left: '145px',
              borderRadius: '1568.563px',
              top: '-189.57px',
              width: '575.775px',
            }} />
            <div style={{
              position: 'absolute',
              display: 'flex',
              height: '309.527px',
              alignItems: 'center',
              justifyContent: 'center',
              left: '288.97px',
              top: '-203.51px',
              width: '511.029px',
            }}>
              <div style={{
                transform: 'rotate(11.984deg) skewX(332.71deg)',
                background: '#f0d825',
                height: '343.114px',
                borderRadius: '1568.563px',
                width: '283.008px',
              }} />
            </div>
            <div style={{
              position: 'absolute',
              background: '#d5fc44',
              height: '286.961px',
              left: '403.64px',
              borderRadius: '1568.563px',
              top: '73.04px',
              width: '317.086px',
            }} />
          </div>
          <div style={{
            fontFamily: 'Gotham Pro',
            fontWeight: 500,
            fontSize: '40px',
            lineHeight: 1,
            color: 'white',
            textAlign: 'center',
            zIndex: 10,
          }}>
            купить метакоины
          </div>
        </div>

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