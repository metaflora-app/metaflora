import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getAcademyLessonById } from '../../utils/contentApi';
import type { AcademyLesson } from '../../types/content';

// Images
import bgPattern from '../../assets/figma-welcome/pattern.png';
import logoSmall from '../../assets/figma-welcome/logo-small.png';
import logoFooter from '../../assets/figma-welcome/logo-footer.png';
import socialsIcons from '../../assets/welcome-elements/socials-icons.png';
import supportButton from '../../assets/tour-video/support-button.png';
import peopleLogo from '../../assets/about-screens/лого люди на фон.png';
import promptButton from '../../assets/about-screens/промпт плашка.png';
import materialsButton from '../../assets/about-screens/кнопка материалы.png';

export const AcademyLessonMaterialsScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const lessonId = searchParams.get('lesson');
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;

  const [lesson, setLesson] = useState<AcademyLesson | null>(null);
  const [, setLoading] = useState(true);

  useEffect(() => {
    if (lessonId) {
      loadLesson(lessonId);
    } else {
      setLoading(false);
    }
  }, [lessonId]);

  const loadLesson = async (id: string) => {
    setLoading(true);
    try {
      const result = await getAcademyLessonById(id);
      if (!result.error && result.data) {
        setLesson(result.data);
      }
    } catch (error) {
      console.error('Error loading lesson:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      height: '100vh',
      background: '#020101',
      overflow: 'hidden',
    }}>
      {/* Scaled container */}
      <div style={{
        position: 'relative',
        width: '1180px',
        height: '2550px',
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

        {/* Заголовок "материалы урока" */}
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
            lineHeight: 1,
            color: 'white',
          }}>
            <p style={{ margin: 0, lineHeight: '1' }}>материалы урока</p>
          </div>
        </div>

        {/* Подзаголовок */}
        <div style={{
          position: 'absolute',
          left: '85px',
          top: '292px',
          width: '880px',
          height: '104px',
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            fontSize: '40px',
            lineHeight: 1,
            color: 'white',
          }}>
            <p style={{ margin: 0, lineHeight: '1' }}>
              <span style={{ fontFamily: 'Gotham Pro', fontWeight: 700 }}>внутри: </span>
              <span style={{ fontFamily: 'Gotham Pro', fontWeight: 300 }}>саммари урока, использованные промпты, файлы генераций</span>
            </p>
          </div>
        </div>

        {/* Лого "люди на фоне" */}
        <div style={{
          position: 'absolute',
          inset: '38.39% 11.78% 23.69% 12.37%',
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            pointerEvents: 'none',
          }}>
            <img 
              src={peopleLogo}
              alt="МЕТАФЛОРА*"
              style={{
                position: 'absolute',
                height: '105.83%',
                left: '-10.74%',
                top: '-0.86%',
                width: '113.22%',
                maxWidth: 'none',
              }}
            />
          </div>
        </div>

        {/* Белая подложка (32:710) */}
        <div className="blur-wave" style={{
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

        {/* Черная карточка (32:840) - внутри белой подложки */}
        <div className="blur-wave" style={{
          position: 'absolute',
          left: '141px',
          top: '452px',
          width: '898px',
          minHeight: '1536px',
          backdropFilter: 'blur(50px)',
          background: 'black',
          border: '4px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '30px',
        }} />

        {/* Заголовок из API */}
        <div style={{
          position: 'absolute',
          left: '356px',
          top: '485px',
          width: '469px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          fontFamily: 'Inter',
          fontWeight: 700,
          fontSize: '52px',
          lineHeight: 0,
          color: 'white',
          textAlign: 'center',
        }}>
          <p style={{ margin: 0, lineHeight: 1, whiteSpace: 'pre-wrap' }}>
            {lesson?.title || 'морфинг через общие элементы'}
          </p>
        </div>

        {/* Аннотация из API */}
        <p style={{
          position: 'absolute',
          left: '200px',
          top: '633px',
          width: '781px',
          margin: 0,
          fontFamily: 'Gotham Pro',
          fontWeight: 300,
          fontSize: '35px',
          lineHeight: 1,
          color: 'white',
          textAlign: 'center',
          whiteSpace: 'pre-wrap',
        }}>
          {lesson?.annotation || 'идея в том, чтобы в конце одного кадра был объект, похожий по форме или цвету на объект в начале следующего.'}
        </p>

        {/* Плашка промпт (показываем если есть промпт) */}
        {lesson?.prompt_text && (
          <>
            <img 
              src={promptButton}
              alt="промпт"
              className="button-inner-glow"
              style={{
                position: 'absolute',
                left: '467px',
                top: '848px',
                width: '246.93px',
                height: '79.25px',
                objectFit: 'contain',
              }}
            />

            {/* Текст промпта из API */}
            <div style={{
              position: 'absolute',
              left: '193px',
              top: '968px',
              width: '795px',
              fontFamily: 'Gotham Pro',
              fontWeight: 300,
              fontSize: '35px',
              lineHeight: 1.3,
              color: 'white',
              textAlign: 'center',
              whiteSpace: 'pre-wrap',
            }}>
              <p style={{ margin: 0 }}>{lesson.prompt_text}</p>
            </div>
          </>
        )}

        {/* Плашка материалы (показываем если есть материалы) */}
        {lesson?.materials && lesson.materials.length > 0 && (
          <>
            <img 
              src={materialsButton}
              alt="материалы"
              className="button-inner-glow"
              style={{
                position: 'absolute',
                left: '467px',
                top: '1781px',
                width: '246.93px',
                height: '79.25px',
                objectFit: 'contain',
              }}
            />

            {/* Текст "скачать файлы" */}
            <div 
              onClick={async () => {
                if (!lesson?.materials || lesson.materials.length === 0) return;
                
                try {
                  const response = await fetch('https://metaflora-service-production.up.railway.app/api/bot/send-materials', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      materials: lesson.materials,
                      lessonTitle: lesson.title,
                      userId: (window.Telegram?.WebApp as any)?.initDataUnsafe?.user?.id || 'unknown',
                    }),
                  });
                  
                  if (response.ok) {
                    if (window.Telegram?.WebApp?.showPopup) {
                      window.Telegram.WebApp.showPopup({
                        message: 'Материалы отправлены в чат с ботом',
                      });
                    }
                  }
                } catch (error) {
                  console.error('Error sending materials:', error);
                }
              }}
              style={{
                position: 'absolute',
                left: '432px',
                top: '1895px',
                width: '316px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                fontFamily: 'Gotham Pro',
                fontWeight: 500,
                fontSize: '32px',
                lineHeight: 0,
                color: 'white',
                textAlign: 'center',
                cursor: 'pointer',
              }}>
              <p style={{ margin: 0, lineHeight: 1, whiteSpace: 'pre-wrap' }}>
                скачать файлы ({lesson?.materials?.length || 0})
              </p>
            </div>
          </>
        )}


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
            lineHeight: '1',
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
