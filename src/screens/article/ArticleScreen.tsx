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
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

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
      // Добавляем timestamp для обхода кэша
      const timestamp = new Date().getTime();
      const result = await getPolygonArticleById(articleId + `?t=${timestamp}`);

      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.data) {
        throw new Error('Статья не найдена');
      }

      setArticle(result.data);
      
      // Логируем content_blocks для отладки
      console.log('[ARTICLE] Content blocks:', result.data.content_blocks);
      console.log('[ARTICLE] Materials block:', result.data.content_blocks?.find((b: any) => b.type === 'materials'));
    } catch (err) {
      console.error('Error loading article:', err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const articleTitle = article?.title || '';
  
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

  // ЕБАНУТЫЙ СКРИПТ для отправки материалов - КОПИЯ ИЗ ACADEMY
  const handleSendMaterials = async () => {
    try {
      // 1. Найти materials блок
      const materialsBlock = article?.content_blocks?.find((b: any) => b.type === 'materials');
      if (!materialsBlock) {
        console.error('[SEND] No materials block found');
        alert('В этой статье нет материалов');
        return;
      }
      
      // 2. БЕЗОПАСНЫЙ парсинг materials - все возможные сценарии
      let materials: any[] = [];
      
      try {
        const content = materialsBlock.content;
        
        // Сценарий 1: пустое значение
        if (!content || content === null || content === undefined) {
          console.error('[SEND] Materials content is empty');
          alert('Материалы не найдены');
          return;
        }
        
        // Сценарий 2: уже массив
        if (Array.isArray(content)) {
          materials = content;
        }
        // Сценарий 3: строка - парсим JSON
        else if (typeof content === 'string') {
          if (content.trim() === '') {
            console.error('[SEND] Materials content is empty string');
            alert('Материалы не найдены');
            return;
          }
          
          try {
            const parsed = JSON.parse(content);
            
            if (Array.isArray(parsed)) {
              materials = parsed;
            } else if (parsed && typeof parsed === 'object') {
              materials = [parsed];
            } else {
              console.error('[SEND] Parsed materials is not array/object:', typeof parsed);
              alert('Неверный формат материалов');
              return;
            }
          } catch (parseError) {
            console.error('[SEND] JSON parse error:', parseError, 'Content:', content);
            alert('Ошибка: материалы повреждены');
            return;
          }
        }
        // Сценарий 4: объект (не массив)
        else if (typeof content === 'object') {
          materials = [content];
        }
        else {
          console.error('[SEND] Unknown materials content type:', typeof content);
          alert('Неверный формат материалов');
          return;
        }
        
      } catch (parseError) {
        console.error('[SEND] Failed to process materials:', parseError);
        alert('Ошибка обработки материалов');
        return;
      }
      
      // 3. Проверка что массив не пустой
      if (!materials || materials.length === 0) {
        console.error('[SEND] Materials array is empty');
        alert('Нет файлов для отправки');
        return;
      }
      
      // 4. Валидация элементов массива
      const validMaterials = materials.filter((m: any) => {
        if (!m || typeof m !== 'object') return false;
        if (!m.url || typeof m.url !== 'string') return false;
        if (!m.name || typeof m.name !== 'string') return false;
        return true;
      });
      
      if (validMaterials.length === 0) {
        console.error('[SEND] No valid materials found (missing url/name)');
        alert('Файлы повреждены (отсутствуют ссылки)');
        return;
      }
      
      // 5. Получить userId от Telegram
      const userId = (window.Telegram?.WebApp as any)?.initDataUnsafe?.user?.id;
      if (!userId || userId === 'unknown') {
        console.error('[SEND] User ID not available');
        alert('Откройте мини-апп через Telegram');
        return;
      }

      console.log('[SEND] Sending materials:', {
        count: validMaterials.length,
        materials: validMaterials,
        articleTitle: article?.title,
        userId
      });

      // 6. Отправка на сервер (ПРАВИЛЬНЫЙ endpoint!)
      const response = await fetch('https://metaflora-service.ru/api/bot/send-materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materials: validMaterials,
          lessonTitle: article?.title || 'Статья',
          userId,
        }),
      });
      
      const result = await response.json();
      console.log('[SEND] API Response:', result);
      
      if (response.ok && result.success) {
        alert('материалы отправлены в чат с ботом');
      } else {
        console.error('[SEND] API error:', result);
        alert(`Ошибка отправки: ${result.error || 'Неизвестная ошибка'}`);
      }
      
    } catch (error: any) {
      console.error('[SEND] Critical error:', error);
      alert(`Критическая ошибка: ${error.message || error}`);
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
              onClick={() => setExpandedImage(block.content)}
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
                loading="eager"
                crossOrigin="anonymous"
                onError={(e) => {
                  console.error('[IMAGE ERROR]', e);
                  console.error('[IMAGE URL]', block.content);
                  const img = e.target as HTMLImageElement;
                  img.style.border = '2px solid rgba(255, 0, 0, 0.3)';
                  img.style.opacity = '0.5';
                }}
                onLoad={() => console.log('[IMAGE] Loaded:', block.content)}
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
                setExpandedImage(block.content);
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
        // БЕЗОПАСНЫЙ парсинг materials - НЕ ломает рендеринг при ошибках
        let materialsCount = 0;
        try {
          if (!block.content) {
            materialsCount = 0;
          } else if (typeof block.content === 'string') {
            try {
              const parsed = JSON.parse(block.content);
              materialsCount = Array.isArray(parsed) ? parsed.length : 0;
            } catch {
              // Если не JSON - может быть просто число
              materialsCount = parseInt(block.content) || 0;
            }
          } else if (Array.isArray(block.content)) {
            materialsCount = block.content.length;
          } else {
            materialsCount = 0;
          }
        } catch (err) {
          console.error('Error parsing materials count:', err);
          materialsCount = 0;
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

  // БЕЗОПАСНЫЙ рендеринг - если один блок сломается, остальные продолжат работать
  const renderedBlocks = contentBlocks
    .map((block: any) => {
      try {
        return renderContentBlock(block);
      } catch (error) {
        console.error('[RENDER] Block render error:', block.type, block.id, error);
        // Возвращаем заглушку вместо null
        return (
          <div key={block.id} style={{
            padding: '20px',
            margin: '20px 0',
            background: 'rgba(255, 0, 0, 0.1)',
            border: '2px solid rgba(255, 0, 0, 0.3)',
            borderRadius: '10px',
            color: 'rgba(255, 255, 255, 0.5)',
            textAlign: 'center',
            fontSize: '14px',
          }}>
            Ошибка загрузки блока ({block.type})
          </div>
        );
      }
    })
    .filter(Boolean);

  return (
    <>
      {/* Fullscreen Image Overlay - КАК В ACADEMY */}
      {expandedImage && (
        <div
          onClick={() => setExpandedImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            backdropFilter: 'blur(20px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <img
            src={expandedImage}
            alt="Полноэкранное изображение"
            style={{
              maxWidth: '95vw',
              maxHeight: '95vh',
              objectFit: 'contain',
            }}
          />
        </div>
      )}

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
    </>
  );
};