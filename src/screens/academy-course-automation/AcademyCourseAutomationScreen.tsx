import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAcademyCourses, getAcademyLessons } from '../../utils/contentApi';
import type { AcademyLesson } from '../../types/content';

// Images
import bgPattern from '../../assets/figma-welcome/pattern.png';
import logoSmall from '../../assets/figma-welcome/logo-small.png';
import logoFooter from '../../assets/figma-welcome/logo-footer.png';
import socialsIcons from '../../assets/welcome-elements/socials-icons.png';
import supportButton from '../../assets/tour-video/support-button.png';
import peopleLogo from '../../assets/about-screens/лого люди на фон.png';
import goButton from '../../assets/main-dashboard/кнопка перейти.png';

export const AcademyCourseAutomationScreen: React.FC = () => {
  const navigate = useNavigate();
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;

  const [lessons, setLessons] = useState<AcademyLesson[]>([]);
  const [, setLoading] = useState(true);

  useEffect(() => {
    loadLessons();
  }, []);

  const loadLessons = async () => {
    setLoading(true);
    try {
      // Сначала получаем курс по типу
      const courseResult = await getAcademyCourses({ courseType: 'автоматизация', isActive: true });
      if (courseResult.error || !courseResult.data || courseResult.data.length === 0) {
        console.error('Course not found');
        return;
      }
      
      const courseId = courseResult.data[0].id;
      
      // Теперь получаем уроки по ID курса
      const result = await getAcademyLessons(courseId, { isActive: true });
      if (!result.error && result.data) {
        setLessons(result.data);
      }
    } catch (error) {
      console.error('Error loading lessons:', error);
    } finally {
      setLoading(false);
    }
  };

  const lessonPositions = [
    { left: 'calc(50% - 236.5px)', top: '430px', numberLeft: 'calc(50% - 449px)', numberTop: '402px' },
    { left: 'calc(50% + 232.5px)', top: '535px', numberLeft: 'calc(50% + 20px)', numberTop: '507px' },
    { left: 'calc(50% - 236.5px)', top: '797px', numberLeft: 'calc(50% - 449px)', numberTop: '769px' },
    { left: 'calc(50% + 232.5px)', top: '914px', numberLeft: 'calc(50% + 20px)', numberTop: '886px' },
    { left: 'calc(50% - 236.5px)', top: '1176px', numberLeft: 'calc(50% - 449px)', numberTop: '1148px' },
    { left: 'calc(50% + 232.5px)', top: '1293px', numberLeft: 'calc(50% + 20px)', numberTop: '1265px' },
    { left: 'calc(50% - 235.5px)', top: '1566px', numberLeft: 'calc(50% - 449px)', numberTop: '1538px' },
    { left: 'calc(50% + 232.5px)', top: '1683px', numberLeft: 'calc(50% + 20px)', numberTop: '1655px' },
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
          inset: 0,
          backgroundImage: `url(${bgPattern})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'repeat',
        }} />

        {/* Header */}
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

        {/* Заголовок */}
        <div style={{
          position: 'absolute',
          left: '85px',
          top: '177px',
          width: '1020px',
          height: '160px',
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
            <p style={{ margin: 0, lineHeight: '1' }}>уроки курса «автоматизация»</p>
          </div>
        </div>

        {/* Подзаголовок */}
        <div style={{
          position: 'absolute',
          left: '91px',
          top: '353px',
          width: '915px',
          height: '40px',
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
              <span style={{ fontFamily: 'Gotham Pro', fontWeight: 300 }}>научишься всем азам работы с нейронками</span>
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

        {/* Карточки уроков из API */}
        {lessons.map((lesson, index) => {
            const position = lessonPositions[index];
            if (!position) return null;
            
            return (
              <React.Fragment key={lesson.id}>
                {/* Карточка урока */}
                <div className="blur-wave" style={{
                  position: 'absolute',
                  left: position.left,
                  top: position.top,
                  transform: 'translateX(-50%)',
                  width: index === 6 ? '427px' : '425px',
                  height: '317px',
                  backdropFilter: 'blur(50px)',
                  background: 'black',
                  border: '4px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '30px',
                  overflow: 'clip',
                }}>
                  {/* Текст описания */}
                  <div style={{
                    position: 'absolute',
                    top: '26px',
                    left: '18px',
                    right: '18px',
                    bottom: '130px',
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
                      {lesson.description || lesson.annotation || 'Описание урока'}
                    </p>
                  </div>

                  {/* Кнопка "перейти" */}
                  <img 
                    src={goButton}
                    alt="перейти"
                    onClick={() => navigate(`/academy-lesson-video?lesson=${lesson.id}`)}
                    className="button-inner-glow"
                    style={{
                      position: 'absolute',
                      left: '50%',
                      bottom: '26px',
                      transform: 'translateX(-50%)',
                      width: '257px',
                      height: '73px',
                      cursor: 'pointer',
                    }}
                  />
                </div>

                {/* Номер урока - ПОВЕРХ карточки */}
                <div className="blur-wave" style={{
                  position: 'absolute',
                  left: position.numberLeft,
                  top: position.numberTop,
                  transform: 'translateX(-50%)',
                  width: '56px',
                  height: '56px',
                  backdropFilter: 'blur(50px)',
                  background: 'black',
                  border: index === 3 ? '1px solid rgba(255, 255, 255, 0.3)' : '4px solid rgba(255, 255, 255, 0.3)',
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
                    fontSize: '32px',
                    lineHeight: 0,
                    color: 'white',
                  }}>
                    <p style={{ margin: 0, lineHeight: '1' }}>{lesson.lesson_number || index + 1}</p>
                  </div>
                </div>
              </React.Fragment>
            );
          })}

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
