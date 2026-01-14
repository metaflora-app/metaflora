import React from 'react';
import { useNavigate } from 'react-router-dom';

// Images
import bgPattern from '../../assets/figma-welcome/pattern.png';
import logoSmall from '../../assets/figma-welcome/logo-small.png';
import logoFooter from '../../assets/figma-welcome/logo-footer.png';
import socialsIcons from '../../assets/welcome-elements/socials-icons.png';
import exitArrow from '../../assets/tour-video/exit-arrow.png';
import supportButton from '../../assets/tour-video/support-button.png';
import academyBg from '../../assets/main-dashboard/фон академия.png';
import labaBg from '../../assets/main-dashboard/фон лаба.png';
import tsekhBg from '../../assets/main-dashboard/фон цех.png';
import poligonBg from '../../assets/main-dashboard/фон полигон.png';
import studyButton from '../../assets/about-screens/кнопка открыть цех.png';
import peopleLogo from '../../assets/about-screens/лого люди на фон.png';

export const AcademyCoursesAllScreen: React.FC = () => {
  const navigate = useNavigate();

  // Calculate scale based on viewport width (design width: 1180px)
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;

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
        {/* Background pattern (фон точки) */}
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

        {/* Кнопка "выход" */}
        <img 
          src={exitArrow}
          alt="назад"
          onClick={() => navigate('/about-academy')}
          style={{
            position: 'absolute',
            left: 'calc(50% - 452px)',
            top: '75px',
            width: '100px',
            height: '100px',
            cursor: 'pointer',
          }}
        />

        {/* Логотип маленький */}
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

        {/* Кнопка "написать в поддержку" */}
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

        {/* Заголовок "библиотека курсов" (7:2242) */}
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
            <p style={{ margin: 0, lineHeight: '1' }}>библиотека курсов</p>
          </div>
        </div>

        {/* Подзаголовок (7:2243) */}
        <div style={{
          position: 'absolute',
          left: '94px',
          top: '293px',
          width: '792px',
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
              <span style={{ fontFamily: 'Gotham Pro', fontWeight: 300 }}>пройдено </span>
              <span style={{ fontFamily: 'Gotham Pro', fontWeight: 700 }}>10% курсов академии. </span>
              <span style={{ fontFamily: 'Gotham Pro', fontWeight: 300 }}>Сongratulations!</span>
            </p>
          </div>
        </div>

        {/* Большое лого "люди на фоне" (29:548) - ПОД карточками, узкое */}
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

        {/* Карточка 1 - Академия / Система (29:431) */}
        <div style={{
          position: 'absolute',
          left: '141px',
          top: '413px',
          width: '894px',
          height: '249px',
        }}>
          {/* Индикатор оранжевый */}
          <div style={{
            position: 'absolute',
            left: '27px',
            top: '19px',
            width: '36px',
            height: '36px',
          }}>
            <div style={{
              position: 'absolute',
              left: '50%',
              top: 0,
              transform: 'translateX(-50%)',
              width: '38px',
              height: '38px',
              backdropFilter: 'blur(50px)',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '30px',
            }} />
            <div style={{
              position: 'absolute',
              left: '50%',
              top: '11px',
              transform: 'translateX(-50%)',
              width: '16px',
              height: '16px',
              backdropFilter: 'blur(50px)',
              background: '#f8d050',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '30px',
            }} />
          </div>

          {/* Фон академия - левая половина */}
          <div style={{
            position: 'absolute',
            inset: '2.01% 49.78% 1.2% 0',
          }}>
            <img 
              src={academyBg}
              alt=""
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '26px',
              }}
            />
          </div>

          {/* Плашка "новое" */}
          <div style={{
            position: 'absolute',
            inset: '7.63% 52.81% 77.91% 32.18%',
            backdropFilter: 'blur(50px)',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '62px',
            overflow: 'clip',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{
              fontFamily: 'Gotham Pro',
              fontWeight: 500,
              fontSize: '18px',
              color: 'white',
            }}>
              новое
            </div>
          </div>

          {/* Текст справа - черная карточка */}
          <div style={{
            position: 'absolute',
            inset: '0 0 0 50.22%',
            backdropFilter: 'blur(50px)',
            background: 'black',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '30px',
            overflow: 'clip',
          }}>
            <div style={{
              position: 'absolute',
              inset: '8.43% 4% 8.43% 4%',
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
                Курс «Система» — про то, как выстраивать процессы, а не тушить пожары. Ты собираешь понятную логику: цель → действия → результат, без хаоса и лишних шагов. На выходе — рабочая система, которую можно повторять и масштабировать.
              </p>
            </div>
          </div>

          {/* Шторка со стрелкой */}
          <div style={{
            position: 'absolute',
            inset: '0 0 0 63.07%',
            backdropFilter: 'blur(50px)',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '30px',
            overflow: 'clip',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{
              fontSize: '40px',
              color: 'white',
            }}>
              →
            </div>
          </div>

          {/* Кнопка "изучить" */}
          <img 
            src={studyButton}
            alt="изучить"
            onClick={() => navigate('/academy-course-system')}
            style={{
              position: 'absolute',
              left: '96px',
              top: '91px',
              width: '257px',
              height: '73px',
              cursor: 'pointer',
            }}
          />
        </div>

        {/* Карточка 2 - Лаба / Искусство (29:434) */}
        <div style={{
          position: 'absolute',
          left: '141px',
          top: '726px',
          width: '894px',
          height: '250px',
        }}>
          {/* Индикатор зелёный */}
          <div style={{
            position: 'absolute',
            left: '26px',
            top: '28px',
            width: '38px',
            height: '38px',
          }}>
            <div style={{
              position: 'absolute',
              left: '50%',
              top: 0,
              transform: 'translateX(-50%)',
              width: '38px',
              height: '38px',
              backdropFilter: 'blur(50px)',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '30px',
            }} />
            <div style={{
              position: 'absolute',
              left: '50%',
              top: '11px',
              transform: 'translateX(-50%)',
              width: '16px',
              height: '16px',
              backdropFilter: 'blur(50px)',
              background: '#d5fc44',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '30px',
            }} />
          </div>

          {/* Фон лаба - левая половина */}
          <div style={{
            position: 'absolute',
            inset: '0 49.78% 0.4% 0',
          }}>
            <img 
              src={labaBg}
              alt=""
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '30px',
              }}
            />
          </div>

          {/* Текст справа - черная карточка */}
          <div style={{
            position: 'absolute',
            inset: '0.4% 0 0 50.22%',
            backdropFilter: 'blur(50px)',
            background: 'black',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '30px',
            overflow: 'clip',
          }}>
            <div style={{
              position: 'absolute',
              inset: '8.43% 4% 8.43% 4%',
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
                Курс «Система» — про то, как выстраивать процессы, а не тушить пожары. Ты собираешь понятную логику: цель → действия → результат, без хаоса и лишних шагов. На выходе — рабочая система, которую можно повторять и масштабировать.
              </p>
            </div>
          </div>

          {/* Шторка покороче */}
          <div style={{
            position: 'absolute',
            inset: '0.4% 0 0 80.45%',
            backdropFilter: 'blur(50px)',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '30px',
            overflow: 'clip',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{
              fontSize: '30px',
              color: 'white',
            }}>
              →
            </div>
          </div>

          {/* Кнопка "изучить" */}
          <img 
            src={studyButton}
            alt="изучить"
            onClick={() => navigate('/academy-lesson-video')}
            style={{
              position: 'absolute',
              left: '96px',
              top: '86px',
              width: '257px',
              height: '73px',
              cursor: 'pointer',
            }}
          />
        </div>

        {/* Карточка 3 - Цех / Промптинг (29:433) */}
        <div style={{
          position: 'absolute',
          left: '141px',
          top: '1041px',
          width: '894px',
          height: '249px',
        }}>
          {/* Индикатор оранжевый */}
          <div style={{
            position: 'absolute',
            left: '28px',
            top: '14px',
            width: '36px',
            height: '36px',
          }}>
            <div style={{
              position: 'absolute',
              left: '50%',
              top: 0,
              transform: 'translateX(-50%)',
              width: '38px',
              height: '38px',
              backdropFilter: 'blur(50px)',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '30px',
            }} />
            <div style={{
              position: 'absolute',
              left: '50%',
              top: '11px',
              transform: 'translateX(-50%)',
              width: '16px',
              height: '16px',
              backdropFilter: 'blur(50px)',
              background: '#f8d050',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '30px',
            }} />
          </div>

          {/* Фон цех - левая половина */}
          <div style={{
            position: 'absolute',
            inset: '0 49.68% 0 0',
          }}>
            <img 
              src={tsekhBg}
              alt=""
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '30px',
              }}
            />
          </div>

          {/* Текст справа - черная карточка */}
          <div style={{
            position: 'absolute',
            inset: '0 0 0 50.32%',
            backdropFilter: 'blur(50px)',
            background: 'black',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '30px',
            overflow: 'clip',
          }}>
            <div style={{
              position: 'absolute',
              inset: '8.43% 4% 8.43% 4%',
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
                Курс «Система» — про то, как выстраивать процессы, а не тушить пожары. Ты собираешь понятную логику: цель → действия → результат, без хаоса и лишних шагов. На выходе — рабочая система, которую можно повторять и масштабировать.
              </p>
            </div>
          </div>

          {/* Кнопка "изучить" */}
          <img 
            src={studyButton}
            alt="изучить"
            onClick={() => navigate('/academy-course-prompting')}
            style={{
              position: 'absolute',
              left: '96px',
              top: '85px',
              width: '257px',
              height: '73px',
              cursor: 'pointer',
            }}
          />
        </div>

        {/* Карточка 4 - Полигон / Автоматизация (29:432) */}
        <div style={{
          position: 'absolute',
          left: '141px',
          top: '1355px',
          width: '894px',
          height: '249px',
        }}>
          {/* Индикатор оранжевый */}
          <div style={{
            position: 'absolute',
            left: '26px',
            top: '14px',
            width: '36px',
            height: '36px',
          }}>
            <div style={{
              position: 'absolute',
              left: '50%',
              top: 0,
              transform: 'translateX(-50%)',
              width: '38px',
              height: '38px',
              backdropFilter: 'blur(50px)',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '30px',
            }} />
            <div style={{
              position: 'absolute',
              left: '50%',
              top: '11px',
              transform: 'translateX(-50%)',
              width: '16px',
              height: '16px',
              backdropFilter: 'blur(50px)',
              background: '#f8d050',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '30px',
            }} />
          </div>

          {/* Фон полигон - левая половина */}
          <div style={{
            position: 'absolute',
            inset: '0 50.05% 0 0',
          }}>
            <img 
              src={poligonBg}
              alt=""
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '30px',
              }}
            />
          </div>

          {/* Текст справа - черная карточка */}
          <div style={{
            position: 'absolute',
            inset: '0 0 0 49.97%',
            backdropFilter: 'blur(50px)',
            background: 'black',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '30px',
            overflow: 'clip',
          }}>
            <div style={{
              position: 'absolute',
              inset: '8.43% 4% 8.43% 4%',
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
                Курс «Система» — про то, как выстраивать процессы, а не тушить пожары. Ты собираешь понятную логику: цель → действия → результат, без хаоса и лишних шагов. На выходе — рабочая система, которую можно повторять и масштабировать.
              </p>
            </div>
          </div>

          {/* Кнопка "изучить" */}
          <img 
            src={studyButton}
            alt="изучить"
            onClick={() => navigate('/academy-course-automation')}
            style={{
              position: 'absolute',
              left: '98px',
              top: '85px',
              width: '257px',
              height: '73px',
              cursor: 'pointer',
            }}
          />
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
