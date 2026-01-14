import React from 'react';
import { useNavigate } from 'react-router-dom';

// Images
import bgPattern from '../../assets/figma-welcome/pattern.png';
import logoSmall from '../../assets/figma-welcome/logo-small.png';
import exitArrow from '../../assets/tour-video/exit-arrow.png';
import supportButton from '../../assets/tour-video/support-button.png';
import homeIcon from '../../assets/about-screens/домой.png';
import promptButton from '../../assets/about-screens/промпт плашка.png';
import materialsButton from '../../assets/about-screens/кнопка материалы.png';

// Figma assets
const houseImage = "https://www.figma.com/api/mcp/asset/7a033aad-547d-43bc-891b-d54f93c946d2";
const logoFooterImg = "https://www.figma.com/api/mcp/asset/83bbfd9e-39b1-4eee-a1c6-18121694291e";
const socialsImg = "https://www.figma.com/api/mcp/asset/16f3197d-c198-4ab6-a00b-d05fe08fa6cf";
const peopleCircleImg = "https://www.figma.com/api/mcp/asset/ff88c2f3-4c40-4ea4-81fc-b9b478d773e0";

export const ArticleScreen: React.FC = () => {
  const navigate = useNavigate();
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

        <div style={{
          position: 'absolute',
          left: '151px',
          top: '1280px',
          width: '880px',
          height: '570px',
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            pointerEvents: 'none',
          }}>
            <img 
              src={peopleCircleImg}
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

        <div style={{
          position: 'absolute',
          left: '85px',
          top: '193px',
          width: '1020px',
          height: '80px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          fontFamily: 'Inter',
          fontWeight: 800,
          fontSize: '80px',
          lineHeight: 1,
          color: 'white',
        }}>
          <p style={{ margin: 0 }}>материалы статьи</p>
        </div>

        <div style={{
          position: 'absolute',
          left: '85px',
          top: '292px',
          width: '882px',
          height: '80px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          fontFamily: 'Gotham Pro',
          fontSize: '40px',
          lineHeight: 1,
          color: 'white',
        }}>
          <p style={{ margin: 0 }}>
            <span style={{ fontWeight: 700 }}>статья</span>
            <span style={{ fontWeight: 300 }}> «как перенести реальные предметы в нейрогенерацию»</span>
          </p>
        </div>

        <div style={{
          position: 'absolute',
          left: '88px',
          top: '399px',
          width: '1004px',
          height: '1643px',
          backdropFilter: 'blur(50px)',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '4px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '30px',
        }} />

        <div style={{
          position: 'absolute',
          left: '141px',
          top: '452px',
          width: '898px',
          height: '1536px',
          backdropFilter: 'blur(50px)',
          background: 'black',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '30px',
          overflow: 'auto',
        }} />

        <div style={{
          position: 'absolute',
          left: '356px',
          top: '489px',
          width: '469px',
          height: '104px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          fontFamily: 'Inter',
          fontWeight: 700,
          fontSize: '52px',
          lineHeight: 1,
          color: 'white',
          textAlign: 'center',
        }}>
          <p style={{ margin: 0 }}>морфинг через общие элементы</p>
        </div>

        <div style={{
          position: 'absolute',
          left: '174px',
          top: '645px',
          width: '833px',
          height: '180px',
          fontFamily: 'Gotham Pro',
          fontWeight: 300,
          fontSize: '35px',
          lineHeight: 1,
          color: 'white',
          textAlign: 'center',
        }}>
          <p style={{ margin: 0 }}>идея в том, чтобы в конце одного кадра был объект, похожий по форме или цвету на объект в начале следующего. Допустим, вы хотите перейти от сцены с костром к восходу солнца. Тогда в первом клипе огонь должен постепенно заполнить весь кадр:</p>
        </div>

        <div style={{
          position: 'absolute',
          left: '173px',
          top: '886px',
          width: '835px',
          height: '362px',
          border: '2px solid rgba(0, 0, 0, 0.3)',
          borderRadius: '20px',
          overflow: 'hidden',
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
              pointerEvents: 'none',
            }}
          />
        </div>

        <img 
          src={promptButton}
          alt="промпт"
          style={{
            position: 'absolute',
            left: '467px',
            top: '1302px',
            width: '247px',
            height: '79px',
            objectFit: 'contain',
          }}
        />

        <div style={{
          position: 'absolute',
          left: '204px',
          top: '1427px',
          width: '772px',
          height: '340px',
          fontFamily: 'Gotham Pro',
          fontWeight: 300,
          fontSize: '35px',
          lineHeight: 1,
          color: 'white',
          textAlign: 'center',
          overflow: 'auto',
        }}>
          <p style={{ margin: 0 }}>A close-up of a campfire burning intensely, flames dancing and flickering, the fire gradually fills the entire frame, warm orange glow.</p>
          <p style={{ margin: 0 }}>А второй клип начинается с солнца, которое тоже заполняет кадр:</p>
          <p style={{ margin: 0 }}>&nbsp;</p>
          <p style={{ margin: 0 }}>A bright orange sun rising over the ocean horizon, starting as a small glowing orb that.</p>
        </div>

        <img 
          src={materialsButton}
          alt="материалы"
          style={{
            position: 'absolute',
            left: '467px',
            top: '1789px',
            width: '247px',
            height: '79px',
            objectFit: 'contain',
          }}
        />

        <div style={{
          position: 'absolute',
          left: '754px',
          top: '1907px',
          width: '35px',
          height: '35px',
          backdropFilter: 'blur(50px)',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '30px',
          overflow: 'clip',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            width: '15px',
            height: '15px',
            background: 'white',
            clipPath: 'polygon(45% 0%, 55% 0%, 55% 45%, 100% 45%, 100% 55%, 55% 55%, 55% 100%, 45% 100%, 45% 55%, 0% 55%, 0% 45%, 45% 45%)',
          }} />
        </div>

        <div style={{
          position: 'absolute',
          left: '388px',
          top: '1901px',
          width: '405px',
          fontFamily: 'Gotham Pro',
          fontWeight: 500,
          fontSize: '32px',
          lineHeight: 1,
          color: 'white',
          textAlign: 'center',
        }}>
          скачать файлы (5)
        </div>

        <div style={{
          position: 'absolute',
          left: 'calc(50% - 5px)',
          top: '2071px',
          width: '888px',
          height: '124px',
          transform: 'translateX(-50%)',
        }}>
          <div style={{
            position: 'absolute',
            left: '2px',
            top: '-16px',
            width: '380px',
            height: '83px',
          }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              overflow: 'hidden',
              pointerEvents: 'none',
            }}>
              <img 
                src={logoFooterImg}
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
            height: '20px',
            fontFamily: 'Gotham Pro',
            fontWeight: 300,
            fontSize: '20px',
            color: 'white',
          }}>
            <p style={{ margin: 0 }}>Copyright © Все права защищены.</p>
          </div>

          <div style={{
            position: 'absolute',
            left: '664px',
            top: '-2px',
            width: '230px',
            height: '78px',
            backdropFilter: 'blur(50px)',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '62px',
          }} />
          
          <div style={{
            position: 'absolute',
            left: '681px',
            top: '13px',
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
                src={socialsImg}
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
            left: '735px',
            top: '13px',
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
                src={socialsImg}
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
  );
};