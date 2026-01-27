import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getPolygonArticleById } from '../../utils/contentApi';
import type { PolygonArticle } from '../../types/content';

// Images
import bgPattern from '../../assets/figma-welcome/pattern.png';
import logoSmall from '../../assets/figma-welcome/logo-small.png';
import supportButton from '../../assets/tour-video/support-button.png';
import promptButton from '../../assets/about-screens/промпт плашка.png';
import materialsButton from '../../assets/about-screens/кнопка материалы.png';
import expandButton from '../../assets/кнопка развернуть.png';

// Figma assets
const logoFooterImg = "https://www.figma.com/api/mcp/asset/83bbfd9e-39b1-4eee-a1c6-18121694291e";
const socialsImg = "https://www.figma.com/api/mcp/asset/16f3197d-c198-4ab6-a00b-d05fe08fa6cf";
const peopleCircleImg = "https://www.figma.com/api/mcp/asset/ff88c2f3-4c40-4ea4-81fc-b9b478d773e0";

export const ArticleScreen: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;
  
  const [article, setArticle] = useState<PolygonArticle | null>(null);
  const [, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadArticle(id);
    } else {
      setLoading(false);
    }
  }, [id]);

  const loadArticle = async (articleId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getPolygonArticleById(articleId);

      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.data) {
        throw new Error('Статья не найдена');
      }

      setArticle(result.data);
    } catch (err) {
      console.error('Error loading article:', err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const articleTitle = article?.title || 'морфинг через общие элементы';
  
  // Обратная совместимость: если нет content_blocks, создаем из старых полей
  const getContentBlocks = () => {
    if (article?.content_blocks && article.content_blocks.length > 0) {
      return article.content_blocks;
    }
    
    // Создаем блоки из старых полей для обратной совместимости
    const legacyBlocks: any[] = [];
    
    if (article?.content_text) {
      legacyBlocks.push({
        id: 'legacy-text',
        type: 'text',
        content: article.content_text,
      });
    }
    
    if (article?.prompt_text) {
      legacyBlocks.push({
        id: 'legacy-prompt',
        type: 'prompt',
        content: article.prompt_text,
      });
    }
    
    return legacyBlocks;
  };
  
  const contentBlocks = getContentBlocks();

  // Функция для отправки материалов в бота
  const handleSendMaterials = async () => {
    if (!article?.id) return;
    
    try {
      const response = await fetch(`https://metaflora-service-production.up.railway.app/api/bot/send-materials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          articleId: article.id,
          userId: 'telegram_user_id', // TODO: получить из Telegram WebApp
        }),
      });

      if (response.ok) {
        alert('Материалы отправлены в бота!');
      } else {
        alert('Ошибка при отправке материалов');
      }
    } catch (error) {
      console.error('Error sending materials:', error);
      alert('Ошибка при отправке материалов');
    }
  };

  // Рендер блока контента - ОТНОСИТЕЛЬНОЕ ПОЗИЦИОНИРОВАНИЕ
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
                minHeight: '362px',
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
            {/* Кнопка развернуть - ПОВЕРХ контейнера */}
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
          <div key={block.id} style={{ marginBottom: '30px', marginTop: '40px' }}>
            <img
              src={promptButton}
              alt="промпт"
              className="button-inner-glow"
              style={{
                width: '247px',
                height: '79px',
                margin: '0 auto 30px auto',
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
        // Парсим количество материалов из content (формат: "N" или JSON)
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

  // Рендерим блоки - просто map без offset
  const renderedBlocks = contentBlocks.map((block) => renderContentBlock(block));

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
          inset: 0,
          backgroundImage: `url(${bgPattern})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'repeat',
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
            <span style={{ fontWeight: 300 }}> «{articleTitle}»</span>
          </p>
        </div>

        {/* Превью карточки - ТОЧНО КАК В СЕРВИСЕ */}
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
          zIndex: 10,
        }}>
          {/* Черный фон внутри - с отступами */}
          <div style={{
            position: 'absolute',
            left: '53px',
            top: '53px',
            width: '898px',
            height: '1536px',
            backdropFilter: 'blur(50px)',
            background: 'black',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '30px',
            overflow: 'hidden',
          }}>
            {/* Контент с скроллом И ФЕЙДОМ */}
            <div style={{
              position: 'absolute',
              inset: 0,
              overflowY: 'auto',
              padding: '40px',
              WebkitMaskImage: 'linear-gradient(to bottom, black calc(100% - 80px), transparent 100%)',
              maskImage: 'linear-gradient(to bottom, black calc(100% - 80px), transparent 100%)',
            }}>
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
                {articleTitle}
              </h2>

              {/* Динамический рендер content_blocks */}
              {renderedBlocks}
            </div>
          </div>
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

          <div className="blur-wave" style={{
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