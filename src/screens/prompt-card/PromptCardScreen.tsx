import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getWorkshopPromptById } from '../../utils/contentApi';
import type { WorkshopPrompt } from '../../types/content';

// Images
import bgPattern from '../../assets/figma-welcome/pattern.png';
import logoSmall from '../../assets/figma-welcome/logo-small.png';

// Telegram WebApp types
declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        showPopup: (params: { message: string }) => void;
      };
    };
  }
}

// Local PNG assets from repo
import promptBadge from '../../assets/prompt-card/промпт плашка.png';
import supportButton from '../../assets/tour-video/support-button.png';
import logoFooter from '../../assets/figma-welcome/logo-footer.png';
import socialsIconsFooter from '../../assets/welcome-elements/socials-icons.png';

// New assets
import houseImage from '../../assets/laba-icons/дом на карточке промпта.png';
import threeLogoImg from '../../assets/laba-icons/три человека на фон.png';

export const PromptCardScreen: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [prompt, setPrompt] = useState<WorkshopPrompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Загрузка промпта по ID
  useEffect(() => {
    if (id) {
      loadPrompt(id);
      // Сохраняем в "недавние"
      saveToRecent(id);
    } else {
      // Если ID нет, используем статичные данные (для обратной совместимости)
      setLoading(false);
    }
  }, [id]);

  const saveToRecent = (promptId: string) => {
    try {
      const recent = JSON.parse(localStorage.getItem('metaflora_recent_prompts') || '[]');
      const updated = [promptId, ...recent.filter((id: string) => id !== promptId)].slice(0, 20);
      localStorage.setItem('metaflora_recent_prompts', JSON.stringify(updated));
    } catch (err) {
      console.error('Error saving to recent:', err);
    }
  };

  const loadPrompt = async (promptId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getWorkshopPromptById(promptId);

      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.data) {
        throw new Error('Промпт не найден');
      }

      setPrompt(result.data);
    } catch (err) {
      console.error('Error loading prompt:', err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  // Не показываем контент пока идет загрузка
  if (loading) {
    return (
      <div style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        background: '#020101',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          fontFamily: 'Gotham Pro',
          fontSize: '32px',
          color: 'white',
        }}>
          {/* Пустой экран при загрузке */}
        </div>
      </div>
    );
  }

  // Используем только динамические данные из Supabase
  const promptText = prompt?.prompt_text || '';
  const promptTitle = prompt?.title || '';
  const promptCoverUrl = prompt?.cover_image_url || '';

  const handleCopy = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(promptText);
      } else {
        const ta = document.createElement('textarea');
        ta.value = promptText;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      // Telegram WebApp popup
      if (window.Telegram?.WebApp?.showPopup) {
        window.Telegram.WebApp.showPopup({
          message: 'Скопировано в буфер обмена',
        });
      }
    } catch (err) {
      // ignore
    }
  };

  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;

  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      height: '100vh',
      background: '#020101',
      overflow: 'hidden',
    }}>
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

        {/* Background logo (три человека) */}
        <div style={{
          position: 'absolute',
          left: '147px',
          top: '1289px',
          width: '886px',
          height: '474px',
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            pointerEvents: 'none',
          }}>
            <img 
              src={threeLogoImg}
              alt=""
              style={{
                position: 'absolute',
                height: '222.88%',
                left: '-39.72%',
                top: '-55.58%',
                width: '179.18%',
                maxWidth: 'none',
              }}
            />
          </div>
        </div>

        {/* 7:1936 - Заголовок "карточка промпта" */}
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
          <p style={{ margin: 0, lineHeight: 1 }}>карточка промпта</p>
        </div>

        {/* 7:1937 - Описание */}
        <div style={{
          position: 'absolute',
          left: '85px',
          top: '290px',
          width: '668px',
          height: '80px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          fontFamily: 'Gotham Pro',
          fontSize: '40px',
          lineHeight: 1,
          color: 'white',
        }}>
          <p style={{ margin: 0, lineHeight: 1 }}>
            <span style={{ fontWeight: 700 }}>описание:</span>
            <span style={{ fontWeight: 300 }}> {prompt?.description || 'создайте и настройте копирайтера за один промпт'}</span>
          </p>
        </div>

        {/* Logo */}
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

        {/* Main card background - 368:1111 */}
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

        {/* Inner black card - 368:1113 (inside 368:1112 at x=141, y=452) */}
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
        }} />

        {/* Обложка промпта */}
        <div style={{
          position: 'absolute',
          left: '192px',
          top: '505px',
          width: '796px',
          height: '748px',
          borderRadius: '30px',
          overflow: 'hidden',
        }}>
          <img 
            src={promptCoverUrl}
            alt={promptTitle}
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

        {/* Заголовок промпта */}
        <div style={{
          position: 'absolute',
          left: '383px',
          top: '1285px',
          width: '414px',
          minHeight: '107px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          fontFamily: 'Inter',
          fontWeight: 700,
          fontSize: '52px',
          lineHeight: 1.2,
          color: 'white',
          textAlign: 'center',
        }}>
          {loading ? (
            <p style={{ margin: 0, lineHeight: 1.2, fontSize: '32px', color: 'rgba(255,255,255,0.5)' }}>Загрузка...</p>
          ) : error ? (
            <p style={{ margin: 0, lineHeight: 1.2, fontSize: '24px', color: '#ff4444' }}>Ошибка</p>
          ) : (
            <p style={{ margin: 0, lineHeight: 1.2 }}>{promptTitle}</p>
          )}
        </div>

        {/* Prompt badge - 368:1126 */}
        <img 
          src={promptBadge}
          alt="промпт"
          className="button-inner-glow"
          style={{
            position: 'absolute',
            left: '467px',
            top: '1435px',
            width: '246.93px',
            height: '79.25px',
            objectFit: 'contain',
          }}
        />

        {/* Текст промпта с onClick для копирования и скроллом */}
        <div 
          onClick={handleCopy}
          style={{
            position: 'absolute',
            left: '192px',
            top: '1540px',
            width: '796px',
            height: '390px',
            fontFamily: 'Gotham Pro',
            fontWeight: 300,
            fontSize: '35px',
            lineHeight: 1.2,
            color: 'white',
            textAlign: 'center',
            cursor: 'pointer',
            overflowY: 'auto',
            overflowX: 'hidden',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)',
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)',
            padding: '30px 20px',
          }}>
          <p style={{ margin: 0, lineHeight: 1.2, whiteSpace: 'pre-wrap' }}>
            {promptText}
          </p>
        </div>

        {/* Footer */}
        <div style={{
          position: 'absolute',
          left: 'calc(50% - 5px)',
          top: '2071px',
          width: '888px',
          height: '124px',
          transform: 'translateX(-50%)',
        }}>
          {/* Logo Footer */}
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
          
          {/* Copyright */}
          <div style={{
            position: 'absolute',
            left: 'calc(50% - 442px)',
            top: '56px',
            width: '433px',
            height: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            fontFamily: 'Gotham Pro',
            fontWeight: 300,
            fontSize: '20px',
            lineHeight: 1,
            color: 'white',
          }}>
            <p style={{ margin: 0, lineHeight: 1 }}>
              Copyright © Все права защищены.
            </p>
          </div>

          {/* Socials */}
          <div style={{
            position: 'absolute',
            left: 'calc(50% + 335px)',
            top: '13px',
            width: '196px',
            height: '51px',
            transform: 'translateX(-50%)',
          }}>
            {/* Background */}
            <div className="blur-wave" style={{
              position: 'absolute',
              left: '-17px',
              top: '-15px',
              width: '230px',
              height: '78px',
              backdropFilter: 'blur(50px)',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '4px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '62px',
            }} />

            {/* Telegram */}
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
                  src={socialsIconsFooter}
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
            
            {/* Other socials */}
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
                  src={socialsIconsFooter}
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