import React from 'react';
import { useNavigate } from 'react-router-dom';

// Images
import bgPattern from '../../assets/figma-welcome/pattern.png';
import logoSmall from '../../assets/figma-welcome/logo-small.png';
import logoFooter from '../../assets/figma-welcome/logo-footer.png';
import socialsIcons from '../../assets/welcome-elements/socials-icons.png';
import exitArrow from '../../assets/tour-video/exit-arrow.png';
import supportButton from '../../assets/tour-video/support-button.png';
import homeIcon from '../../assets/about-screens/домой.png';
import peopleLogo from '../../assets/about-screens/лого люди на фон.png';
import goButton from '../../assets/main-dashboard/кнопка перейти.png';

export const AcademyCourseSystemScreen: React.FC = () => {
  const navigate = useNavigate();

  // Calculate scale based on viewport width (design width: 1180px)
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;

  const lessons = [
    { number: 1, left: 'calc(50% - 236.5px)', top: '430px', numberLeft: 'calc(50% - 449px)', numberTop: '402px' },
    { number: 2, left: 'calc(50% + 232.5px)', top: '535px', numberLeft: 'calc(50% + 20px)', numberTop: '507px' },
    { number: 3, left: 'calc(50% - 236.5px)', top: '797px', numberLeft: 'calc(50% - 449px)', numberTop: '769px' },
    { number: 4, left: 'calc(50% + 232.5px)', top: '914px', numberLeft: 'calc(50% + 20px)', numberTop: '886px' },
    { number: 5, left: 'calc(50% - 236.5px)', top: '1176px', numberLeft: 'calc(50% - 449px)', numberTop: '1148px' },
    { number: 6, left: 'calc(50% + 232.5px)', top: '1293px', numberLeft: 'calc(50% + 20px)', numberTop: '1265px' },
    { number: 7, left: 'calc(50% - 235.5px)', top: '1566px', numberLeft: 'calc(50% - 449px)', numberTop: '1538px' },
    { number: 8, left: 'calc(50% + 232.5px)', top: '1683px', numberLeft: 'calc(50% + 20px)', numberTop: '1655px' },
  ];

  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      minHeight: '100vh',
      background: '#020101',
      overflow: 'hidden',
    }}>
      {/* Scaled container */}
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
          onClick={() => navigate('/academy-courses-all')}
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

        {/* Заголовок (7:2522) */}
        <div style={{
          position: 'absolute',
          left: '85px',
          top: '193px',
          width: '1020px',
          height: '80px',
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            fontFamily: 'Inter',
            fontWeight: 800,
            fontSize: '80px',
            lineHeight: 0,
            color: 'white',
          }}>
            <p style={{ margin: 0, lineHeight: '1' }}>уроки курса «система»</p>
          </div>
        </div>

        {/* Подзаголовок (7:2523) */}
        <div style={{
          position: 'absolute',
          left: '91px',
          top: '290px',
          width: '915px',
          height: '80px',
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            fontSize: '40px',
            lineHeight: 0,
            color: 'white',
          }}>
            <p style={{ margin: 0, lineHeight: '1' }}>
              <span style={{ fontFamily: 'Gotham Pro', fontWeight: 300 }}>научишься всем азам работы с нейронками в 2026 году: </span>
              <span style={{ fontFamily: 'Gotham Pro', fontWeight: 700 }}>какие выбрать и зачем</span>
            </p>
          </div>
        </div>

        {/* Лого "люди на фоне" под карточками - как на academy courses */}
        <img 
          src={peopleLogo}
          alt="МЕТАФЛОРА*"
          style={{
            position: 'absolute',
            left: '145px',
            top: '741px',
            width: '890px',
            height: '1166px',
            objectFit: 'contain',
          }}
        />

        {/* 8 карточек уроков */}
        {lessons.map((lesson) => (
          <React.Fragment key={lesson.number}>
            {/* Карточка урока */}
            <div style={{
              position: 'absolute',
              left: lesson.left,
              top: lesson.top,
              transform: 'translateX(-50%)',
              width: lesson.number === 7 ? '427px' : '425px',
              height: '317px',
              backdropFilter: 'blur(50px)',
              background: 'black',
              border: '4px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '30px',
              overflow: 'clip',
            }}>
              {/* Текст описания - точные inset из Figma */}
              <div style={{
                position: 'absolute',
                inset: 'calc(4.73% - 4px) 4% calc(35.03% - 4px) 4%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                fontFamily: 'Gotham Pro',
                fontWeight: 300,
                fontSize: '23px',
                lineHeight: '1.1',
                color: 'white',
                textAlign: 'center',
              }}>
                <p style={{ margin: 0 }}>
                  Курс «Система» — про то, как выстраивать процессы, а не тушить пожары. Ты собираешь понятную логику: цель → действия → результат, без хаоса и лишних шагов. На выходе —  система, которую.
                </p>
              </div>

              {/* Кнопка "перейти" - точные inset из Figma */}
              <div style={{
                position: 'absolute',
                inset: 'calc(64.98% - 4px) calc(21.19% - 4px) calc(10.02% - 4px) calc(20.71% - 4px)',
              }}>
                <img 
                  src={goButton}
                  alt="перейти"
                  onClick={() => navigate('/academy-lesson-video')}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    cursor: 'pointer',
                  }}
                />
              </div>
            </div>

            {/* Номер урока - ПОВЕРХ карточки */}
            <div style={{
              position: 'absolute',
              left: lesson.numberLeft,
              top: lesson.numberTop,
              transform: 'translateX(-50%)',
              width: '56px',
              height: '56px',
              backdropFilter: 'blur(50px)',
              background: 'black',
              border: lesson.number === 4 ? '1px solid rgba(255, 255, 255, 0.3)' : '4px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '30px',
              overflow: 'clip',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
            }}>
              <div style={{
                fontFamily: 'Inter',
                fontWeight: 700,
                fontSize: '50px',
                lineHeight: 0,
                color: 'white',
              }}>
                <p style={{ margin: 0, lineHeight: '1' }}>{lesson.number}</p>
              </div>
            </div>
          </React.Fragment>
        ))}

        {/* Footer */}
        <div style={{
          position: 'absolute',
          left: 'calc(50% - 5px)',
          top: '2071px',
          transform: 'translateX(-50%)',
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
