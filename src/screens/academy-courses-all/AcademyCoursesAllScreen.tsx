import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAcademyCourses, getAcademyLessons } from '../../utils/contentApi';

// Images
import bgPattern from '../../assets/figma-welcome/pattern.png';
import logoSmall from '../../assets/figma-welcome/logo-small.png';
import logoFooter from '../../assets/figma-welcome/logo-footer.png';
import socialsIcons from '../../assets/welcome-elements/socials-icons.png';
import supportButton from '../../assets/tour-video/support-button.png';
import academyBg from '../../assets/main-dashboard/фон академия.png';
import labaBg from '../../assets/main-dashboard/фон лаба.png';
import tsekhBg from '../../assets/main-dashboard/фон цех.png';
import poligonBg from '../../assets/main-dashboard/фон полигон.png';
import studyButton from '../../assets/about-screens/кнопка изучить.png';
import peopleLogo from '../../assets/about-screens/лого люди на фон.png';

export const AcademyCoursesAllScreen: React.FC = () => {
  const navigate = useNavigate();
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;
  
  const [totalLessons, setTotalLessons] = useState(0);
  const [completedLessons, setCompletedLessons] = useState(0);
  const [courseStatuses, setCourseStatuses] = useState<{[key: string]: 'not_started' | 'in_progress' | 'completed'}>({});

  useEffect(() => {
    calculateProgress();
    
    // Пересчитывать при возврате на экран
    const handleFocus = () => calculateProgress();
    window.addEventListener('focus', handleFocus);
    
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const calculateProgress = async () => {
    try {
      const courseTypes = ['искусство', 'промптинг', 'система', 'автоматизация'];
      const completedLessonIds = JSON.parse(localStorage.getItem('academy-lessons-completed') || '[]');
      
      let total = 0;
      const statuses: {[key: string]: 'not_started' | 'in_progress' | 'completed'} = {};
      
      for (const courseType of courseTypes) {
        const courseResult = await getAcademyCourses({ courseType, isActive: true });
        if (!courseResult.data || courseResult.data.length === 0) continue;
        
        const courseId = courseResult.data[0].id;
        const lessonsResult = await getAcademyLessons(courseId, { isActive: true });
        const lessons = lessonsResult.data || [];
        
        total += lessons.length;
        
        const completedInCourse = lessons.filter(l => completedLessonIds.includes(l.id)).length;
        
        if (completedInCourse === 0) {
          statuses[courseType] = 'not_started';
        } else if (completedInCourse === lessons.length && lessons.length > 0) {
          statuses[courseType] = 'completed';
        } else {
          statuses[courseType] = 'in_progress';
        }
      }
      
      setTotalLessons(total);
      setCompletedLessons(completedLessonIds.length);
      setCourseStatuses(statuses);
    } catch (error) {
      console.error('Error calculating progress:', error);
    }
  };

  const percentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const getCourseColor = (courseType: string) => {
    const status = courseStatuses[courseType];
    if (status === 'completed') return '#d5fc44';
    if (status === 'in_progress') return '#f8d050';
    return '#dc2626';
  };

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
        />        {/* Логотип маленький */}
        <div 
          onClick={() => navigate('/main-dashboard-premium')}
          style={{
            position: 'absolute',
            left: '500px',
            top: '61px',
            width: '186px',
            height: '131px',
            cursor: 'pointer',
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
              <span style={{ fontFamily: 'Gotham Pro', fontWeight: 700 }}>{percentage}% уроков академии. </span>
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

          {/* Текст справа - черная карточка */}
          <div className="blur-wave" style={{
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
              fontSize: '27px',
              lineHeight: '1.1',
              color: 'white',
              textAlign: 'center',
            }}>
              <p style={{ margin: 0 }}>
                Курс «Система» — про то, как выстраивать процессы, а не тушить пожары. Ты собираешь понятную логику: цель → действия → результат, без хаоса и лишних шагов. На выходе
              </p>
            </div>
          </div>

          {/* Кнопка "изучить" */}
          <img 
            src={studyButton}
            alt="изучить"
            onClick={() => navigate('/academy-course-system')}
            className="button-inner-glow"
            style={{
              position: 'absolute',
              left: '96px',
              top: '91px',
              width: '247px',
              height: '79px',
              cursor: 'pointer',
              zIndex: 10,
            }}
          />

          {/* Индикатор прогресса (29:521) - ПОВЕРХ */}
          <div style={{
            position: 'absolute',
            left: '27px',
            top: '32px',
            width: '36px',
            height: '36px',
            zIndex: 20,
          }}>
            <div className="blur-wave" style={{
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
            <div className="blur-wave" style={{
              position: 'absolute',
              left: '50%',
              top: '11px',
              transform: 'translateX(-50%)',
              width: '16px',
              height: '16px',
              backdropFilter: 'blur(50px)',
              background: getCourseColor('система'),
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '30px',
            }} />
          </div>
        </div>

        {/* Карточка 2 - Лаба / Искусство (29:434) */}
        <div style={{
          position: 'absolute',
          left: '141px',
          top: '726px',
          width: '894px',
          height: '250px',
        }}>
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
          <div className="blur-wave" style={{
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
              fontSize: '27px',
              lineHeight: '1.1',
              color: 'white',
              textAlign: 'center',
            }}>
              <p style={{ margin: 0 }}>
                Курс «Система» — про то, как выстраивать процессы, а не тушить пожары. Ты собираешь понятную логику: цель → действия → результат, без хаоса и лишних шагов. На выходе
              </p>
            </div>
          </div>

          {/* Кнопка "изучить" */}
          <img 
            src={studyButton}
            alt="изучить"
            onClick={() => navigate('/academy-course-art')}
            className="button-inner-glow"
            style={{
              position: 'absolute',
              left: '96px',
              top: '86px',
              width: '247px',
              height: '79px',
              cursor: 'pointer',
              zIndex: 10,
            }}
          />

          {/* Индикатор прогресса (29:506) - ПОВЕРХ */}
          <div style={{
            position: 'absolute',
            left: '26px',
            top: '27px',
            width: '38px',
            height: '38px',
            zIndex: 20,
          }}>
            <div className="blur-wave" style={{
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
            <div className="blur-wave" style={{
              position: 'absolute',
              left: '50%',
              top: '11px',
              transform: 'translateX(-50%)',
              width: '16px',
              height: '16px',
              backdropFilter: 'blur(50px)',
              background: getCourseColor('искусство'),
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '30px',
            }} />
          </div>
        </div>

        {/* Карточка 3 - Цех / Промптинг (29:433) */}
        <div style={{
          position: 'absolute',
          left: '141px',
          top: '1041px',
          width: '894px',
          height: '249px',
        }}>
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
          <div className="blur-wave" style={{
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
              fontSize: '27px',
              lineHeight: '1.1',
              color: 'white',
              textAlign: 'center',
            }}>
              <p style={{ margin: 0 }}>
                Курс «Система» — про то, как выстраивать процессы, а не тушить пожары. Ты собираешь понятную логику: цель → действия → результат, без хаоса и лишних шагов. На выходе
              </p>
            </div>
          </div>

          {/* Кнопка "изучить" */}
          <img 
            src={studyButton}
            alt="изучить"
            onClick={() => navigate('/academy-course-prompting')}
            className="button-inner-glow"
            style={{
              position: 'absolute',
              left: '96px',
              top: '85px',
              width: '247px',
              height: '79px',
              cursor: 'pointer',
              zIndex: 10,
            }}
          />

          {/* Индикатор прогресса (29:552) - ПОВЕРХ */}
          <div style={{
            position: 'absolute',
            left: '28px',
            top: '27px',
            width: '36px',
            height: '36px',
            zIndex: 20,
          }}>
            <div className="blur-wave" style={{
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
            <div className="blur-wave" style={{
              position: 'absolute',
              left: '50%',
              top: '11px',
              transform: 'translateX(-50%)',
              width: '16px',
              height: '16px',
              backdropFilter: 'blur(50px)',
              background: getCourseColor('промптинг'),
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '30px',
            }} />
          </div>
        </div>

        {/* Карточка 4 - Полигон / Автоматизация (29:432) */}
        <div style={{
          position: 'absolute',
          left: '141px',
          top: '1355px',
          width: '894px',
          height: '249px',
        }}>
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
          <div className="blur-wave" style={{
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
              fontSize: '27px',
              lineHeight: '1.1',
              color: 'white',
              textAlign: 'center',
            }}>
              <p style={{ margin: 0 }}>
                Курс «Система» — про то, как выстраивать процессы, а не тушить пожары. Ты собираешь понятную логику: цель → действия → результат, без хаоса и лишних шагов. На выходе
              </p>
            </div>
          </div>

          {/* Кнопка "изучить" */}
          <img 
            src={studyButton}
            alt="изучить"
            onClick={() => navigate('/academy-course-automation')}
            className="button-inner-glow"
            style={{
              position: 'absolute',
              left: '98px',
              top: '85px',
              width: '247px',
              height: '79px',
              cursor: 'pointer',
              zIndex: 10,
            }}
          />

          {/* Индикатор прогресса (29:551) - ПОВЕРХ */}
          <div style={{
            position: 'absolute',
            left: '26px',
            top: '27px',
            width: '36px',
            height: '36px',
            zIndex: 20,
          }}>
            <div className="blur-wave" style={{
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
            <div className="blur-wave" style={{
              position: 'absolute',
              left: '50%',
              top: '11px',
              transform: 'translateX(-50%)',
              width: '16px',
              height: '16px',
              backdropFilter: 'blur(50px)',
              background: getCourseColor('автоматизация'),
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '30px',
            }} />
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
