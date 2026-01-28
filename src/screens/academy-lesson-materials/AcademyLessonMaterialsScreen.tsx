import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getAcademyLessonById, getDemoLessonById } from '../../utils/contentApi';
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
import expandButton from '../../assets/кнопка развернуть.png';

export const AcademyLessonMaterialsScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const lessonId = searchParams.get('lesson');
  const lessonType = searchParams.get('type') || 'academy';
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;

  const [lesson, setLesson] = useState<AcademyLesson | null>(null);
  const [, setLoading] = useState(true);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const checkLessonCompletion = (id: string) => {
    const progressData = JSON.parse(localStorage.getItem('academy-lessons-progress') || '{}');
    const lessonProgress = progressData[id];
    
    if (lessonProgress?.videoWatched && lessonProgress?.materialsRead) {
      const completed = JSON.parse(localStorage.getItem('academy-lessons-completed') || '[]');
      if (!completed.includes(id)) {
        completed.push(id);
        localStorage.setItem('academy-lessons-completed', JSON.stringify(completed));
      }
    }
  };

  const handleScroll = () => {
    if (!scrollRef.current || !lessonId || lessonType !== 'academy') return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const scrollPercent = ((scrollTop + clientHeight) / scrollHeight) * 100;
    
    if (scrollPercent >= 95) {
      const progressData = JSON.parse(localStorage.getItem('academy-lessons-progress') || '{}');
      if (!progressData[lessonId]) progressData[lessonId] = {};
      progressData[lessonId].materialsRead = true;
      localStorage.setItem('academy-lessons-progress', JSON.stringify(progressData));
      checkLessonCompletion(lessonId);
    }
  };

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
      const result = lessonType === 'demo'
        ? await getDemoLessonById(id)
        : await getAcademyLessonById(id);
      if (!result.error && result.data) {
        setLesson(result.data);
      }
    } catch (error) {
      console.error('Error loading lesson:', error);
    } finally {
      setLoading(false);
    }
  };

  // Обратная совместимость: если нет content_blocks, создаем из старых полей
  const getContentBlocks = () => {
    if (lesson?.content_blocks && lesson.content_blocks.length > 0) {
      return lesson.content_blocks;
    }
    
    const legacyBlocks: any[] = [];
    
    if (lesson?.annotation) {
      legacyBlocks.push({
        id: 'legacy-text',
        type: 'text',
        content: lesson.annotation,
      });
    }
    
    if (lesson?.prompt_text) {
      legacyBlocks.push({
        id: 'legacy-prompt',
        type: 'prompt',
        content: lesson.prompt_text,
      });
    }
    
    return legacyBlocks;
  };
  
  const contentBlocks = getContentBlocks();

  // Функция для отправки материалов в бота
  const handleSendMaterials = async () => {
    // Берем materials из content_blocks
    const materialsBlock = lesson?.content_blocks?.find((b: any) => b.type === 'materials');
    if (!materialsBlock) return;
    
    let materials = [];
    try {
      materials = JSON.parse(materialsBlock.content);
    } catch {
      return;
    }
    
    if (materials.length === 0) return;
    
    try {
      const response = await fetch('https://metaflora-service.ru/api/bot/send-materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materials,
          lessonTitle: lesson?.title || 'Урок',
          userId: (window.Telegram?.WebApp as any)?.initDataUnsafe?.user?.id || 'unknown',
        }),
      });
      
      if (response.ok) {
        alert('материалы отправлены в чат с ботом');
      } else {
        alert('Ошибка отправки материалов');
      }
    } catch (error) {
      console.error('Error sending materials:', error);
      alert('Ошибка: ' + error);
    }
  };

  // Рендер блока контента - СКОПИРОВАНО ИЗ ПОЛИГОНА
  const renderContentBlock = (block: any) => {
    switch (block.type) {
      case 'text':
        return (
          <div
            key={block.id}
            style={{
              fontSize: '35px',
              fontFamily: 'Gotham Pro',
              fontWeight: 300,
              color: 'white',
              textAlign: 'center',
              minHeight: '50px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              lineHeight: 1.3,
              marginBottom: '30px',
            }}
          >
            {block.content}
          </div>
        );

      case 'image':
        const expandImage = () => {
          const win = window.open('', '_blank');
          if (win) {
            win.document.write(`
              <html>
                <head>
                  <title>Изображение</title>
                  <style>
                    body { margin: 0; background: black; display: flex; align-items: center; justify-content: center; height: 100vh; }
                    img { max-width: 100%; max-height: 100vh; object-fit: contain; }
                  </style>
                </head>
                <body><img src="${block.content}" /></body>
              </html>
            `);
          }
        };
        
        return (
          <div
            key={block.id}
            style={{
              width: '100%',
              position: 'relative',
              marginTop: '30px',
              marginBottom: '30px',
            }}
          >
            <div 
              onClick={expandImage}
              style={{
                width: '100%',
                border: '2px solid rgba(0, 0, 0, 0.3)',
                borderRadius: '20px',
                overflow: 'hidden',
                position: 'relative',
                cursor: 'pointer',
              }}
            >
              <img
                src={block.content}
                alt="Изображение"
                style={{
                  width: '100%',
                  height: 'auto',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            </div>
            <img
              src={expandButton}
              alt="развернуть"
              onClick={(e) => {
                e.stopPropagation();
                expandImage();
              }}
              className="button-inner-glow"
              style={{
                position: 'absolute',
                right: '20px',
                bottom: '20px',
                width: '50px',
                height: '50px',
                cursor: 'pointer',
                zIndex: 1000,
              }}
            />
          </div>
        );

      case 'prompt':
        return (
          <div key={block.id} style={{ marginBottom: '30px', marginTop: '30px' }}>
            <img
              src={promptButton}
              alt="промпт"
              className="button-inner-glow"
              style={{
                width: '247px',
                height: '79px',
                margin: '0 auto 20px auto',
                display: 'block',
                objectFit: 'contain',
              }}
            />
            <div
              style={{
                fontSize: '35px',
                fontFamily: 'Gotham Pro',
                fontWeight: 300,
                color: 'white',
                textAlign: 'center',
                minHeight: '50px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                lineHeight: 1.3,
              }}
            >
              {block.content}
            </div>
          </div>
        );

      case 'materials':
        let materialsCount = 0;
        try {
          const parsed = JSON.parse(block.content);
          materialsCount = Array.isArray(parsed) ? parsed.length : 0;
        } catch {
          materialsCount = parseInt(block.content) || 0;
        }

        return (
          <div key={block.id} style={{ marginTop: '30px', marginBottom: '30px' }}>
            <img
              src={materialsButton}
              alt="материалы"
              className="button-inner-glow"
              style={{
                width: '247px',
                height: '79px',
                margin: '0 auto 20px auto',
                display: 'block',
                objectFit: 'contain',
              }}
            />
            <div
              onClick={handleSendMaterials}
              style={{
                fontFamily: 'Gotham Pro',
                fontWeight: 500,
                fontSize: '32px',
                lineHeight: 1,
                color: 'white',
                textAlign: 'center',
                cursor: 'pointer',
              }}
            >
              скачать файлы ({materialsCount})
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderedBlocks = contentBlocks.map((block: any) => renderContentBlock(block));

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
          height: '1536px',
          backdropFilter: 'blur(50px)',
          background: 'black',
          border: '4px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '30px',
          overflow: 'hidden',
        }}>
          {/* Контент с скроллом И ФЕЙДОМ - СКОПИРОВАНО ИЗ ПОЛИГОНА */}
          <div 
            ref={scrollRef}
            onScroll={handleScroll}
            style={{
              position: 'absolute',
              inset: 0,
              overflowY: 'auto',
              padding: '40px',
              paddingBottom: '120px',
              WebkitMaskImage: 'linear-gradient(to bottom, black calc(100% - 80px), transparent 100%)',
              maskImage: 'linear-gradient(to bottom, black calc(100% - 80px), transparent 100%)',
            }}
          >
            {/* Заголовок */}
            <h2 style={{
              fontFamily: 'Inter',
              fontWeight: 700,
              fontSize: '52px',
              lineHeight: 1,
              color: 'white',
              textAlign: 'center',
              margin: '0 0 50px 0',
            }}>
              {lesson?.title || 'морфинг через общие элементы'}
            </h2>

            {/* Динамический рендер content_blocks */}
            {renderedBlocks}
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
